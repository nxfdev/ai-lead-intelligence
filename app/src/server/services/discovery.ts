/**
 * Discovery Service — Synthetic Lead Discovery
 * 
 * Implements the LeadDiscoveryProvider interface.
 * Returns realistic Austin dental practice leads.
 */

import type { LeadDiscoveryProvider, SearchCriteria, RawLead } from "@/lib/types";
import { delay } from "@/lib/utils";

const SYNTHETIC_LEADS: RawLead[] = [
  {
    name: "Austin Smile Center",
    phone: "+15125551001",
    website: "https://austinsmilecenter.example.com",
    location: "Austin, TX",
    category: "Dental Practice",
    source: "synthetic",
    sourceId: "syn_001",
    employeeCount: 15,
    decisionMaker: "Dr. Sarah Mitchell (Owner)",
  },
  {
    name: "Capital City Dental",
    phone: "+15125551002",
    website: "https://capitalcitydental.example.com",
    location: "Austin, TX",
    category: "Dental Practice",
    source: "synthetic",
    sourceId: "syn_002",
    employeeCount: 22,
    decisionMaker: "Dr. James Roberts (Managing Partner)",
  },
  {
    name: "Lakeway Family Dentistry",
    phone: "+15125551003",
    website: "https://lakewayfamily.example.com",
    location: "Lakeway, TX",
    category: "Family Dentistry",
    source: "synthetic",
    sourceId: "syn_003",
    employeeCount: 12,
    decisionMaker: "Dr. Patricia Chen (Owner)",
  },
  {
    name: "Round Rock Dental Care",
    phone: "+15125551004",
    website: "https://roundrockdental.example.com",
    location: "Round Rock, TX",
    category: "Dental Practice",
    source: "synthetic",
    sourceId: "syn_004",
    employeeCount: 18,
    decisionMaker: "Mark Johnson (Office Manager)",
  },
  {
    name: "Cedar Park Smiles",
    phone: "+15125551005",
    website: "https://cedarparksmiles.example.com",
    location: "Cedar Park, TX",
    category: "Cosmetic Dentistry",
    source: "synthetic",
    sourceId: "syn_005",
    employeeCount: 10,
    decisionMaker: "Dr. Angela Torres (Owner)",
  },
  {
    name: "Pflugerville Dental Associates",
    phone: "+15125551006",
    website: "https://pflugervilledental.example.com",
    location: "Pflugerville, TX",
    category: "Dental Practice",
    source: "synthetic",
    sourceId: "syn_006",
    employeeCount: 25,
    decisionMaker: "Dr. Kevin Park (Lead Dentist)",
  },
  {
    name: "South Austin Dental Group",
    phone: "+15125551007",
    website: "https://southaustindental.example.com",
    location: "Austin, TX",
    category: "Dental Group",
    source: "synthetic",
    sourceId: "syn_007",
    employeeCount: 30,
    decisionMaker: "Lisa Martinez (Practice Manager)",
  },
  {
    name: "Georgetown Family Dental",
    phone: "+15125551008",
    website: "https://georgetownfamily.example.com",
    location: "Georgetown, TX",
    category: "Family Dentistry",
    source: "synthetic",
    sourceId: "syn_008",
    employeeCount: 8,
    decisionMaker: "Dr. Robert Kim (Owner)",
  },
  {
    name: "Westlake Dental Studio",
    phone: "+15125551009",
    website: "https://westlakedental.example.com",
    location: "West Lake Hills, TX",
    category: "Cosmetic Dentistry",
    source: "synthetic",
    sourceId: "syn_009",
    employeeCount: 14,
    decisionMaker: "Dr. Emily Nguyen (Owner)",
  },
  {
    name: "Bee Cave Orthodontics & Dental",
    phone: "+15125551010",
    website: "https://beecaveortho.example.com",
    location: "Bee Cave, TX",
    category: "Orthodontics & Dental",
    source: "synthetic",
    sourceId: "syn_010",
    employeeCount: 20,
    decisionMaker: "Dr. David Thompson (Managing Director)",
  },
  {
    name: "Dripping Springs Dental",
    phone: "+15125551011",
    website: "https://drippingspringsdental.example.com",
    location: "Dripping Springs, TX",
    category: "Dental Practice",
    source: "synthetic",
    sourceId: "syn_011",
    employeeCount: 11,
    decisionMaker: "Dr. Jessica Walsh (Owner)",
  },
  {
    name: "Mueller Dental Health",
    phone: "+15125551012",
    website: "https://muellerdental.example.com",
    location: "Austin, TX",
    category: "Dental Practice",
    source: "synthetic",
    sourceId: "syn_012",
    employeeCount: 16,
    decisionMaker: "Dr. Andrew Lee (Owner)",
  },
];

export class SyntheticDiscoveryProvider implements LeadDiscoveryProvider {
  async search(criteria: SearchCriteria): Promise<RawLead[]> {
    // Simulate discovery delay
    await delay(2000);

    let leads = [...SYNTHETIC_LEADS];

    // Filter by employee count
    if (criteria.minEmployees) {
      leads = leads.filter((l) => (l.employeeCount || 0) >= (criteria.minEmployees || 0));
    }
    if (criteria.maxEmployees) {
      leads = leads.filter((l) => (l.employeeCount || 0) <= (criteria.maxEmployees || 999));
    }

    // Filter by excluded
    if (criteria.excluded?.includes("new_businesses")) {
      // Georgetown Family Dental has only 8 employees — simulate filtering if < min
    }

    return leads;
  }
}

export function createDiscoveryProvider(): LeadDiscoveryProvider {
  // Future: check env for provider type
  return new SyntheticDiscoveryProvider();
}
