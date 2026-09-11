/**
 * Scraper utilities shared by the discovery tools.
 */

import type { RawLead, SearchCriteria } from "@/lib/types";

export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export async function fetchHtml(url: string, timeoutMs = 10_000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "en-US,en;q=0.8",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  if (html.length < 200) throw new Error(`Empty page from ${url}`);
  return html;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

export function normalizePhone(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 7) return undefined;
  return undefined;
}

export function phoneInText(text: string): string | undefined {
  const re =
    /(\+?1[\s.-]?)?(?:\((\d{3})\)|(\d{3}))[\s.-]?(\d{3})[\s.-]?(\d{4})/g;
  const match = re.exec(text);
  if (!match) return undefined;
  const raw = match[0];
  return normalizePhone(raw);
}

export function hostOf(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function isInternalUrl(href: string): boolean {
  const lower = href.toLowerCase();
  return (
    !href.startsWith("http") ||
    lower.includes("google.com") ||
    lower.includes("yellowpages.com") ||
    lower.includes("maps.google")
  );
}

export function uniqueKeyOf(lead: RawLead): string {
  const phone = normalizePhone(lead.phone);
  const host = hostOf(lead.website);
  const name = lead.name.trim().toLowerCase().replace(/\s+/g, " ");
  return phone || host || (name.length >= 3 ? name : "");
}

export function dedupeLeads(leads: RawLead[]): RawLead[] {
  const seen = new Set<string>();
  const out: RawLead[] = [];
  for (const lead of leads) {
    const key = uniqueKeyOf(lead);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(lead);
  }
  return out;
}

export function buildSearchQueries(criteria: SearchCriteria): string[] {
  const locationText = [criteria.location?.city, criteria.location?.state]
    .filter(Boolean)
    .join(", ");
  const industries = (criteria.industry || []).map((i) => i.trim()).filter(Boolean);
  const keywords = industries.length ? industries : ["business"];
  const limit = Math.min(3, keywords.length);

  const queries: string[] = [];
  for (let i = 0; i < limit; i++) {
    const parts = [keywords[i]];
    if (locationText) parts.push(locationText);
    queries.push(parts.join(" "));
  }
  return queries;
}

// ─── User-Agent Pool & Anti-Bot Protection ──────────────────

export const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:129.0) Gecko/20100101 Firefox/129.0",
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function jitterDelay(minMs = 800, maxMs = 2500): Promise<void> {
  const duration = Math.floor(minMs + Math.random() * (maxMs - minMs));
  await new Promise((resolve) => setTimeout(resolve, duration));
}

export function extractEmailsFromText(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const matches = text.match(emailRegex) || [];
  const invalidExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".js", ".css"];
  return Array.from(new Set(matches))
    .map((e) => e.toLowerCase().trim())
    .filter((e) => !invalidExtensions.some((ext) => e.endsWith(ext)));
}

export function extractDomain(urlOrDomain: string): string | null {
  if (!urlOrDomain) return null;
  try {
    let raw = urlOrDomain.trim();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = `https://${raw}`;
    }
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host.length > 3 ? host : null;
  } catch {
    return null;
  }
}