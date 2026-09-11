/**
 * Planner Service — Real LLM
 *
 * Extracts business profiles from client descriptions, generates
 * questionnaires, and converts questionnaire answers to lead criteria.
 *
 * Uses the OpenRouter LLM (see @/lib/llm) with strict zod validation.
 */

import type { BusinessProfile, Questionnaire, LeadCriteria, QuestionnaireItem } from "@/lib/types";
import {
  BusinessProfileSchema,
  LeadCriteriaSchema,
} from "@/lib/types";
import { callLLM } from "@/lib/llm";
import { delay } from "@/lib/utils";

const PLANNER_SYSTEM =
  "You are the planning agent of an autonomous AI lead generation pipeline. " +
  "You convert free-form client information into strict, realistic structured JSON. " +
  "Respond ONLY with a single valid JSON object matching the requested schema.";

/**
 * Extract a business profile from document text using the LLM
 * with strict zod validation.
 */
export async function extractBusinessProfile(documentText: string): Promise<BusinessProfile> {
  // Small guard so synthetic demo tasks without a goal still work
  if (!documentText || documentText.length < 3) {
    await delay(800);
    return BusinessProfileSchema.parse({
      company: { name: "AI Receptionist Solutions", industry: "AI/SaaS - Healthcare Technology" },
      services: ["AI receptionist", "Automated phone answering", "Appointment scheduling"],
      targetMarket: {
        industries: ["dental", "healthcare", "medical practice"],
        geography: ["Austin, TX", "Central Texas"],
        companySize: "5-50 employees",
        characteristics: ["High call volume", "Struggles with missed calls"],
      },
      geography: { regions: ["Austin, TX"], radius: 50 },
      idealCustomer: {
        traits: ["10+ employees", "High appointment volume", "Decision maker accessible"],
        painPoints: ["Missed calls", "After-hours calls going to voicemail", "Receptionist overwhelmed"],
        budget: "$200-$500/month",
      },
      negativeSignals: ["New businesses (< 1 year)", "Already using AI/automated phone system", "Chains/franchises"],
      qualificationRequirements: ["Confirmed need", "Decision maker reachable", "Budget authority"],
    });
  }

  return callLLM<BusinessProfile>({
    system: PLANNER_SYSTEM,
    prompt: `Convert this client description / goal into a complete Business Profile (the ideal customer profile of who they want to sell to):\n\n${documentText}\n\nRequired JSON fields:\n{\n  "company": { "name": string, "description": string, "industry": string, "website": string } (all optional),\n  "services": string[],\n  "targetMarket": { "industries": string[], "geography": string[], "companySize": string, "characteristics": string[] },\n  "geography": { "regions": string[], "radius": number },\n  "idealCustomer": { "traits": string[], "painPoints": string[], "budget": string },\n  "negativeSignals": string[],\n  "qualificationRequirements": string[]\n}\n\nMake specific, realistic inferences. Return only the JSON.`,
    schema: BusinessProfileSchema,
    temperature: 0.2,
    maxTokens: 8000,
  });
}

/**
 * Generate a questionnaire from a business profile.
 * Deterministically derived from the AI-extracted profile so the
 * questionnaire faithfully reflects the (LLM-produced) target profile.
 */
export async function generateQuestionnaire(profile: BusinessProfile): Promise<Questionnaire> {
  await delay(200);

  const industries = profile.targetMarket?.industries?.length
    ? profile.targetMarket.industries
    : ["general business"];
  const regions = profile.geography?.regions?.length ? profile.geography.regions : ["United States"];
  const companySize = profile.targetMarket?.companySize || "5-50";
  const minEmployees = parseInt(companySize, 10) || 10;

  const items: QuestionnaireItem[] = [
    { id: "q1", question: "Target industry?", answer: industries.join(", "), type: "text" },
    { id: "q2", question: "Target geography?", answer: regions.join(", "), type: "text" },
    { id: "q3", question: "Minimum company size (employees)?", answer: String(minEmployees), type: "number" },
    { id: "q4", question: "Preferred company size (employees)?", answer: companySize, type: "text" },
    {
      id: "q5",
      question: "Required services the target should offer?",
      answer: (profile.services || []).join(", ") || "General services",
      type: "text",
    },
    {
      id: "q6",
      question: "Businesses to exclude?",
      answer: (profile.negativeSignals || []).join(", ") || "None",
      type: "text",
    },
    {
      id: "q7",
      question: "Strong pain signals to look for?",
      answer: (profile.idealCustomer?.painPoints || []).join(", ") || "Missed calls, no online booking",
      type: "text",
    },
    {
      id: "q8",
      question: "Strong intent signals?",
      answer: (profile.targetMarket?.characteristics || []).join(", ") || "High call volume",
      type: "text",
    },
    {
      id: "q9",
      question: "What should be verified by phone?",
      answer: (profile.qualificationRequirements || []).join(", ") || "Need, decision maker, budget",
      type: "text",
    },
    {
      id: "q10",
      question: "What should the caller never do?",
      answer: "Make commitments, Misrepresent identity, Claim uncertain information as fact, Make purchases",
      type: "text",
    },
  ];

  return { items, completed: true };
}

/**
 * Convert questionnaire answers to machine-readable lead criteria
 * using the LLM with strict zod validation.
 */
export async function convertToCriteria(questionnaire: Questionnaire): Promise<LeadCriteria> {
  const answers = questionnaire.items
    .map((item) => `Q: ${item.question}\nA: ${item.answer || ""}`)
    .join("\n\n");

  if (!questionnaire.completed || questionnaire.items.length === 0) {
    return callLLM<LeadCriteria>({
      system: PLANNER_SYSTEM,
      prompt: `The questionnaire is not yet completed. Return a sensible default Lead Criteria JSON.`,
      schema: LeadCriteriaSchema,
      temperature: 0.2,
      maxTokens: 8000,
    });
  }

  return callLLM<LeadCriteria>({
    system: PLANNER_SYSTEM,
    prompt: `Convert these questionnaire answers into machine-readable Lead Criteria.\n\n${answers}\n\nRequired JSON:\n{\n  "industry": string[],\n  "location": { "city": string, "state": string, "radiusMiles": number },\n  "minEmployees": number,\n  "maxEmployees": number,\n  "requiredSignals": string[],\n  "excluded": string[],\n  "callQuestions": string[]\n}\n\nReturn only the JSON.`,
    schema: LeadCriteriaSchema,
    temperature: 0.2,
    maxTokens: 8000,
  });
}