import {
  ApolloMatchResponseSchema,
  ApolloSearchRequest,
  ApolloSearchRequestSchema,
  ApolloSearchResponse,
  ApolloSearchResponseSchema,
  ApolloClientOptions,
  ApolloPerson,
} from "@/lib/apollo/types";
import type { RawLead } from "@/lib/types";
import { normalizePhone } from "@/server/services/scraper/phone-extractor";

export class ApolloApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApolloApiError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFormParams(body: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") params.append(key, String(item));
      }
    } else if (value !== "") {
      params.append(key, String(value));
    }
  }
  return params;
}

export class ApolloClient {
  private readonly baseUrl: string;
  private readonly perPage: number;
  private readonly maxPages: number;
  private readonly timeoutMs: number;
  private readonly reveal: boolean;

  constructor(
    private readonly apiKey: string,
    opts: ApolloClientOptions = {}
  ) {
    this.baseUrl = (opts.baseUrl ?? "https://api.apollo.io/api/v1").replace(/\/+$/, "");
    this.perPage = opts.perPage ?? 25;
    this.maxPages = opts.maxPages ?? 1;
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.reveal = opts.reveal ?? false;
  }

  private async requestRaw(path: string, body: Record<string, unknown>): Promise<unknown> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Api-Key": this.apiKey,
          },
          body: toFormParams(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (res.status === 429) {
          const waitMs = Number(res.headers.get("Retry-After") ?? 2) * 1000 * attempt;
          await sleep(waitMs);
          continue;
        }
        if (res.status === 401) {
          throw new ApolloApiError("Invalid Apollo API key", 401);
        }
        if (res.status === 402) {
          throw new ApolloApiError("Apollo credit limit reached. Add credits or turn off Reveal.", 402, "insufficient_credits");
        }
        if (res.status === 400) {
          const text = (await res.clone().text()).slice(0, 300);
          const creditIssue = /credit/i.test(text);
          throw new ApolloApiError(
            creditIssue ? "Apollo credit limit reached. Add credits or turn off Reveal." : `Apollo invalid request: ${text}`,
            400,
            creditIssue ? "insufficient_credits" : undefined
          );
        }
        if (res.status >= 500) {
          await sleep(1500 * attempt);
          continue;
        }
        if (!res.ok) {
          throw new ApolloApiError(`Apollo HTTP ${res.status}`, res.status);
        }
        return await res.json();
      } catch (err) {
        if (err instanceof ApolloApiError && err.status !== 0) throw err;
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 3) await sleep(800 * attempt);
      }
    }
    throw new ApolloApiError(`Apollo request failed: ${lastError?.message || "unknown"}`, 0);
  }

  async search(request: ApolloSearchRequest): Promise<ApolloSearchResponse> {
    const safe = ApolloSearchRequestSchema.safeParse(request);
    if (!safe.success) return { people: [] };

    const json = await this.requestRaw("/people/search", {
      ...safe.data,
      reveal_contacts: safe.data.reveal_contacts ?? this.reveal,
    });

    const parsed = ApolloSearchResponseSchema.safeParse(json);
    if (!parsed.success) return { people: [] };
    return parsed.data;
  }

  async searchPeoplePages(request: ApolloSearchRequest): Promise<ApolloPerson[]> {
    const all: ApolloPerson[] = [];
    for (let page = 1; page <= this.maxPages; page++) {
      const res = await this.search({ ...request, page, per_page: this.perPage });
      all.push(...res.people);
      const totalPages = res.pagination?.total_pages ?? 1;
      if (page >= totalPages) break;
    }
    return all;
  }

  async matchPerson(person: Record<string, unknown>, reveal = false): Promise<ApolloPerson | null> {
    const json = await this.requestRaw("/people/match", {
      ...person,
      reveal_contacts: reveal,
    });
    const parsed = ApolloMatchResponseSchema.safeParse(json);
    if (!parsed.success) return null;
    return parsed.data.person ?? null;
  }
}

export function normalizeApolloPerson(p: ApolloPerson): RawLead {
  const name = p.name || [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Unknown Contact";
  const region = [p.city, p.state, p.country].filter(Boolean).join(", ");
  const phone = p.phone ? normalizePhone(p.phone) : "";
  const linkedin = p.linkedin_url || p.linkedin_url_alternate || p.linkedin_user_url || undefined;
  const email = p.email || undefined;

  return {
    name,
    phone: phone || undefined,
    website: p.organization?.website_url || undefined,
    location: region || undefined,
    category: p.organization?.industry || undefined,
    source: "apollo",
    sourceId: p.id,
    employeeCount: p.organization?.employee_count ?? p.organization?.employee_count_range?.start ?? undefined,
    decisionMaker: p.title ?? undefined,
    metadata: {
      source: "apollo",
      apolloId: p.id,
      title: p.title,
      seniority: p.seniority,
      organization: p.organization?.name,
      organizationId: p.organization?.id,
      email,
      emailStatus: p.email_status,
      phoneStatus: p.phone_status,
      photoUrl: p.photo_url,
      linkedinUrl: linkedin,
      emails: email ? [email] : [],
      socialProfiles: linkedin ? [{ platform: "linkedin", url: linkedin }] : [],
      revealRequired: !phone || !email,
    },
  };
}