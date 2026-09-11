/**
 * Scoring Service — Lead Scoring Engine
 * 
 * Calculates lead scores using the weighted component model:
 *   ICP Fit (25) + Business Quality (15) + Pain Signal (25) +
 *   Intent (20) + Recency (10) + Contactability (5) = 100
 */

import type { EvidenceItem, ScoreComponents, LeadScore } from "@/lib/types";
import { delay } from "@/lib/utils";

interface LeadScoringInput {
  name: string;
  category?: string;
  location?: string;
  employeeCount?: number;
  decisionMaker?: string;
  phone?: string;
  website?: string;
  evidence: EvidenceItem[];
  criteria: {
    industry: string[];
    minEmployees?: number;
    maxEmployees?: number;
    requiredSignals?: string[];
  };
}

/**
 * Calculate ICP Fit score (0-25)
 */
function scoreIcpFit(input: LeadScoringInput): number {
  let score = 0;
  const { category, employeeCount, criteria } = input;

  // Industry match
  if (category) {
    const categoryLower = category.toLowerCase();
    const industryMatch = criteria.industry.some((i) => categoryLower.includes(i));
    if (industryMatch) score += 12;
    else score += 4; // partial credit for related
  }

  // Employee count match
  if (employeeCount) {
    const min = criteria.minEmployees || 5;
    const max = criteria.maxEmployees || 100;
    if (employeeCount >= min && employeeCount <= max) {
      score += 8;
      // Bonus for sweet spot
      if (employeeCount >= 10 && employeeCount <= 30) score += 3;
    } else if (employeeCount >= min * 0.7) {
      score += 4; // close to range
    }
  }

  // Location relevance (always match for synthetic)
  score += 2;

  return Math.min(25, score);
}

/**
 * Calculate Business Quality score (0-15)
 */
function scoreBusinessQuality(input: LeadScoringInput): number {
  let score = 0;

  if (input.website) score += 4;
  if (input.employeeCount && input.employeeCount >= 10) score += 4;
  if (input.employeeCount && input.employeeCount >= 15) score += 2;

  // Established business signals from evidence
  const hasEstablished = input.evidence.some((e) =>
    e.claim.toLowerCase().includes("established") || e.claim.toLowerCase().includes("operating since")
  );
  if (hasEstablished) score += 3;
  else score += 1; // base credit

  // Has services listed
  score += 2;

  return Math.min(15, score);
}

/**
 * Calculate Pain Signal score (0-25)
 */
function scorePainSignal(input: LeadScoringInput): number {
  let score = 0;

  for (const evidence of input.evidence) {
    const claimLower = evidence.claim.toLowerCase();

    // Strong pain signals
    if (claimLower.includes("missed call") || claimLower.includes("miss calls")) score += 6;
    if (claimLower.includes("no online booking") || claimLower.includes("no online scheduling")) score += 5;
    if (claimLower.includes("difficulty reaching") || claimLower.includes("wait time")) score += 5;
    if (claimLower.includes("voicemail")) score += 4;
    if (claimLower.includes("hiring") || claimLower.includes("receptionist")) score += 5;
    if (claimLower.includes("hold time") || claimLower.includes("on hold")) score += 5;

    // Medium signals
    if (claimLower.includes("busy") || claimLower.includes("high demand")) score += 3;
    if (claimLower.includes("callback") || claimLower.includes("return call")) score += 3;
    if (claimLower.includes("outdated")) score += 2;

    // Weak signals
    if (claimLower.includes("paper-based") || claimLower.includes("manual")) score += 2;
  }

  return Math.min(25, score);
}

/**
 * Calculate Intent score (0-20)
 */
function scoreIntent(input: LeadScoringInput): number {
  let score = 5; // base intent for being in target market

  for (const evidence of input.evidence) {
    const claimLower = evidence.claim.toLowerCase();

    if (claimLower.includes("seeking") || claimLower.includes("considering")) score += 8;
    if (claimLower.includes("growing") || claimLower.includes("increasing")) score += 4;
    if (claimLower.includes("job posting") || claimLower.includes("job listing")) score += 6;
    if (claimLower.includes("extended hours") || claimLower.includes("high patient")) score += 3;

    // Evidence confidence boosts
    if (evidence.confidence && evidence.confidence > 0.85) score += 1;
  }

  return Math.min(20, score);
}

/**
 * Calculate Recency score (0-10)
 */
function scoreRecency(input: LeadScoringInput): number {
  // All synthetic data is recent
  let score = 7;

  const hasRecentEvidence = input.evidence.some((e) => e.claim.toLowerCase().includes("recent"));
  if (hasRecentEvidence) score += 3;

  return Math.min(10, score);
}

/**
 * Calculate Contactability score (0-5)
 */
function scoreContactability(input: LeadScoringInput): number {
  let score = 0;

  if (input.phone) score += 2;
  if (input.decisionMaker) score += 2;
  if (input.website) score += 1;

  return Math.min(5, score);
}

/**
 * Generate a hypothesis based on evidence
 */
function generateHypothesis(input: LeadScoringInput): string {
  const painSignals: string[] = [];

  for (const ev of input.evidence) {
    if (ev.type === "OBSERVED") {
      painSignals.push(ev.claim);
    }
  }

  if (painSignals.length === 0) {
    return `${input.name} is a potential match based on ICP criteria, but limited evidence is available. Further research recommended.`;
  }

  const topSignals = painSignals.slice(0, 2).join(" Additionally, ");
  return `${input.name} shows strong indicators of need: ${topSignals} This suggests an opportunity for our client's services. A phone call could verify whether they are actively seeking a solution.`;
}

/**
 * Calculate the full lead score
 */
export async function scoreLead(input: LeadScoringInput): Promise<LeadScore> {
  await delay(500); // Simulate scoring processing

  const components: ScoreComponents = {
    icpFit: scoreIcpFit(input),
    businessQuality: scoreBusinessQuality(input),
    painSignal: scorePainSignal(input),
    intent: scoreIntent(input),
    recency: scoreRecency(input),
    contactability: scoreContactability(input),
  };

  const totalScore =
    components.icpFit +
    components.businessQuality +
    components.painSignal +
    components.intent +
    components.recency +
    components.contactability;

  const hypothesis = generateHypothesis(input);

  let recommendedAction: "call" | "research" | "skip" | "follow_up";
  if (totalScore >= 70) recommendedAction = "call";
  else if (totalScore >= 50) recommendedAction = "research";
  else if (totalScore >= 30) recommendedAction = "follow_up";
  else recommendedAction = "skip";

  return {
    score: totalScore,
    components,
    evidence: input.evidence,
    hypothesis,
    recommendedAction,
  };
}
