/**
 * LinkedIn discovery tool — best-effort public scraping.
 *
 * LinkedIn requires authentication for real search; anonymous requests
 * are met with an auth wall (HTTP 999 / login redirect). This tool always
 * degrades gracefully to "no results" with a status note so it can never
 * break the pipeline. Configure LINKEDIN_SCRAPE_URL with a proxy/scraping
 * service to enable real results.
 */

import type { LeadDiscoveryProvider, RawLead, SearchCriteria } from "@/lib/types";
import { buildSearchQueries, fetchHtml, decodeEntities } from "./lib";

const MAX_PER_QUERY = 10;

export class LinkedInDiscoveryTool implements LeadDiscoveryProvider {
  id = "linkedin";
  label = "LinkedIn";
  isConfigured(): boolean {
    return Boolean(process.env.LINKEDIN_SCRAPE_URL);
  }

  async search(criteria: SearchCriteria): Promise<RawLead[]> {
    const proxyUrl = process.env.LINKEDIN_SCRAPE_URL;
    if (proxyUrl) return this.searchViaProxy(criteria, proxyUrl);
    return this.searchPublic(criteria);
  }

  private async searchViaProxy(criteria: SearchCriteria, proxyUrl: string): Promise<RawLead[]> {
    const queries = buildSearchQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, 3)) {
      const target =
        `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(query)}`;
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        results?: Array<{ name: string; url: string; location?: string }>;
        html?: string;
      };

      if (Array.isArray(json.results)) {
        for (const r of json.results) {
          if (!r.name || !r.url) continue;
          all.push({
            name: r.name.slice(0, 120),
            website: r.url,
            location: r.location || criteria.location?.city || undefined,
            category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
            source: "linkedin",
          });
        }
      } else if (json.html) {
        all.push(...this.parsePublicHtml(json.html, criteria));
      }
    }

    return all.slice(0, MAX_PER_QUERY * 3);
  }

  private async searchPublic(criteria: SearchCriteria): Promise<RawLead[]> {
    const queries = buildSearchQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, 2)) {
      const url =
        `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(query)}`;
      const html = await fetchHtml(url, 10_000);
      all.push(...this.parsePublicHtml(html, criteria));
    }

    return all.slice(0, MAX_PER_QUERY * 2);
  }

  private parsePublicHtml(html: string, criteria: SearchCriteria): RawLead[] {
    // Auth wall detection — most anonymous requests end here.
    if (
      html.includes("authwall") ||
      html.includes('"signedOut"') ||
      html.includes("To show you what you're looking for")
    ) {
      return [];
    }

    const out: RawLead[] = [];
    const companyRe = /\/company\/([^\/"?]+)[^"]*"[\s\S]*?aria-label="([^"]+)"/gi;
    let match: RegExpExecArray | null;

    while ((match = companyRe.exec(html)) !== null) {
      const slug = decodeURIComponent(match[1]).replace(/[-_]+/g, " ");
      const label = decodeEntities(match[2]).trim();
      const name = (label || slug).slice(0, 120);
      const loc = (label.match(/\b[A-Z]{2}\b/) || [])[0] || criteria.location?.city;

      out.push({
        name,
        website: `https://www.linkedin.com/company/${match[1]}`,
        location: loc || undefined,
        category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
        source: "linkedin",
      });
    }

    return out;
  }
}