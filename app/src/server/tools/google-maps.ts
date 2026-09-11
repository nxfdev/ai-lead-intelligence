/**
 * Google Maps discovery tool — Hybrid Engine (TypeScript Native)
 *
 * Inspired by omkarcloud/google-maps-scraper (https://github.com/omkarcloud/google-maps-scraper)
 * - Keyless HTTP Mode: Rapid extraction via public Google Maps tiles + Cheerio.
 * - Deep Mode (Playwright): Automates browser scrolling on Google Maps to extract
 *   ratings, reviews, direct websites, and phones with proxy & user-agent rotation.
 * - Official Places API Mode: Available when GOOGLE_MAPS_API_KEY is configured.
 */

import type { LeadDiscoveryProvider, RawLead, SearchCriteria, SearchStrategyPlan } from "@/lib/types";
import {
  buildSearchQueries,
  fetchHtml,
  decodeEntities,
  normalizePhone,
  phoneInText,
  getRandomUserAgent,
  jitterDelay,
} from "./lib";
import * as cheerio from "cheerio";

const MAX_PER_QUERY = 15;

export interface GoogleMapsSearchOptions {
  strategy?: SearchStrategyPlan;
  useDeepBrowser?: boolean;
  proxyUrl?: string;
}

export class GoogleMapsDiscoveryTool implements LeadDiscoveryProvider {
  id = "google-maps";
  label = "Google Maps";

  isConfigured(): boolean {
    return true; // Keyless works out of the box; API key enhances it
  }

  async search(criteria: SearchCriteria, options?: GoogleMapsSearchOptions): Promise<RawLead[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) return this.searchWithApi(criteria, apiKey);

    if (options?.useDeepBrowser || process.env.ENABLE_DEEP_BROWSER === "true") {
      try {
        return await this.searchWithPlaywright(criteria, options);
      } catch (err) {
        console.warn("[GoogleMaps] Playwright deep scrape failed, falling back to HTTP:", (err as Error).message);
      }
    }

    return this.searchKeyless(criteria, options?.strategy);
  }

  // ─── Keyless HTTP + Cheerio extraction ───────────────────

  private async searchKeyless(criteria: SearchCriteria, strategy?: SearchStrategyPlan): Promise<RawLead[]> {
    const queries = strategy?.mapsQueries?.length
      ? strategy.mapsQueries.slice(0, 3)
      : buildSearchQueries(criteria);

    const all: RawLead[] = [];

    for (const query of queries.slice(0, 3)) {
      await jitterDelay(400, 1200);

      // Try Google Local Places endpoint first (server-rendered local 3-pack)
      const lclUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=lcl&hl=en`;
      try {
        const lclHtml = await fetchHtml(lclUrl, 10_000);
        const $lcl = cheerio.load(lclHtml);

        $lcl("div.VkpGBb, div.rllt__details").each((_, el) => {
          const cardText = $lcl(el).text();
          const nameEl = $lcl(el).find(".dbg0pd, [role='heading']").first();
          const name = nameEl.text().trim() || $lcl(el).find("div").first().text().trim();
          if (!name || name.length < 2 || name.toLowerCase().includes("hours") || name.toLowerCase().includes("maps")) return;

          const phone = phoneInText(cardText);
          const websiteHref = $lcl(el).find("a[href^='http']").not("[href*='google.com']").attr("href");

          all.push({
            name: name.slice(0, 120),
            phone,
            website: websiteHref || undefined,
            location: criteria.location?.city ? `${criteria.location.city}, ${criteria.location.state || ""}` : undefined,
            category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
            source: "google-maps",
            metadata: {
              rawText: cardText.slice(0, 200),
            },
          });
        });
      } catch {}

      // If needed, also query Google Maps search page
      if (all.length < MAX_PER_QUERY) {
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en`;
        try {
          const html = await fetchHtml(url, 10_000);
          const $ = cheerio.load(html);

          $('a[href*="/maps/place/"]').each((_, el) => {
            const ariaLabel = $(el).attr("aria-label");
            const href = $(el).attr("href") || "";
            if (!ariaLabel) return;

            const label = decodeEntities(ariaLabel).replace(/\s+/g, " ").trim();
            const name = label.split(/\s{2,}| \| /)[0]?.trim();
            if (!name || name.length < 2) return;

            const phone = phoneInText(label);
            const city = criteria.location?.city || undefined;
            const state = criteria.location?.state || undefined;

            const ratingMatch = label.match(/(\d(?:\.\d)?)\s+stars?/i);
            const reviewsMatch = label.match(/(\d[\d,]*)\s+reviews?/i);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
            const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/,/g, ""), 10) : undefined;

            all.push({
              name: name.slice(0, 120),
              phone,
              location: [label.replace(name, ""), city, state].filter(Boolean).join(", ").slice(0, 200) || undefined,
              category: (criteria.industry || []).slice(0, 3).join(", ") || undefined,
              source: "google-maps",
              sourceId: href,
              metadata: {
                rating,
                reviewCount: reviews,
                mapsUrl: href.startsWith("http") ? href : `https://www.google.com${href}`,
              },
            });
          });
        } catch (err) {
          console.warn(`[GoogleMaps] Failed query "${query}":`, (err as Error).message);
        }
      }

      if (all.length >= MAX_PER_QUERY * 2) break;
    }

    return all.slice(0, MAX_PER_QUERY * 3);
  }

  // ─── Playwright Deep Scraper Mode ────────────────────────

  private async searchWithPlaywright(
    criteria: SearchCriteria,
    options?: GoogleMapsSearchOptions
  ): Promise<RawLead[]> {
    // Dynamically import playwright to keep cold starts lean
    const { chromium } = await import("playwright");

    const proxy = options?.proxyUrl || process.env.SCRAPER_PROXY || process.env.HTTP_PROXY;
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
      ...(proxy ? { proxy: { server: proxy } } : {}),
    });

    const page = await context.newPage();
    const leads: RawLead[] = [];

    try {
      const queries = options?.strategy?.mapsQueries?.length
        ? options.strategy.mapsQueries.slice(0, 2)
        : buildSearchQueries(criteria);

      for (const query of queries) {
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });

        // Bypass cookie consent dialog if displayed
        try {
          const consentBtn = await page.$(
            'button:has-text("Accept all"), button:has-text("I agree"), form[action*="consent"] button'
          );
          if (consentBtn) {
            await consentBtn.click();
            await page.waitForTimeout(1500);
          }
        } catch {}

        // Wait for place results or feed container
        try {
          await page.waitForSelector('a[href*="/maps/place/"], div[role="feed"]', { timeout: 10_000 });
        } catch {
          // Continue if selector takes longer
        }

        // Scroll down to load places
        for (let i = 0; i < 4; i++) {
          await page.mouse.wheel(0, 1500);
          await page.waitForTimeout(1000);
        }

        // Extract items
        const results = await page.$$eval('a[href*="/maps/place/"]', (anchors) => {
          return anchors.map((a) => {
            const label = a.getAttribute("aria-label") || "";
            const href = a.getAttribute("href") || "";
            return { label, href };
          });
        });

        for (const item of results) {
          if (!item.label) continue;
          const name = item.label.split(/\s{2,}| \| /)[0]?.trim();
          if (!name || name.length < 2) continue;

          leads.push({
            name: name.slice(0, 120),
            phone: phoneInText(item.label),
            location: criteria.location?.city ? `${criteria.location.city}, ${criteria.location.state || ""}` : undefined,
            category: (criteria.industry || []).join(", ") || undefined,
            source: "google-maps",
            sourceId: item.href,
            metadata: {
              mapsUrl: item.href.startsWith("http") ? item.href : `https://www.google.com${item.href}`,
            },
          });
        }
      }
    } finally {
      await browser.close();
    }

    return leads.slice(0, MAX_PER_QUERY * 3);
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
          rating?: number;
          user_ratings_total?: number;
        }>;
      };

      if (listJson.status !== "OK" || !listJson.results) {
        break;
      }

      for (const place of listJson.results.slice(0, MAX_PER_QUERY)) {
        const detailUrl =
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}` +
          `&fields=formatted_phone_number,international_phone_number,website,name,formatted_address,rating,user_ratings_total` +
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
            rating?: number;
            user_ratings_total?: number;
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
          sourceId: place.place_id,
          metadata: {
            rating: d.rating ?? place.rating,
            reviewCount: d.user_ratings_total ?? place.user_ratings_total,
          },
        });
      }
    }

    return all.slice(0, MAX_PER_QUERY * 2);
  }
}