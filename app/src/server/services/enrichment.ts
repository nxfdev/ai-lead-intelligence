/**
 * Enrichment Service
 *
 * Three modes behind ENRICHMENT_MODE:
 *   full   – fetch website + LLM analysis (real evidence)
 *   rules  – fetch website + keyword heuristics (no tokens)
 *   synthetic – demo data (original map)
 */

import type {
  LeadEnrichmentProvider,
  LeadEnrichmentResult,
  RawLead,
  LeadEnrichment,
  EvidenceItem,
} from "@/lib/types";
import { callLLM } from "@/lib/llm";
import { z } from "zod/v4";
import { fetchHtml, stripHtml, normalizePhone, phoneInText } from "../tools/lib";
import { delay } from "@/lib/utils";

// ─── Enrichment data map (synthetic fallback) ───────────────

const ENRICHMENT_DATA: Record<string, LeadEnrichment & { evidenceItems: EvidenceItem[] }> = {
  "Austin Smile Center": {
    website: "https://austinsmilecenter.example.com",
    description: "Established dental practice in central Austin serving families since 2008. General and cosmetic dentistry.",
    services: ["General Dentistry", "Cosmetic Dentistry", "Teeth Whitening", "Dental Implants"],
    hours: "Mon-Fri 8AM-5PM, Sat 9AM-1PM",
    reviewSignals: ["Multiple reviews mention difficulty reaching office by phone", "Recent review: 'tried calling 3 times before getting through'"],
    technologyIndicators: ["No online booking detected", "Basic website without patient portal"],
    decisionMaker: "Dr. Sarah Mitchell (Owner)",
    decisionMakerTitle: "Owner/Lead Dentist",
    employeeCount: 15,
    evidenceItems: [
      { type: "OBSERVED", claim: "Website has no online booking mechanism detected.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.92 },
      { type: "OBSERVED", claim: "Multiple Google reviews mention difficulty reaching the office by phone.", source: "review_analysis", observedAt: new Date().toISOString(), confidence: 0.85 },
      { type: "INFERRED", claim: "High patient volume likely causes missed calls during peak hours.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.78 },
      { type: "OBSERVED", claim: "Practice has been operating since 2008 with 15 employees.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.95 },
      { type: "OBSERVED", claim: "Decision maker (Dr. Sarah Mitchell, Owner) identified and contactable.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.90 },
    ],
  },
  "Capital City Dental": {
    website: "https://capitalcitydental.example.com",
    description: "Multi-location dental group in Austin with focus on comprehensive care.",
    services: ["General Dentistry", "Orthodontics", "Pediatric Dentistry", "Oral Surgery"],
    hours: "Mon-Fri 7AM-6PM",
    reviewSignals: ["Reviews praise quality but note long hold times"],
    technologyIndicators: ["Has online booking", "Modern website with patient portal"],
    decisionMaker: "Dr. James Roberts (Managing Partner)",
    decisionMakerTitle: "Managing Partner",
    employeeCount: 22,
    evidenceItems: [
      { type: "OBSERVED", claim: "Practice has online booking but reviews note long phone hold times.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.88 },
      { type: "INFERRED", claim: "Large staff (22 employees) suggests high call volume that may overwhelm current system.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.72 },
      { type: "OBSERVED", claim: "Multi-location practice with centralized phone system.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.90 },
    ],
  },
  "Lakeway Family Dentistry": {
    website: "https://lakewayfamily.example.com",
    description: "Family-oriented dental practice in Lakeway serving the Lake Travis area.",
    services: ["Family Dentistry", "Preventive Care", "Children's Dentistry"],
    hours: "Mon-Thu 8AM-5PM, Fri 8AM-2PM",
    reviewSignals: ["Patient mentions 'always goes to voicemail after hours'"],
    technologyIndicators: ["No online scheduling", "Outdated website design"],
    decisionMaker: "Dr. Patricia Chen (Owner)",
    decisionMakerTitle: "Owner",
    employeeCount: 12,
    evidenceItems: [
      { type: "OBSERVED", claim: "No online scheduling system detected on website.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.94 },
      { type: "OBSERVED", claim: "Patient review mentions calls going to voicemail after hours.", source: "review_analysis", observedAt: new Date().toISOString(), confidence: 0.82 },
      { type: "INFERRED", claim: "Limited hours (closed Fridays early) suggest after-hours call handling gap.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.75 },
      { type: "OBSERVED", claim: "Owner-operated practice with 12 employees.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.93 },
    ],
  },
  "Round Rock Dental Care": {
    website: "https://roundrockdental.example.com",
    description: "Full-service dental practice in Round Rock with emergency services.",
    services: ["General Dentistry", "Emergency Dental", "Root Canal", "Crowns"],
    hours: "Mon-Fri 8AM-6PM, Sat 9AM-3PM",
    reviewSignals: ["Recent job posting for front desk receptionist"],
    technologyIndicators: ["Basic online form (not real-time booking)", "Uses paper-based scheduling"],
    decisionMaker: "Mark Johnson (Office Manager)",
    decisionMakerTitle: "Office Manager",
    employeeCount: 18,
    evidenceItems: [
      { type: "OBSERVED", claim: "Recently posted job listing for front desk receptionist.", source: "job_board_analysis", observedAt: new Date().toISOString(), confidence: 0.96 },
      { type: "INFERRED", claim: "Hiring for receptionist suggests current call handling capacity is insufficient.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.85 },
      { type: "OBSERVED", claim: "Uses paper-based scheduling system.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.70 },
      { type: "OBSERVED", claim: "Extended Saturday hours suggest high demand.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.88 },
    ],
  },
  "Cedar Park Smiles": {
    website: "https://cedarparksmiles.example.com",
    description: "Cosmetic and general dentistry in Cedar Park.",
    services: ["Cosmetic Dentistry", "Veneers", "General Dentistry"],
    hours: "Mon-Fri 9AM-5PM",
    reviewSignals: [],
    technologyIndicators: ["Has online booking via third-party"],
    decisionMaker: "Dr. Angela Torres (Owner)",
    decisionMakerTitle: "Owner",
    employeeCount: 10,
    evidenceItems: [
      { type: "OBSERVED", claim: "Uses third-party online booking system.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.90 },
      { type: "INFERRED", claim: "Small team (10 employees) may still struggle with phone coverage during procedures.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.65 },
    ],
  },
  "Pflugerville Dental Associates": {
    website: "https://pflugervilledental.example.com",
    description: "Large dental group practice serving Pflugerville and surrounding areas.",
    services: ["General Dentistry", "Periodontics", "Endodontics", "Dental Implants"],
    hours: "Mon-Fri 7AM-7PM, Sat 8AM-4PM",
    reviewSignals: ["Multiple complaints about phone wait times", "Review: 'was on hold for 15 minutes'"],
    technologyIndicators: ["Outdated phone system (no IVR)", "Has online forms but no real-time booking"],
    decisionMaker: "Dr. Kevin Park (Lead Dentist)",
    decisionMakerTitle: "Lead Dentist",
    employeeCount: 25,
    evidenceItems: [
      { type: "OBSERVED", claim: "Multiple patient reviews explicitly complain about long phone wait times.", source: "review_analysis", observedAt: new Date().toISOString(), confidence: 0.93 },
      { type: "OBSERVED", claim: "Outdated phone system without IVR or routing.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.80 },
      { type: "INFERRED", claim: "Extended operating hours (7AM-7PM, 6 days) with 25 staff indicates very high call volume.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.88 },
      { type: "OBSERVED", claim: "No real-time online booking — relies primarily on phone appointments.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.91 },
    ],
  },
  "South Austin Dental Group": {
    website: "https://southaustindental.example.com",
    description: "Multi-practitioner dental group in South Austin.",
    services: ["General Dentistry", "Cosmetic Dentistry", "Orthodontics"],
    hours: "Mon-Fri 8AM-6PM",
    reviewSignals: ["Positive reviews but mentions of busy waiting room"],
    technologyIndicators: ["Modern website", "Has online scheduling"],
    decisionMaker: "Lisa Martinez (Practice Manager)",
    decisionMakerTitle: "Practice Manager",
    employeeCount: 30,
    evidenceItems: [
      { type: "OBSERVED", claim: "Large practice (30 employees) with multiple practitioners.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.95 },
      { type: "INFERRED", claim: "High patient volume indicated by reviews mentioning busy waiting rooms.", source: "review_analysis", observedAt: new Date().toISOString(), confidence: 0.70 },
      { type: "OBSERVED", claim: "Has online scheduling system already in place.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.92 },
    ],
  },
  "Westlake Dental Studio": {
    website: "https://westlakedental.example.com",
    description: "Boutique dental studio in West Lake Hills focused on aesthetic dentistry.",
    services: ["Aesthetic Dentistry", "Smile Makeovers", "Porcelain Veneers", "Teeth Whitening"],
    hours: "Mon-Thu 9AM-5PM",
    reviewSignals: ["High-end clientele", "Reviews mention 'couldn't schedule same-day'"],
    technologyIndicators: ["No online booking", "Premium but static website"],
    decisionMaker: "Dr. Emily Nguyen (Owner)",
    decisionMakerTitle: "Owner",
    employeeCount: 14,
    evidenceItems: [
      { type: "OBSERVED", claim: "No online booking system detected — premium but static website.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.91 },
      { type: "OBSERVED", claim: "Reviews mention difficulty booking same-day appointments.", source: "review_analysis", observedAt: new Date().toISOString(), confidence: 0.80 },
      { type: "INFERRED", claim: "High-end practice with limited hours may lose premium clients to missed calls.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.77 },
      { type: "OBSERVED", claim: "Owner-operated boutique practice with 14 employees.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.94 },
    ],
  },
  "Bee Cave Orthodontics & Dental": {
    website: "https://beecaveortho.example.com",
    description: "Combined orthodontics and general dental practice in Bee Cave.",
    services: ["Orthodontics", "Braces", "Invisalign", "General Dentistry"],
    hours: "Mon-Fri 8AM-5PM",
    reviewSignals: ["Good reviews overall", "One mention of phone going to voicemail"],
    technologyIndicators: ["Has patient portal", "Online forms available"],
    decisionMaker: "Dr. David Thompson (Managing Director)",
    decisionMakerTitle: "Managing Director",
    employeeCount: 20,
    evidenceItems: [
      { type: "OBSERVED", claim: "Has patient portal but phone calls still go to voicemail at times.", source: "review_analysis", observedAt: new Date().toISOString(), confidence: 0.72 },
      { type: "INFERRED", claim: "Combined orthodontics and dental likely generates high appointment scheduling volume.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.75 },
    ],
  },
  "Dripping Springs Dental": {
    website: "https://drippingspringsdental.example.com",
    description: "Community dental practice in the growing Dripping Springs area.",
    services: ["General Dentistry", "Family Dentistry", "Preventive Care"],
    hours: "Mon-Fri 8AM-5PM",
    reviewSignals: ["Growing patient base", "Recent review praises staff but notes wait for callbacks"],
    technologyIndicators: ["No online booking", "Simple website"],
    decisionMaker: "Dr. Jessica Walsh (Owner)",
    decisionMakerTitle: "Owner",
    employeeCount: 11,
    evidenceItems: [
      { type: "OBSERVED", claim: "No online booking system on simple website.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.93 },
      { type: "OBSERVED", claim: "Review mentions waiting for callbacks, suggesting missed or delayed return calls.", source: "review_analysis", observedAt: new Date().toISOString(), confidence: 0.79 },
      { type: "INFERRED", claim: "Located in rapidly growing area — likely experiencing increasing call volume.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.82 },
    ],
  },
  "Mueller Dental Health": {
    website: "https://muellerdental.example.com",
    description: "Modern dental practice in the Mueller development in Austin.",
    services: ["General Dentistry", "Preventive Care", "Emergency Dental"],
    hours: "Mon-Sat 7AM-7PM",
    reviewSignals: ["Very positive reviews", "Noted as 'always busy'"],
    technologyIndicators: ["Modern website", "Online booking available"],
    decisionMaker: "Dr. Andrew Lee (Owner)",
    decisionMakerTitle: "Owner",
    employeeCount: 16,
    evidenceItems: [
      { type: "OBSERVED", claim: "Extended hours (7AM-7PM, 6 days) indicate high demand.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.90 },
      { type: "OBSERVED", claim: "Has online booking system already.", source: "website_analysis", observedAt: new Date().toISOString(), confidence: 0.95 },
      { type: "INFERRED", claim: "Despite online booking, extended hours suggest potential phone coverage gaps.", source: "business_analysis", observedAt: new Date().toISOString(), confidence: 0.60 },
    ],
  },
};

// ─── Site signals extraction (keyless) ───────────────────────

interface SiteSignals {
  phone?: string;
  hasOnlineBooking: boolean;
  hasHours: boolean;
}

function extractSiteSignals(html: string, text: string): SiteSignals {
  const telMatch = /href="tel:([^"]+)"/i.exec(html);
  const phone = telMatch ? normalizePhone(telMatch[1]) : undefined;
  const fallbackPhone = !phone ? phoneInText(html) || phoneInText(text) : undefined;

  const hasOnlineBooking =
    /online\s*(?:book(?:ing)?|schedul(?:e|ing)|appoint(?:ment)?|reserv(?:e|ation))|book\s*now|schedule\s*appointment/i.test(text);

  const hasHours =
    /(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*[\s\S]{0,30}(?:\d{1,2}[\s.:]\d{2}\s*(?:AM|PM|am|pm))/i.test(text);

  return { phone: phone || fallbackPhone || undefined, hasOnlineBooking, hasHours };
}

// ─── LLM-enrichment schema ──────────────────────────────────

const LLMEnrichmentSchema = z.object({
  description: z.string().nullable().optional(),
  services: z.array(z.string()),
  hours: z.string().nullable().optional(),
  reviewSignals: z.array(z.string()),
  technologyIndicators: z.array(z.string()),
  decisionMaker: z.string().nullable().optional(),
  decisionMakerTitle: z.string().nullable().optional(),
  employeeCount: z.number().nullable().optional(),
  evidenceItems: z.array(
    z.object({
      type: z.enum(["OBSERVED", "INFERRED", "VERIFIED"]),
      claim: z.string(),
      source: z.string(),
      confidence: z.number().min(0).max(1).nullable().optional(),
    })
  ),
});

type LLMEnrichmentOutput = z.infer<typeof LLMEnrichmentSchema>;

// ─── Rules-based signal builder ──────────────────────────────

function enrichViaRules(text: string, signals: SiteSignals): LeadEnrichmentResult {
  const descSlice = text.slice(0, 200).trim();

  const techIndicators: string[] = [];
  if (signals.hasOnlineBooking) techIndicators.push("Has online booking");
  else techIndicators.push("No online booking detected");

  const evidenceItems: EvidenceItem[] = [];
  if (signals.phone) {
    evidenceItems.push({
      type: "OBSERVED",
      claim: `Contact phone number found on website: ${signals.phone}`,
      source: "website_phone_extraction",
      observedAt: new Date().toISOString(),
      confidence: 0.92,
    });
  }
  if (signals.hasOnlineBooking) {
    evidenceItems.push({
      type: "OBSERVED",
      claim: "Website includes an online booking / scheduling mechanism.",
      source: "website_analysis",
      observedAt: new Date().toISOString(),
      confidence: 0.90,
    });
  } else {
    evidenceItems.push({
      type: "OBSERVED",
      claim: "No online booking or scheduling mechanism detected on website.",
      source: "website_analysis",
      observedAt: new Date().toISOString(),
      confidence: 0.85,
    });
  }
  if (signals.hasHours) {
    evidenceItems.push({
      type: "OBSERVED",
      claim: "Operating hours are listed on the website.",
      source: "website_analysis",
      observedAt: new Date().toISOString(),
      confidence: 0.80,
    });
  }

  return {
    enrichment: {
      description: descSlice || undefined,
      services: [],
      hours: signals.hasHours ? "Hours listed on website" : undefined,
      reviewSignals: [],
      technologyIndicators: techIndicators,
      employeeCount: undefined,
    },
    evidenceItems,
    phone: signals.phone,
  };
}

// ─── LLM-enrichment (full mode) ─────────────────────────────

async function enrichViaLLM(text: string, signals: SiteSignals, raw: RawLead): Promise<LeadEnrichmentResult> {
  const output = await callLLM<LLMEnrichmentOutput>({
    system:
      "You are an AI business analyst analyzing a company website to help qualify them as a sales lead. " +
      "Be specific, reference what you observed in the text. Do NOT fabricate claims unsupported by the content. " +
      "Respond ONLY with the requested JSON object.",
    prompt:
      `Analyze this company website and produce a structured Lead Enrichment with evidence items.\n\n` +
      `Website URL: ${raw.website}\n` +
      `Lead Name: ${raw.name}\n` +
      `Extracted text (first 6000 chars):\n${text.slice(0, 6000)}\n\n` +
      `Pre-extracted signals:\n` +
      `- Phone found on page: ${signals.phone || "none"}\n` +
      `- Online booking keywords: ${signals.hasOnlineBooking}\n` +
      `- Hours content detected: ${signals.hasHours}\n\n` +
      `Required JSON schema:\n` +
      `{\n` +
      `  "description": string | null,\n` +
      `  "services": string[],\n` +
      `  "hours": string | null,\n` +
      `  "reviewSignals": string[],\n` +
      `  "technologyIndicators": string[],\n` +
      `  "decisionMaker": string | null,\n` +
      `  "decisionMakerTitle": string | null,\n` +
      `  "employeeCount": number | null,\n` +
      `  "evidenceItems": [\n` +
      `    { "type": "OBSERVED"|"INFERRED"|"VERIFIED", "claim": string, "source": string, "confidence": number|null }\n` +
      `  ]\n` +
      `}`,
    schema: LLMEnrichmentSchema,
    temperature: 0.2,
    maxTokens: 8000,
  });

  const evidenceItems: EvidenceItem[] = output.evidenceItems.map((e) => ({
    type: e.type,
    claim: e.claim,
    source: e.source,
    observedAt: new Date().toISOString(),
    confidence: e.confidence ?? undefined,
  }));

  if (signals.phone) {
    evidenceItems.unshift({
      type: "OBSERVED",
      claim: `Contact phone number found on website: ${signals.phone}`,
      source: "website_phone_extraction",
      observedAt: new Date().toISOString(),
      confidence: 0.92,
    });
  }

  return {
    enrichment: {
      description: output.description ?? undefined,
      services: output.services,
      hours: output.hours ?? undefined,
      reviewSignals: output.reviewSignals,
      technologyIndicators: output.technologyIndicators,
      decisionMaker: output.decisionMaker ?? undefined,
      decisionMakerTitle: output.decisionMakerTitle ?? undefined,
      employeeCount: output.employeeCount ?? undefined,
    },
    evidenceItems,
    phone: signals.phone,
  };
}

// ─── Fetch provider ──────────────────────────────────────────

class FetchEnrichmentProvider implements LeadEnrichmentProvider {
  private useLlm: boolean;

  constructor() {
    const mode = (process.env.ENRICHMENT_MODE || "full").toLowerCase();
    this.useLlm = mode === "full";
  }

  async enrich(raw: RawLead): Promise<LeadEnrichmentResult> {
    if (!raw.website) {
      return noWebsiteFallback(raw);
    }

    let html = "";
    let text = "";
    try {
      html = await fetchHtml(raw.website, 8000);
      text = stripHtml(html).slice(0, 8000);
    } catch {
      return fetchFailedFallback(raw);
    }

    const signals = extractSiteSignals(html, text);

    try {
      return this.useLlm
        ? await enrichViaLLM(text, signals, raw)
        : enrichViaRules(text, signals);
    } catch {
      return enrichViaRules(text, signals);
    }
  }
}

// ─── Synthetic provider ──────────────────────────────────────

class SyntheticEnrichmentProvider implements LeadEnrichmentProvider {
  async enrich(raw: RawLead): Promise<LeadEnrichmentResult> {
    await delay(600);
    const data = ENRICHMENT_DATA[raw.name];
    if (data) {
      const { evidenceItems, ...enrichment } = data;
      return { enrichment, evidenceItems, phone: raw.phone || undefined };
    }
    return {
      enrichment: {
        description: "Local business.",
        services: [],
        hours: undefined,
        reviewSignals: [],
        technologyIndicators: [],
        employeeCount: raw.employeeCount,
      },
      evidenceItems: [
        {
          type: "OBSERVED",
          claim: "Business listing found in directory.",
          source: "business_directory",
          observedAt: new Date().toISOString(),
          confidence: 0.80,
        },
      ],
      phone: raw.phone || undefined,
    };
  }
}

// ─── Factory ─────────────────────────────────────────────────

export function createEnrichmentProvider(): LeadEnrichmentProvider {
  const mode = (process.env.ENRICHMENT_MODE || "full").toLowerCase();
  if (mode === "synthetic") return new SyntheticEnrichmentProvider();
  return new FetchEnrichmentProvider();
}

// ─── Fallbacks ───────────────────────────────────────────────

function noWebsiteFallback(raw: RawLead): LeadEnrichmentResult {
  return {
    enrichment: {
      description: `Business listing for ${raw.name}.`,
      services: [],
      hours: undefined,
      reviewSignals: [],
      technologyIndicators: ["No website available"],
      employeeCount: raw.employeeCount,
    },
    evidenceItems: [
      {
        type: "OBSERVED",
        claim: `No website available for ${raw.name}.`,
        source: "discovery",
        observedAt: new Date().toISOString(),
        confidence: 0.95,
      },
    ],
    phone: raw.phone || undefined,
  };
}

function fetchFailedFallback(raw: RawLead): LeadEnrichmentResult {
  return {
    enrichment: {
      description: `Could not fetch website for ${raw.name}.`,
      services: [],
      hours: undefined,
      reviewSignals: [],
      technologyIndicators: ["Website unreachable"],
      employeeCount: raw.employeeCount,
    },
    evidenceItems: [
      {
        type: "OBSERVED",
        claim: `Website ${raw.website} was unreachable or returned an error.`,
        source: "website_fetch",
        observedAt: new Date().toISOString(),
        confidence: 0.90,
      },
    ],
    phone: raw.phone || undefined,
  };
}