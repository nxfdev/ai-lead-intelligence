/**
 * Search Pipeline Quality Test — Driven by Simulated LLM Output
 *
 * Workflow:
 * 1. Takes simulated LLM criteria & search strategy plan (Google Maps queries + web dorks).
 * 2. Runs the search/discovery engine (Google Maps + Web directories).
 * 3. Enriches discovered leads using Scout (website crawl, social profiles, decision-makers).
 * 4. Runs native SMTP mailbox & MX verification.
 * 5. Exports batch leads to CSV.
 */

import type { LeadCriteria, SearchStrategyPlan, RawLead } from "../src/lib/types";
import { GoogleMapsDiscoveryTool } from "../src/server/tools/google-maps";
import { DuckDuckGoDiscoveryTool } from "../src/server/tools/duckduckgo";
import { ToolRegistryDiscoveryProvider } from "../src/server/tools/registry";
import { enrichLeadWithScout } from "../src/server/tools/scout-enricher";
import { dedupeLeads } from "../src/server/tools/lib";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  console.log("================================================================");
  console.log("   TESTING SEARCH & DISCOVERY PIPELINE (FROM SIMULATED LLM)     ");
  console.log("================================================================\n");

  // ─── 1. SIMULATED LLM OUTPUT ─────────────────────────────────
  console.log("1️⃣  Simulated LLM Output (Criteria & Search Strategy):");
  
  const simulatedCriteria: LeadCriteria = {
    industry: ["dental", "healthcare", "pediatric dentistry"],
    location: {
      city: "Austin",
      state: "TX",
      radiusMiles: 25,
    },
    minEmployees: 5,
    maxEmployees: 50,
    requiredSignals: ["High call volume", "Appointment scheduling needs", "Active practice"],
    excluded: ["Dental chains", "Corporate franchises", "Permanently closed"],
    callQuestions: [
      "Do you currently use an automated system to answer after-hours patient calls?",
      "Who manages patient intake during peak clinic hours?",
    ],
  };

  const simulatedStrategy: SearchStrategyPlan = {
    mapsQueries: [
      "dental clinics in Austin TX",
      "family dentistry South Austin TX",
      "pediatric dental practice Austin Texas",
    ],
    webQueries: [
      'site:linkedin.com/company "Austin" "dental practice"',
      '"Austin TX" dental clinic "contact us" "office manager"',
    ],
    socialPlatforms: ["linkedin", "instagram", "youtube"],
    targetRoles: ["Owner", "Lead Dentist", "Practice Manager", "Office Administrator"],
    negativeKeywords: ["Corporate", "National Dental Care", "Aspen"],
    locations: ["Austin, TX", "Round Rock, TX", "Cedar Park, TX"],
  };

  console.log("   Target Industries:", simulatedCriteria.industry.join(", "));
  console.log("   Target Location:  ", `${simulatedCriteria.location?.city}, ${simulatedCriteria.location?.state}`);
  console.log("   Google Maps Queries (LLM Formulated):");
  simulatedStrategy.mapsQueries.forEach((q, i) => console.log(`     [${i + 1}] ${q}`));
  console.log("   Target Decision Maker Roles:", simulatedStrategy.targetRoles.join(", "));
  console.log();

  // ─── 2. SEARCH & DISCOVERY STAGE ─────────────────────────────
  console.log("2️⃣  Executing Search & Discovery Stage...");
  console.log("   Running Google Maps Discovery Tool on live web...");

  const mapsTool = new GoogleMapsDiscoveryTool();
  const ddgTool = new DuckDuckGoDiscoveryTool();
  const startTime = Date.now();

  let discoveredLeads: RawLead[] = [];

  // 1. Google Maps (using Playwright deep browser)
  try {
    const mapsLeads = await mapsTool.search(simulatedCriteria, {
      strategy: simulatedStrategy,
      useDeepBrowser: true,
    });
    console.log(`   [Google Maps Live] Found ${mapsLeads.length} leads directly from Maps`);
    discoveredLeads.push(...mapsLeads);
  } catch (err) {
    console.warn("   [Google Maps Live] Error:", (err as Error).message);
  }

  // 2. DuckDuckGo Web Search
  try {
    const ddgLeads = await ddgTool.search(simulatedCriteria);
    console.log(`   [DuckDuckGo Live]  Found ${ddgLeads.length} organic business websites`);
    discoveredLeads.push(...ddgLeads);
  } catch (err) {
    console.warn("   [DuckDuckGo Live] Error:", (err as Error).message);
  }

  // Deduplicate discovered leads
  discoveredLeads = dedupeLeads(discoveredLeads);

  // Fallback to registry if both tools were blocked/empty
  if (discoveredLeads.length === 0) {
    console.log("   Invoking Tool Registry Discovery Provider...");
    const discoveryTool = new ToolRegistryDiscoveryProvider();
    discoveredLeads = await discoveryTool.search(simulatedCriteria, simulatedStrategy);
  }

  const searchDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ✓ Total unique leads discovered: ${discoveredLeads.length} in ${searchDuration}s\n`);

  if (discoveredLeads.length === 0) {
    console.error("❌ No leads discovered from search. Exiting.");
    process.exit(1);
  }

  // Display top discovered leads
  console.log("   Sample Discovered Candidates:");
  discoveredLeads.slice(0, 5).forEach((lead, idx) => {
    console.log(`     ${idx + 1}. ${lead.name}`);
    console.log(`        Phone:    ${lead.phone || "(none)"}`);
    console.log(`        Location: ${lead.location || "(unknown)"}`);
    console.log(`        Category: ${lead.category || "(unknown)"}`);
    console.log(`        Source:   ${lead.source}`);
  });
  console.log();

  // ─── 3. SCOUT MULTI-PLATFORM & EMAIL ENRICHMENT ──────────────
  console.log("3️⃣  Executing Scout Multi-Platform & SMTP Enrichment...");
  console.log("   (Crawling websites, social profiles, and probing SMTP mailboxes)\n");

  const enrichedBatch: Array<{
    name: string;
    phone?: string;
    website?: string;
    email?: string;
    emailStatus?: string;
    decisionMaker?: string;
    socials: string;
    location?: string;
    category?: string;
    source: string;
  }> = [];

  // Enrich top candidates
  const candidatesToEnrich = discoveredLeads.slice(0, 4);

  for (let i = 0; i < candidatesToEnrich.length; i++) {
    const candidate = candidatesToEnrich[i];
    console.log(`   [${i + 1}/${candidatesToEnrich.length}] Enriching: "${candidate.name}"...`);

    const scout = await enrichLeadWithScout({
      name: candidate.name,
      website: candidate.website,
      phone: candidate.phone,
      location: candidate.location,
      decisionMaker: candidate.decisionMaker,
    });

    const primaryEmail = scout.verifiedEmail?.email || scout.emails[0] || undefined;
    const emailStatus = scout.verifiedEmail?.status || (primaryEmail ? "unverified" : "none");
    const socialsList = scout.socialProfiles.map((s) => `${s.platform}: ${s.url}`).join(" | ");

    console.log(`       Website:        ${candidate.website || (scout.domain ? `https://${scout.domain}` : "none")}`);
    console.log(`       Decision Maker: ${scout.decisionMaker || candidate.decisionMaker || "(none detected)"}`);
    console.log(`       Discovered Email: ${primaryEmail || "(none)"} [Status: ${emailStatus.toUpperCase()}]`);
    console.log(`       Social Channels: ${scout.socialProfiles.length} found (${scout.socialProfiles.map((s) => s.platform).join(", ") || "none"})`);

    enrichedBatch.push({
      name: candidate.name,
      phone: candidate.phone || scout.phones[0],
      website: candidate.website || (scout.domain ? `https://${scout.domain}` : undefined),
      email: primaryEmail,
      emailStatus,
      decisionMaker: scout.decisionMaker || candidate.decisionMaker,
      socials: socialsList,
      location: candidate.location,
      category: candidate.category,
      source: candidate.source,
    });
    console.log();
  }

  // ─── 4. BATCH CSV EXPORT GENERATION ──────────────────────────
  console.log("4️⃣  Generating Batch CSV Output...");

  const csvHeaders = [
    "Company Name",
    "Category",
    "Location",
    "Phone",
    "Website",
    "Decision Maker",
    "Primary Email",
    "Email Deliverability",
    "Social Profiles",
    "Discovery Source",
  ];

  function escapeCsv(val?: string) {
    if (!val) return '""';
    return `"${val.replace(/"/g, '""')}"`;
  }

  const csvRows = enrichedBatch.map((l) =>
    [
      escapeCsv(l.name),
      escapeCsv(l.category || "General Business"),
      escapeCsv(l.location || "Austin, TX"),
      escapeCsv(l.phone || ""),
      escapeCsv(l.website || ""),
      escapeCsv(l.decisionMaker || ""),
      escapeCsv(l.email || ""),
      escapeCsv(l.emailStatus === "none" ? "Unverified" : l.emailStatus),
      escapeCsv(l.socials || ""),
      escapeCsv(l.source || "web"),
    ].join(",")
  );

  const csvContent = [csvHeaders.join(","), ...csvRows].join("\r\n");
  const exportPath = path.resolve(__dirname, "test-batch-leads.csv");
  fs.writeFileSync(exportPath, csvContent, "utf8");

  console.log(`   ✓ Successfully exported ${enrichedBatch.length} enriched leads to:`);
  console.log(`     ${exportPath}\n`);

  console.log("================================================================");
  console.log("      SEARCH & DISCOVERY PIPELINE TEST PASSED WITH SUCCESS      ");
  console.log("================================================================\n");
}

main().catch((err) => {
  console.error("Test pipeline encountered an error:", err);
  process.exit(1);
});
