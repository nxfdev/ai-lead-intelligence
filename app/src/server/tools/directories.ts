/**
 * Business directory discovery tool (keyless Yellow Pages scraping).
 *
 * Directory listings provide name, phone, address and website links —
 * the primary keyless source of phone numbers.
 */

import type { LeadDiscoveryProvider, RawLead, SearchCriteria } from "@/lib/types";
import { buildSearchQueries, fetchHtml, decodeEntities, normalizePhone, isInternalUrl } from "./lib";

const MAX_PER_QUERY = 15;

export class DirectoryDiscoveryTool implements LeadDiscoveryProvider {
  id = "directories";
  label = "Directories";
  isConfigured(): boolean {
    return true;
  }

  async search(criteria: SearchCriteria): Promise<RawLead[]> {
    const queries = buildSearchQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, 2)) {
      const [terms, ...geoParts] = query.split(",");
      const geo = geoParts.join(",").trim() || criteria.location?.city || "";
      const url =
        `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(terms.trim())}` +
        `&geo_location_terms=${encodeURIComponent(geo || "United States")}`;

      const html = await fetchHtml(url, 12_000);
      all.push(...this.parseResults(html, criteria));

      if (all.length >= MAX_PER_QUERY * 2) break;
    }

    return all.slice(0, MAX_PER_QUERY * 2);
  }

  private parseResults(html: string, criteria: SearchCriteria): RawLead[] {
    const out: RawLead[] = [];
    const nameRe = /<a class="business-name"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = nameRe.exec(html)) !== null) {
      const name = decodeEntities(stripTag(match[2])).trim();
      if (!name || name.length < 2) continue;

      // Look at the ~1200 chars following this listing for phone/website/address.
      const tail = html.slice(match.index, match.index + 1400);

      const phone = this.extractPhone(tail);
      const website = this.extractWebsite(tail);
      const location = this.extractAddress(tail);

      out.push({
        name: name.slice(0, 120),
        phone,
        website,
        location: location || undefined,
        category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
        source: "directories",
      });
    }

    return out;
  }

  private extractPhone(tail: string): string | undefined {
    const tel = /href="tel:([^"]+)"/gi.exec(tail);
    if (tel) return normalizePhone(tel[1]);
    const dataPhone = /data-phone="([^"]+)"/gi.exec(tail);
    if (dataPhone) return normalizePhone(dataPhone[1]);
    const phoneDiv = /<div class="phone"[^>]*>\s*([^<]+)\s*<\/div>/gi.exec(tail);
    if (phoneDiv) return normalizePhone(phoneDiv[1]);
    const general = /(\+?1[\s.-]?)?(?:\((\d{3})\)|(\d{3}))[\s.-]?(\d{3})[\s.-]?(\d{4})/.exec(tail);
    if (general) return normalizePhone(general[0]);
    return undefined;
  }

  private extractWebsite(tail: string): string | undefined {
    const visit = /class="[^"]*track-visit-website[^"]*"[^>]*href="([^"]+)"/gi.exec(tail);
    if (visit) {
      const href = decodeEntities(visit[1]);
      if (!isInternalUrl(href)) return href;
    }
    const anyLink = /href="(https?:\/\/[^"]+)"/gi.exec(tail);
    if (anyLink && !isInternalUrl(anyLink[1])) return anyLink[1];
    return undefined;
  }

  private extractAddress(tail: string): string | undefined {
    const adr = /<div class="adr">([\s\S]*?)<\/div>/gi.exec(tail);
    if (adr) {
      const text = decodeEntities(stripTag(adr[1])).replace(/\s+/g, " ").trim();
      if (text) return text.slice(0, 200);
    }
    return undefined;
  }
}

function stripTag(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}