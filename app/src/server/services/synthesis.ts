/**
 * Synthesis Service — Call Result Processing
 * 
 * Takes CALL-E structured results and generates:
 * - Human-readable summaries
 * - Qualification updates
 * - Next action recommendations
 */

import type { CallStructuredResult, CallSynthesis } from "@/lib/types";
import { delay } from "@/lib/utils";

/**
 * Synthesize a call result into a human-readable summary with qualification
 */
export async function synthesizeCallResult(
  leadName: string,
  structuredResult: CallStructuredResult,
  hypothesis: string
): Promise<CallSynthesis> {
  await delay(500); // Simulate LLM processing

  const verifiedFacts: string[] = [];
  const uncertainties: string[] = [];

  // Analyze structured result
  if (structuredResult.decisionMakerReached) {
    verifiedFacts.push("Decision maker was reached and spoke with the caller.");
  } else {
    uncertainties.push("Decision maker was not reached — information may be from secondary contact.");
  }

  if (structuredResult.needConfirmed) {
    verifiedFacts.push("The business confirmed a need for improved call handling.");
  } else {
    uncertainties.push("The business did not confirm an explicit need for call handling improvement.");
  }

  if (structuredResult.currentSolution) {
    verifiedFacts.push(`Current solution: ${structuredResult.currentSolution}`);
  }

  if (structuredResult.additionalNotes) {
    verifiedFacts.push(structuredResult.additionalNotes);
  }

  // Determine qualification
  let qualification: "qualified" | "not_qualified" | "needs_follow_up" | "inconclusive";
  if (structuredResult.needConfirmed && structuredResult.decisionMakerReached) {
    qualification = "qualified";
  } else if (structuredResult.needConfirmed && !structuredResult.decisionMakerReached) {
    qualification = "needs_follow_up";
  } else if (!structuredResult.needConfirmed && structuredResult.decisionMakerReached) {
    qualification = "not_qualified";
  } else {
    qualification = "inconclusive";
  }

  // Generate summary
  let summary: string;
  if (qualification === "qualified") {
    summary = `${leadName} is a verified opportunity. ${structuredResult.decisionMakerReached ? "The decision maker was reached and" : "A representative"} confirmed that the business experiences challenges with call handling. ${structuredResult.currentSolution ? `They currently use: ${structuredResult.currentSolution}.` : ""} ${structuredResult.nextAction ? `Recommended next step: ${structuredResult.nextAction}.` : "Follow-up is recommended."}`;
  } else if (qualification === "needs_follow_up") {
    summary = `${leadName} shows potential but requires follow-up. ${structuredResult.needConfirmed ? "Need was indicated" : "No explicit need confirmed"}, but the decision maker was not available. ${structuredResult.nextAction || "Try calling again at a different time."}`;
  } else if (qualification === "not_qualified") {
    summary = `${leadName} does not appear to be a strong fit at this time. The decision maker was reached but did not confirm a need for improved call handling. ${structuredResult.currentSolution ? `They currently use: ${structuredResult.currentSolution}.` : ""} ${structuredResult.nextAction || "Consider revisiting in the future."}`;
  } else {
    summary = `The call to ${leadName} was inconclusive. ${structuredResult.nextAction || "A follow-up attempt is recommended to gather more information."}`;
  }

  const nextAction = structuredResult.nextAction || 
    (qualification === "qualified" ? "Schedule follow-up meeting or product demo" :
     qualification === "needs_follow_up" ? "Retry call to reach decision maker" :
     qualification === "not_qualified" ? "Archive lead — revisit in 6 months" :
     "Retry call at different time");

  return {
    qualification,
    summary,
    verifiedFacts,
    uncertainties,
    nextAction,
  };
}
