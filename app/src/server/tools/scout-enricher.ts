/**
 * Scout Multi-Platform Enrichment Engine (TypeScript Native)
 *
 * Inspired by Scout (https://github.com/kiryano/Scout)
 * 1. Deep website crawling (emails, social links, meta info, schema.org JSON-LD).
 * 2. Multi-platform social discovery (LinkedIn, Instagram, YouTube, GitHub, TikTok, Linktree).
 * 3. Decision-maker discovery & native SMTP email verification.
 */

import * as cheerio from "cheerio";
import type { SocialProfile, EmailVerificationResult } from "@/lib/types";
import {
  fetchHtml,
  extractEmailsFromText,
  extractDomain,
  phoneInText,
  getRandomUserAgent,
  jitterDelay,
} from "./lib";
import { findBestVerifiedEmail, verifyEmailSmtp } from "./smtp-verifier";

export interface CompanyEnrichmentData {
  domain: string | null;
  emails: string[];
  verifiedEmail?: EmailVerificationResult;
  phones: string[];
  socialProfiles: SocialProfile[];
  decisionMaker?: string;
  decisionMakerTitle?: string;
  description?: string;
  technologies?: string[];
}

/**
 * Extracts links pointing to social platforms from HTML
 */
export function extractSocialLinks(html: string): SocialProfile[] {
  const $ = cheerio.load(html);
  const profiles: SocialProfile[] = [];
  const seenUrls = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;

    try {
      const lower = href.toLowerCase();
      let platform: SocialProfile["platform"] | null = null;

      if (lower.includes("linkedin.com/company/") || lower.includes("linkedin.com/in/")) {
        platform = "linkedin";
      } else if (lower.includes("instagram.com/")) {
        platform = "instagram";
      } else if (lower.includes("youtube.com/") || lower.includes("youtu.be/")) {
        platform = "youtube";
      } else if (lower.includes("github.com/")) {
        platform = "github";
      } else if (lower.includes("tiktok.com/@")) {
        platform = "tiktok";
      } else if (lower.includes("linktr.ee/") || lower.includes("bio.link/")) {
        platform = "linktree";
      }

      if (platform && !seenUrls.has(href)) {
        seenUrls.add(href);
        const urlObj = new URL(href.startsWith("http") ? href : `https://${href}`);
        const handle = urlObj.pathname.split("/").filter(Boolean).pop()?.replace(/^@/, "");
        profiles.push({
          platform,
          url: href,
          handle,
        });
      }
    } catch {
      // ignore invalid URLs
    }
  });

  return profiles;
}

/**
 * Scout-style web crawler for a company's website
 */
export async function crawlWebsiteForLead(websiteUrl: string): Promise<{
  emails: string[];
  phones: string[];
  socialProfiles: SocialProfile[];
  description?: string;
  decisionMakerCandidate?: string;
}> {
  const cleanDomain = extractDomain(websiteUrl);
  if (!cleanDomain) {
    return { emails: [], phones: [], socialProfiles: [] };
  }

  const baseTarget = websiteUrl.startsWith("http") ? websiteUrl : `https://${cleanDomain}`;
  const emails = new Set<string>();
  const phones = new Set<string>();
  const socialProfiles: SocialProfile[] = [];
  let description: string | undefined;
  let decisionMakerCandidate: string | undefined;

  // 1. Fetch Main Page
  try {
    const html = await fetchHtml(baseTarget, 10_000);
    const $ = cheerio.load(html);

    // Extract meta description
    description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      undefined;

    // Extract emails & phones
    const pageText = $("body").text();
    extractEmailsFromText(pageText).forEach((e) => emails.add(e));
    const pagePhone = phoneInText(pageText);
    if (pagePhone) phones.add(pagePhone);

    // Also look for mailto: and tel: links
    $('a[href^="mailto:"]').each((_, el) => {
      const mailto = $(el).attr("href")?.replace(/^mailto:/i, "").split("?")[0].trim();
      if (mailto && mailto.includes("@")) emails.add(mailto.toLowerCase());
    });
    $('a[href^="tel:"]').each((_, el) => {
      const tel = $(el).attr("href")?.replace(/^tel:/i, "").trim();
      const norm = phoneInText(tel || "");
      if (norm) phones.add(norm);
    });

    // Extract social links
    extractSocialLinks(html).forEach((sp) => socialProfiles.push(sp));

    // Look for leadership / team / about links to find decision-maker
    const aboutLinks: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      const text = $(el).text().toLowerCase();
      if (!href) return;
      if (
        text.includes("about") ||
        text.includes("team") ||
        text.includes("leadership") ||
        text.includes("founder") ||
        text.includes("contact")
      ) {
        try {
          const fullUrl = new URL(href, baseTarget).toString();
          if (extractDomain(fullUrl) === cleanDomain && !aboutLinks.includes(fullUrl)) {
            aboutLinks.push(fullUrl);
          }
        } catch {}
      }
    });

    // 2. Fetch About/Team Page if found
    if (aboutLinks.length > 0) {
      await jitterDelay(300, 800);
      const subUrl = aboutLinks[0];
      try {
        const subHtml = await fetchHtml(subUrl, 8_000);
        const sub$ = cheerio.load(subHtml);
        const subText = sub$("body").text();

        extractEmailsFromText(subText).forEach((e) => emails.add(e));
        extractSocialLinks(subHtml).forEach((sp) => {
          if (!socialProfiles.some((s) => s.url === sp.url)) socialProfiles.push(sp);
        });

        // Scan for patterns like "Dr. John Doe, Founder" or "Jane Smith - CEO"
        const leaderRegex =
          /(?:founder|ceo|owner|director|president|doctor|dr\.)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g;
        const match = leaderRegex.exec(subText);
        if (match && match[1]) {
          decisionMakerCandidate = match[1].trim();
        }
      } catch {}
    }
  } catch {}

  // Filter emails belonging to the domain first
  const domainEmails = Array.from(emails).filter((e) => e.endsWith(`@${cleanDomain}`));
  const otherEmails = Array.from(emails).filter((e) => !e.endsWith(`@${cleanDomain}`));

  return {
    emails: [...domainEmails, ...otherEmails],
    phones: Array.from(phones),
    socialProfiles,
    description: description?.slice(0, 300),
    decisionMakerCandidate,
  };
}

/**
 * Scout-style discovery of social profiles using keyless web search dorks
 */
export async function searchSocialAccountsForCompany(
  companyName: string,
  city?: string
): Promise<SocialProfile[]> {
  const profiles: SocialProfile[] = [];
  const query = `${companyName} ${city || ""} site:instagram.com OR site:linkedin.com/company OR site:youtube.com`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const html = await fetchHtml(url, 8_000);
    const $ = cheerio.load(html);

    $(".result__url").each((_, el) => {
      const link = $(el).text().trim();
      const href = link.startsWith("http") ? link : `https://${link}`;
      const lower = href.toLowerCase();

      if (lower.includes("linkedin.com/company/")) {
        profiles.push({ platform: "linkedin", url: href });
      } else if (lower.includes("instagram.com/")) {
        profiles.push({ platform: "instagram", url: href });
      } else if (lower.includes("youtube.com/")) {
        profiles.push({ platform: "youtube", url: href });
      }
    });
  } catch {}

  return profiles;
}

export async function searchDomainForCompany(name: string, location?: string): Promise<string | null> {
  const query = `${name} ${location || ""} official site`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const html = await fetchHtml(url, 8_000);
    const $ = cheerio.load(html);
    let foundDomain: string | null = null;
    $(".result__url").each((_, el) => {
      if (foundDomain) return;
      const link = $(el).text().trim();
      const domain = extractDomain(link);
      if (!domain) return;
      const lower = domain.toLowerCase();
      if (
        lower.includes("google") ||
        lower.includes("facebook") ||
        lower.includes("yelp") ||
        lower.includes("yellowpages") ||
        lower.includes("mapquest") ||
        lower.includes("zoominfo")
      ) {
        return;
      }
      foundDomain = domain;
    });
    return foundDomain;
  } catch {
    return null;
  }
}

/**
 * Full Scout Lead Enrichment Orchestrator
 */
export async function enrichLeadWithScout(lead: {
  name: string;
  website?: string | null;
  phone?: string | null;
  location?: string | null;
  decisionMaker?: string | null;
}): Promise<CompanyEnrichmentData> {
  let targetWebsite = lead.website;
  if (!targetWebsite) {
    const discoveredDomain = await searchDomainForCompany(lead.name, lead.location || undefined);
    if (discoveredDomain) {
      targetWebsite = `https://${discoveredDomain}`;
    }
  }

  const domain = extractDomain(targetWebsite || "");
  let emails: string[] = [];
  const phones: string[] = lead.phone ? [lead.phone] : [];
  const socialProfiles: SocialProfile[] = [];
  let description: string | undefined;
  let decisionMaker = lead.decisionMaker || undefined;

  // 1. If website is present, crawl it for contacts and social links
  if (targetWebsite) {
    const crawl = await crawlWebsiteForLead(targetWebsite);
    emails.push(...crawl.emails);
    crawl.phones.forEach((p) => {
      if (!phones.includes(p)) phones.push(p);
    });
    crawl.socialProfiles.forEach((s) => socialProfiles.push(s));
    if (crawl.description) description = crawl.description;
    if (!decisionMaker && crawl.decisionMakerCandidate) {
      decisionMaker = crawl.decisionMakerCandidate;
    }
  }

  // 2. Discover social profiles if website had few or none
  if (socialProfiles.length < 2) {
    const searchSocials = await searchSocialAccountsForCompany(lead.name, lead.location || undefined);
    searchSocials.forEach((sp) => {
      if (!socialProfiles.some((s) => s.url === sp.url)) socialProfiles.push(sp);
    });
  }

  // 3. Scout SMTP verification: if domain exists, verify the best email candidate
  let verifiedEmail: EmailVerificationResult | undefined;
  if (domain) {
    if (emails.length > 0) {
      // Test the first discovered domain email
      const candidate = emails.find((e) => e.endsWith(`@${domain}`)) || emails[0];
      verifiedEmail = await verifyEmailSmtp(candidate, { timeoutMs: 5000 });
    } else if (decisionMaker) {
      // Generate email permutations from decision maker name + domain
      const best = await findBestVerifiedEmail(decisionMaker, domain);
      if (best) {
        verifiedEmail = best;
        emails.push(best.email);
      }
    } else {
      // Permutations for generic business address
      const genericEmail = `contact@${domain}`;
      verifiedEmail = await verifyEmailSmtp(genericEmail, { timeoutMs: 5000 });
      if (verifiedEmail.status === "verified" || verifiedEmail.status === "risky") {
        emails.push(genericEmail);
      }
    }
  }

  return {
    domain,
    emails: Array.from(new Set(emails)),
    verifiedEmail,
    phones,
    socialProfiles,
    decisionMaker,
    description,
  };
}
