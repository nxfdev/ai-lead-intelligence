/**
 * Enrichment Service — Synthetic Lead Enrichment
 * 
 * Enriches raw leads with additional business data and generates evidence.
 */

import type { LeadEnrichmentProvider, RawLead, LeadEnrichment, EvidenceItem } from "@/lib/types";
import { delay } from "@/lib/utils";

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

// Default enrichment for leads not in the map
const DEFAULT_ENRICHMENT: LeadEnrichment & { evidenceItems: EvidenceItem[] } = {
  description: "Local dental practice.",
  services: ["General Dentistry"],
  hours: "Mon-Fri 9AM-5PM",
  reviewSignals: [],
  technologyIndicators: [],
  employeeCount: 10,
  evidenceItems: [
    { type: "OBSERVED", claim: "Business listing found in directory.", source: "business_directory", observedAt: new Date().toISOString(), confidence: 0.80 },
  ],
};

export class SyntheticEnrichmentProvider implements LeadEnrichmentProvider {
  async enrich(lead: RawLead): Promise<LeadEnrichment> {
    await delay(800); // Simulate enrichment processing

    const data = ENRICHMENT_DATA[lead.name] || DEFAULT_ENRICHMENT;
    const { evidenceItems: _, ...enrichment } = data;
    return enrichment;
  }

  getEvidenceForLead(leadName: string): EvidenceItem[] {
    const data = ENRICHMENT_DATA[leadName] || DEFAULT_ENRICHMENT;
    return data.evidenceItems;
  }
}

export function createEnrichmentProvider(): SyntheticEnrichmentProvider {
  return new SyntheticEnrichmentProvider();
}
