import type { LeadDiscoveryProvider, RawLead, SearchCriteria, SearchStrategyPlan } from "@/lib/types";
import { buildApolloSearchRequest } from "@/lib/apollo/query-translator";
import { ApolloClient, normalizeApolloPerson } from "@/server/services/apollo/client";
import { getSetting } from "@/lib/settings";

export class ApolloDiscoveryTool implements LeadDiscoveryProvider {
  id = "apollo";
  label = "Apollo.io";

  isConfigured(): boolean {
    return Boolean(process.env.APOLLO_API_KEY);
  }

  private async revealEnabled(): Promise<boolean> {
    try {
      const stored = await getSetting("apollo.reveal");
      if (stored === "on" || stored === "true") return true;
      if (stored === "off" || stored === "false" || stored === "") return false;
    } catch {
      // fall through to env default
    }
    return (process.env.APOLLO_REVEAL_DEFAULT || "false") === "true";
  }

  async search(criteria: SearchCriteria, opts?: { strategy?: SearchStrategyPlan }): Promise<RawLead[]> {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) return [];

    const perPage = Number(process.env.APOLLO_PER_PAGE || 25);
    const maxPages = Number(process.env.APOLLO_MAX_PAGES || 1);

    let reveal: boolean;
    try {
      reveal = await this.revealEnabled();
    } catch {
      reveal = false;
    }

    const client = new ApolloClient(apiKey, {
      baseUrl: process.env.APOLLO_BASE_URL,
      perPage,
      maxPages,
      timeoutMs: Number(process.env.APOLLO_TIMEOUT_MS || 20_000),
      reveal,
    });

    const base = buildApolloSearchRequest(criteria, opts?.strategy, { perPage });

    const attempts: Array<Record<string, unknown>> = [
      { ...base },
      { ...base, organization_locations: undefined, person_locations: undefined },
      { ...base, organization_locations: undefined, person_locations: undefined, person_titles: undefined, person_seniorities: undefined },
    ];

    for (const attempt of attempts) {
      try {
        const people = await client.searchPeoplePages(attempt as Parameters<ApolloClient["search"]>[0]);
        if (people.length > 0) return people.map(normalizeApolloPerson);
      } catch (err) {
        console.warn("[Apollo] search attempt failed:", err instanceof Error ? err.message : err);
      }
    }
    return [];
  }
}