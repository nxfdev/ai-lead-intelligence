import type { ApolloSearchRequest } from "./types";
import type { SearchCriteria, SearchStrategyPlan } from "@/lib/types";

const SENIORITY_BY_TITLE: Array<[RegExp, string]> = [
  [/ceo|founder|owner|principal|president/i, "c_suite"],
  [/cfo|cto|coo|cmo|cio|vp|vice president/i, "c_suite"],
  [/director/i, "director"],
  [/manager|head of/i, "manager"],
];

export function seniorityFor(titles: string[]): string[] {
  const out = new Set<string>();
  for (const title of titles) {
    for (const [re, seniority] of SENIORITY_BY_TITLE) {
      if (re.test(title)) out.add(seniority);
    }
  }
  return [...out];
}

export interface BuildApolloRequestOptions {
  page?: number;
  perPage?: number;
  revealContacts?: boolean;
}

export function buildApolloSearchRequest(
  criteria: SearchCriteria,
  strategy?: SearchStrategyPlan,
  opts: BuildApolloRequestOptions = {}
): ApolloSearchRequest {
  const industries = [...new Set((criteria.industry || []).map((s) => s.trim()).filter(Boolean))];
  const roles = [...new Set((strategy?.targetRoles || []).map((s) => s.trim()).filter(Boolean))];
  const keywords = [...new Set((criteria.requiredSignals || []).map((s) => s.trim()).filter(Boolean))];

  const city = criteria.location?.city?.trim();
  const state = criteria.location?.state?.trim();
  const locations = [city && state ? `${city}, ${state}, United States` : city || state].filter(
    (x): x is string => Boolean(x)
  );

  let ranges: string[] = [];
  if (criteria.minEmployees || criteria.maxEmployees) {
    const lo = criteria.minEmployees ?? 1;
    const hi = criteria.maxEmployees ?? lo + 100;
    ranges = [`${lo},${hi}`];
  }

  return {
    page: opts.page ?? 1,
    per_page: opts.perPage ?? 25,
    person_titles: roles.length ? roles : undefined,
    person_seniorities: seniorityFor(roles),
    organization_locations: locations.length ? locations : undefined,
    organization_num_employees_ranges: ranges.length ? ranges : undefined,
    organization_industry_tags: industries.length ? industries : undefined,
    q_keywords: keywords.length ? keywords : undefined,
    reveal_contacts: opts.revealContacts,
  };
}