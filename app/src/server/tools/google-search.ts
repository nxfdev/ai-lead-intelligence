/**
 * Web search discovery tool (Google).
 *
 * - With SERP_API_KEY: uses Serper.dev structured API (reliable JSON).
 * - Keyless: scrapes Google's basic HTML search results page for
 *   organic business site links.
 *
 * Search results include websites but not phones; enrichment later
 * fetches each site to extract contact info.
 */

import type { LeadDiscoveryProvider, RawLead, SearchCriteria } from "@/lib/types";
import { buildSearchQueries, fetchHtml, decodeEntities, isInternalUrl, hostOf } from "./lib";

const MAX_PER_QUERY = 15;

export class GoogleSearchDiscoveryTool implements LeadDiscoveryProvider {
  id = "google-search";
  label = "Google Search";
  isConfigured(): boolean {
    return Boolean(process.env.SERP_API_KEY);
  }

  async search(criteria: SearchCriteria): Promise<RawLead[]> {
    const apiKey = process.env.SERP_API_KEY;
    if (apiKey) return this.searchWithSerper(criteria, apiKey);
    return this.searchKeyless(criteria);
  }

  private async searchWithSerper(criteria: SearchCriteria, apiKey: string): Promise<RawLead[]> {
    const queries = buildSearchQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, 3)) {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({ q: query, num: MAX_PER_QUERY, gl: "us", hl: "en" }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);

      const json = (await res.json()) as {
        organic?: Array<{ title: string; link: string; snippet?: string }>;
      };

      for (const item of json.organic || []) {
        if (!item.link || isInternalUrl(item.link)) continue;
        all.push({
          name: decodeEntities(item.title.replace(/[|]|[-]\s.*$/, "").trim()).slice(0, 120),
          website: item.link,
          category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
          source: "google-search",
          metadata: { snippet: item.snippet?.slice(0, 300) },
        });
      }
    }

    return this.dedupeByHost(all);
  }

  private async searchKeyless(criteria: SearchCriteria): Promise<RawLead[]> {
    const queries = buildSearchQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, 3)) {
      const url =
        `https://www.google.com/search?q=${encodeURIComponent(query)}&num=15&hl=en&gl=us&gbv=1&filter=0`;
      const html = await fetchHtml(url, 12_000);

      // Parse /url?q=... links and <h3> result titles.
      const linkRe = /href="\/url\?q=([^&"]+)[^"]*"/g;
      const titleRe = /<h3[^>]*>([\s\S]*?)<\/h3>/g;

      const links: string[] = [];
      let linkMatch: RegExpExecArray | null;
      while ((linkMatch = linkRe.exec(html)) !== null) {
        let href = decodeEntities(linkMatch[1]);
        try {
          href = new URL(href).toString();
        } catch {
          continue;
        }
        if (!href.startsWith("http") || isInternalUrl(href)) continue;
        links.push(href);
      }

      const titles: string[] = [];
      let titleMatch: RegExpExecArray | null;
      while ((titleMatch = titleRe.exec(html)) !== null) {
        titles.push(stripTag(titleMatch[1]).trim());
      }

      for (let i = 0; i < links.length; i++) {
        const title = titles[i] || new URL(links[i]).hostname;
        all.push({
          name: decodeEntities(title).slice(0, 120),
          website: links[i],
          category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
          source: "google-search",
        });
      }
    }

    return this.dedupeByHost(all);
  }

  private dedupeByHost(leads: RawLead[]): RawLead[] {
    const seen = new Set<string>();
    const out: RawLead[] = [];
    for (const lead of leads) {
      const key = hostOf(lead.website) || lead.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(lead);
    }
    return out.slice(0, MAX_PER_QUERY * 3);
  }
}

function stripTag(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}