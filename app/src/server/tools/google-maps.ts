/**
 * Google Maps discovery tool.
 *
 * - Keyless: scrapes the public Maps search results page, extracting the
 *   place tiles (name / address / phone) from each result anchor.
 * - With GOOGLE_MAPS_API_KEY: uses the Places API (Text Search + Place Details)
 *   which returns phone + website reliably.
 */

import type { LeadDiscoveryProvider, RawLead, SearchCriteria } from "@/lib/types";
import { buildSearchQueries, fetchHtml, decodeEntities, normalizePhone, phoneInText } from "./lib";

const MAX_PER_QUERY = 12;

export class GoogleMapsDiscoveryTool implements LeadDiscoveryProvider {
  id = "google-maps";
  label = "Google Maps";
  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_MAPS_API_KEY);
  }

  async search(criteria: SearchCriteria): Promise<RawLead[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) return this.searchWithApi(criteria, apiKey);
    return this.searchKeyless(criteria);
  }

  // ─── Keyless scraping ────────────────────────────────────

  private async searchKeyless(criteria: SearchCriteria): Promise<RawLead[]> {
    const queries = buildSearchQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, 2)) {
      const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en`;
      const html = await fetchHtml(url, 12_000);

      const placeRe =
        /<a[^>]*class="([^"]*hfpxzc[^"]*)"[^>]*aria-label="([\s\S]*?)"[^>]*href="(\/maps\/place\/[^"]*?)"/g;
      let match: RegExpExecArray | null;

      while ((match = placeRe.exec(html)) !== null) {
        const label = decodeEntities(match[2]).replace(/\s+/g, " ").trim();
        if (!label) continue;

        const name = label.split(/\s{2,}| \| /)[0]?.trim();
        if (!name || name.length < 2) continue;

        const phone = phoneInText(label);
        const city = criteria.location?.city || undefined;
        const state = criteria.location?.state || undefined;

        all.push({
          name: name.slice(0, 120),
          phone,
          location: [label.replace(name, ""), city, state].filter(Boolean).join(", ").slice(0, 200) || undefined,
          category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
          source: "google-maps",
        });
      }

      if (all.length >= MAX_PER_QUERY) break;
    }

    return all.slice(0, MAX_PER_QUERY * 2);
  }

  // ─── Places API (requires key) ───────────────────────────

  private async searchWithApi(criteria: SearchCriteria, apiKey: string): Promise<RawLead[]> {
    const queries = buildSearchQueries(criteria);
    const all: RawLead[] = [];

    for (const query of queries.slice(0, 2)) {
      const listUrl =
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}` +
        `&key=${apiKey}&language=en`;
      const listRes = await fetch(listUrl, { signal: AbortSignal.timeout(12_000) });
      if (!listRes.ok) throw new Error(`Places Text Search HTTP ${listRes.status}`);

      const listJson = (await listRes.json()) as {
        status: string;
        results?: Array<{
          place_id: string;
          name: string;
          formatted_address?: string;
        }>;
      };

      if (listJson.status !== "OK" || !listJson.results) {
        break;
      }

      for (const place of listJson.results.slice(0, MAX_PER_QUERY)) {
        const detailUrl =
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}` +
          `&fields=formatted_phone_number,international_phone_number,website,name,formatted_address` +
          `&key=${apiKey}`;
        const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(10_000) });
        if (!detailRes.ok) continue;

        const detailJson = (await detailRes.json()) as {
          result?: {
            formatted_phone_number?: string;
            international_phone_number?: string;
            website?: string;
            name?: string;
            formatted_address?: string;
          };
        };
        const d = detailJson.result;
        if (!d || !d.name) continue;

        all.push({
          name: d.name.slice(0, 120),
          phone: normalizePhone(d.international_phone_number || d.formatted_phone_number),
          website: d.website || undefined,
          location: d.formatted_address || place.formatted_address || undefined,
          category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
          source: "google-maps",
        });
      }
    }

    return all.slice(0, MAX_PER_QUERY * 2);
  }
}