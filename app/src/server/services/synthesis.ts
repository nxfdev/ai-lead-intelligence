/**
 * Synthesis Service — Call Result Processing (LLM-Powered)
 * 
 * Uses NVIDIA LLM to process CALL-E structured results and generate:
 * - Human-readable summaries
 * - Qualification updates
 * - Next action recommendations
 */

import { z } from "zod/v4";
import { callLLM, callLLMFreeform } from "@/lib/llm";
import type { CallStructuredResult, CallSynthesis } from "@/lib/types";

const SynthesisResultSchema = z.object({
  qualification: z.enum(["qualified", "not_qualified", "needs_follow_up", "inconclusive"]),
  summary: z.string(),
  verifiedFacts: z.array(z.string()),
  uncertainties: z.array(z.string()),
  nextAction: z.string(),
});

/**
 * Synthesize a call result into a human-readable summary with qualification
 * Uses NVIDIA LLM for intelligent analysis
 */
export async function synthesizeCallResult(
  leadName: string,
  structuredResult: CallStructuredResult,
  hypothesis: string
): Promise<CallSynthesis> {
  const systemPrompt = `You are an AI sales analyst that processes phone call results.
Analyze the structured call data and generate a concise summary with qualification.

Rules:
- Be objective and data-driven
- Base qualification strictly on the structured result
- Keep summary under 2 sentences
- Provide actionable next steps
- Always respond in valid JSON format`;

  const userPrompt = `Analyze this phone call result:

LEAD: ${leadName}
HYPOTHESIS: ${hypothesis}

STRUCTURED RESULT:
- Decision Maker Reached: ${structuredResult.decisionMakerReached ? "YES" : "NO"}
- Need Confirmed: ${structuredResult.needConfirmed ? "YES" : "NO"}
- Current Solution: ${structuredResult.currentSolution || "Not disclosed"}
- Next Action: ${structuredResult.nextAction || "Not specified"}
- Additional Notes: ${structuredResult.additionalNotes || "None"}

Determine:
1. Qualification (qualified/not_qualified/needs_follow_up/inconclusive)
2. Brief summary (1-2 sentences)
3. Verified facts from the call
4. Any uncertainties
5. Recommended next action

Respond in JSON:
{
  "qualification": "qualified|not_qualified|needs_follow_up|inconclusive",
  "summary": "Brief summary of the call outcome",
  "verifiedFacts": ["fact 1", "fact 2"],
  "uncertainties": ["uncertainty 1"],
  "nextAction": "Recommended next step"
}`;

  try {
    const result = await callLLM({
      prompt: userPrompt,
      system: systemPrompt,
      schema: SynthesisResultSchema,
      temperature: 0.2,
    });
    return result;
  } catch (error) {
    console.error("LLM synthesis failed, using fallback:", error);
    return fallbackSynthesis(leadName, structuredResult);
  }
}

/**
 * Fallback synthesis when LLM is unavailable
 */
function fallbackSynthesis(
  leadName: string,
  structuredResult: CallStructuredResult
): CallSynthesis {
  const verifiedFacts: string[] = [];
  const uncertainties: string[] = [];

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

/**
 * Generate a conversational response for the phone agent
 * Uses NVIDIA LLM to create natural dialogue
 */
export async function generateAgentResponse(
  conversationHistory: Array<{ role: "agent" | "lead"; content: string }>,
  brief: { objective: string; questions: string[]; constraints: string[] },
  currentQuestionIndex: number
): Promise<string> {
  const systemPrompt = `You are an AI phone agent conducting a qualification call.
Your goal is to determine if the business needs better call handling.
Be professional, friendly, and concise.
Never make commitments or promises.
Stay on topic and ask one question at a time.

OBJECTIVE: ${brief.objective}

CONSTRAINTS:
${brief.constraints.map((c) => `- ${c}`).join("\n")}

remaining questions to ask:
${brief.questions.slice(currentQuestionIndex).map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

  const historyText = conversationHistory
    .map((turn) => `${turn.role === "agent" ? "Agent" : "Lead"}: ${turn.content}`)
    .join("\n");

  const userPrompt = `Conversation so far:
${historyText}

Generate the next agent response. Be natural and conversational.`;

  try {
    const response = await callLLMFreeform({
      prompt: userPrompt,
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 200,
    });
    return response;
  } catch (error) {
    console.error("LLM response generation failed:", error);
    // Fallback to a default question
    const remainingQuestions = brief.questions.slice(currentQuestionIndex);
    return remainingQuestions[0] || "Thank you for your time. We'll be in touch.";
  }
}
