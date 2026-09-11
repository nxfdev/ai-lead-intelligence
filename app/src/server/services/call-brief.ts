/**
 * Call Brief Generator
 * 
 * Creates structured call briefs from lead data + evidence + criteria.
 * Converts briefs into CALL-E natural language tasks and result schemas.
 */

import type { CallBrief, EvidenceItem } from "@/lib/types";
import { delay } from "@/lib/utils";

interface CallBriefInput {
  leadName: string;
  phone: string;
  location?: string;
  category?: string;
  evidence: EvidenceItem[];
  hypothesis: string;
  callQuestions: string[];
  clientDescription: string;
}

/**
 * Generate a structured call brief for a lead
 */
export async function generateCallBrief(input: CallBriefInput): Promise<CallBrief> {
  await delay(600);

  const defaultConstraints = [
    "Do not make purchases or financial commitments",
    "Do not misrepresent identity",
    "Do not claim uncertain information as fact",
    "Be professional and respectful of the recipient's time",
    "If asked who you represent, provide honest information",
  ];

  const defaultSuccessConditions = [
    "Determine whether the business has a phone handling problem",
    "Identify the decision maker",
    "Assess interest in a solution",
    "Determine appropriate next step",
  ];

  return {
    target: {
      name: input.leadName,
      phone: input.phone,
      location: input.location,
      category: input.category,
    },
    objective: `Determine whether ${input.leadName} currently has difficulty handling inbound calls and whether they would be interested in an AI-powered phone answering solution.`,
    businessContext: {
      clientDescription: input.clientDescription,
      targetBusiness: input.leadName,
      category: input.category || "Dental Practice",
      location: input.location || "Austin, TX area",
    },
    evidence: input.evidence,
    hypothesis: input.hypothesis,
    questions: input.callQuestions.length > 0 ? input.callQuestions : [
      "Who currently handles incoming calls?",
      "Do you experience missed calls during busy periods?",
      "What happens with after-hours calls?",
      "Are you currently considering any solutions to improve call handling?",
      "Who would make the decision about adopting a new phone solution?",
    ],
    constraints: defaultConstraints,
    successConditions: defaultSuccessConditions,
  };
}

/**
 * Convert a call brief into a CALL-E natural language task string
 */
export function briefToCalleTask(brief: CallBrief): string {
  const evidenceLines = brief.evidence
    .filter((e) => e.type === "OBSERVED")
    .slice(0, 3)
    .map((e) => `- ${e.claim}`)
    .join("\n");

  const questionLines = brief.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  const constraintLines = brief.constraints.map((c) => `- ${c}`).join("\n");

  return `Call ${brief.target.name} at ${brief.target.phone}.

Objective:
${brief.objective}

Context:
- ${brief.target.category || "Business"} located in ${brief.target.location || "Austin, TX area"}
- ${brief.businessContext.clientDescription || "Our client provides AI receptionist solutions"}

Evidence:
${evidenceLines || "- No specific evidence available"}

Hypothesis:
${brief.hypothesis}

Questions to ask:
${questionLines}

Constraints:
${constraintLines}

Return structured answers for each question asked.`;
}

/**
 * Generate a CALL-E result schema based on the call brief questions
 */
export function generateResultSchema(): Record<string, unknown> {
  return {
    type: "object",
    required: ["decision_maker_reached", "need_confirmed"],
    properties: {
      decision_maker_reached: {
        type: "boolean",
        description: "Whether a relevant decision maker was reached",
      },
      need_confirmed: {
        type: "boolean",
        description: "Whether the business confirmed a need for better call handling",
      },
      current_solution: {
        type: "string",
        description: "How the business currently handles phone calls",
      },
      pain_points: {
        type: "string",
        description: "Specific pain points mentioned by the recipient",
      },
      interest_level: {
        type: "string",
        enum: ["high", "medium", "low", "none"],
        description: "Level of interest in a solution",
      },
      next_action: {
        type: "string",
        description: "Recommended next step",
      },
      additional_notes: {
        type: "string",
        description: "Any other relevant information gathered",
      },
    },
    additionalProperties: false,
  };
}
