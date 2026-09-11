/**
 * DuckDuckGo web-search discovery tool (keyless).
 *
 * Scrapes DuckDuckGo's server-rendered HTML results page. Searches are
 * build to exclude aggregator/review sites so organic practice and
 * business websites surface instead. Results include websites but not
 * phones; the enrichment stage later fetches each site to extract
 * contact info.
 */

import type { LeadDiscoveryProvider, RawLead, SearchCriteria } from "@/lib/types";
import { fetchHtml, decodeEntities, hostOf } from "./lib";

const MAX_PER_QUERY = 15;
const MAX_QUERIES = 3;

const EXCLUDE_WORDS = [
  "-yelp",
  "-zocdoc",
  "-opencare",
  "-healthgrades",
  "-ratemds",
  "-toprated",
  "-reviews",
  "-yellowpages",
  "-trustpilot",
  "-wikipedia",
];

const BLOCKED_HOSTS = [
  "yelp.com",
  "zocdoc.com",
  "opencare.com",
  "healthgrades.com",
  "ratemds.com",
  "yellowpages.com",
  "trustpilot.com",
  "webmd.com",
  "wikipedia.org",
  "facebook.com",
  "linkedin.com",
  "instagram.com",
  "reddit.com",
  "statesman.com",
  "toprateddentist.com",
  "rankmydentist.com",
  "covercapy.com",
  "patientconnect365.com",
  "amazon.com",
  "bbb.org",
];

export class DuckDuckGoDiscoveryTool implements LeadDiscoveryProvider {
  id = "duckduckgo";
  label = "DuckDuckGo";
  isConfigured(): boolean {
    return true;
  }

  private buildQueries(criteria: SearchCriteria): string[] {
    const locationText = [criteria.location?.city, criteria.location?.state]
      .filter(Boolean)
      .join(", ");
    const keywords = (criteria.industry || ["business"])
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, MAX_QUERIES);
    const exclusion = EXCLUDE_WORDS.join(" ");
    const queries: string[] = [];
    for (const kw of keywords) {
      const parts = [kw, locationText, exclusion].filter(Boolean);
      queries.push(parts.join(" "));
    }
    return queries;
  }

  private parseResult(href: string, maybeTitle: string, snippet: string): RawLead | null {
    const decodedHref = decodeEntities(href);
    let url = decodedHref;
    if (decodedHref.startsWith("//") || decodedHref.includes("duckduckgo.com/l/")) {
      const uddg = decodedHref.match(/[?&]uddg=([^&]+)/);
      if (uddg?.[1]) {
        try {
          url = decodeURIComponent(uddg[1]);
        } catch {
          url = decodedHref;
        }
      }
    }
    if (!url.startsWith("http")) return null;

    let host: string | undefined;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
    if (BLOCKED_HOSTS.some((h) => host?.includes(h) || host === h)) return null;

    const title = decodeEntities(maybeTitle.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (!title || title.length < 2) return null;

    const name = title
      .split(/\s[–|│|-]\s|\s\|\s|\s-\s/)
      .map((p) => p.trim())
      .find((p) => p.length > 0) || title;

    return {
      name: name.slice(0, 120),
      website: url,
      category: undefined,
      source: "duckduckgo",
      metadata: {
        snippet: decodeEntities(snippet.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 300) || undefined,
      },
    };
  }

  async search(criteria: SearchCriteria): Promise<RawLead[]> {
    const queries = this.buildQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, MAX_QUERIES)) {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      let html = await this.fetchResults(url);
      if (html.includes("anomaly") || !/<a[^>]*class="result__a"/.test(html)) {
        await new Promise((r) => setTimeout(r, 8000));
        html = await this.fetchResults(url);
      }

      const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      const snippetRe = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

      const links: Array<{ href: string; title: string }> = [];
      let match: RegExpExecArray | null;
      while ((match = linkRe.exec(html)) !== null) {
        links.push({ href: match[1], title: match[2] });
      }

      const snippets: string[] = [];
      while ((match = snippetRe.exec(html)) !== null) {
        snippets.push(match[1]);
      }

      links.forEach((link, i) => {
        const lead = this.parseResult(link.href, link.title, snippets[i] || "");
        if (lead) all.push(lead);
      });

      if (links.length === 0) break;
    }

    const seen = new Set<string>();
    const out: RawLead[] = [];
    for (const lead of all) {
      const key = hostOf(lead.website) || lead.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(lead);
    }
    return out.slice(0, MAX_PER_QUERY);
  }

  private async fetchResults(url: string): Promise<string> {
    try {
      return await fetchHtml(url, 12_000);
    } catch {
      return "";
    }
  }
}