/**
 * Planner Service — Mock LLM
 * 
 * Extracts business profiles from documents, generates questionnaires,
 * and converts questionnaire answers to lead criteria.
 * All responses are synthetic/mock for MVP.
 */

import type { BusinessProfile, Questionnaire, LeadCriteria } from "@/lib/types";
import { delay } from "@/lib/utils";

/**
 * Extract a business profile from document text.
 * Mock LLM: returns a realistic dental practice profile.
 */
export async function extractBusinessProfile(documentText: string): Promise<BusinessProfile> {
  await delay(1500); // Simulate LLM processing time

  // Parse some keywords from the text for a slightly dynamic response
  const lowerText = documentText.toLowerCase();
  const isDental = lowerText.includes("dental") || lowerText.includes("dentist");
  const isAustin = lowerText.includes("austin");

  return {
    company: {
      name: isDental ? "AI Receptionist Solutions" : "Business Services Co",
      description: isDental
        ? "We sell AI-powered receptionist and phone answering solutions to dental practices and healthcare providers."
        : "We provide technology solutions to small and medium businesses.",
      industry: isDental ? "AI/SaaS - Healthcare Technology" : "Technology Services",
      website: "https://example.com",
    },
    services: isDental
      ? ["AI receptionist", "Automated phone answering", "Appointment scheduling", "After-hours call handling"]
      : ["Technology consulting", "Software solutions"],
    targetMarket: {
      industries: isDental ? ["dental", "healthcare", "medical practice"] : ["general business"],
      geography: isAustin ? ["Austin, TX", "Central Texas"] : ["United States"],
      companySize: "5-50 employees",
      characteristics: [
        "Established businesses with existing patient/customer base",
        "Multiple staff members",
        "High call volume",
        "Struggles with missed calls",
      ],
    },
    geography: {
      regions: isAustin ? ["Austin, TX"] : ["United States"],
      radius: 50,
    },
    idealCustomer: {
      traits: [
        "Dental practices with 10+ employees",
        "High appointment volume",
        "Currently using human receptionist",
        "Experiences missed calls during peak hours",
        "Decision maker accessible",
      ],
      painPoints: [
        "Missing patient calls during busy periods",
        "After-hours calls going to voicemail",
        "Receptionist overwhelmed during peak times",
        "Lost revenue from missed appointments",
        "Difficulty hiring/retaining reception staff",
      ],
      budget: "$200-$500/month",
    },
    negativeSignals: [
      "New businesses (less than 1 year)",
      "Already using AI/automated phone system",
      "Solo practitioner with no staff",
      "Chain/franchise locations (centralized decisions)",
    ],
    qualificationRequirements: [
      "Confirmed need for call handling improvement",
      "Decision maker reachable",
      "Budget authority present",
      "No existing competitor solution",
    ],
  };
}

/**
 * Generate a questionnaire from a business profile.
 * Mock LLM: returns a standard lead qualification questionnaire.
 */
export async function generateQuestionnaire(profile: BusinessProfile): Promise<Questionnaire> {
  await delay(1000);

  const industries = profile.targetMarket?.industries || ["general business"];
  const regions = profile.geography?.regions || ["United States"];

  return {
    items: [
      {
        id: "q1",
        question: "Target industry?",
        answer: industries.join(", "),
        type: "text",
      },
      {
        id: "q2",
        question: "Target geography?",
        answer: regions.join(", "),
        type: "text",
      },
      {
        id: "q3",
        question: "Minimum company size (employees)?",
        answer: "10",
        type: "number",
      },
      {
        id: "q4",
        question: "Preferred company size (employees)?",
        answer: "15-30",
        type: "text",
      },
      {
        id: "q5",
        question: "Required services the target should offer?",
        answer: "General dentistry, Family dentistry",
        type: "text",
      },
      {
        id: "q6",
        question: "Businesses to exclude?",
        answer: "New businesses (< 1 year), Solo practitioners, Chains/franchises",
        type: "text",
      },
      {
        id: "q7",
        question: "Strong pain signals to look for?",
        answer: "Missed calls, No online booking, Hiring reception staff, After-hours demand, Negative reviews mentioning phone accessibility",
        type: "text",
      },
      {
        id: "q8",
        question: "Strong intent signals?",
        answer: "Searching for answering services, Posted job for receptionist, Asked about automation solutions",
        type: "text",
      },
      {
        id: "q9",
        question: "What should be verified by phone?",
        answer: "Who handles inbound calls?, Do you miss calls during busy periods?, Are you considering an answering solution?, Who makes the relevant decision?",
        type: "text",
      },
      {
        id: "q10",
        question: "What should the caller never do?",
        answer: "Make commitments, Misrepresent identity, Claim uncertain information as fact, Make purchases",
        type: "text",
      },
    ],
    completed: true,
  };
}

/**
 * Convert questionnaire answers to machine-readable lead criteria.
 */
export async function convertToCriteria(questionnaire: Questionnaire): Promise<LeadCriteria> {
  await delay(800);

  // Extract answers from questionnaire items
  const answers: Record<string, string> = {};
  for (const item of questionnaire.items) {
    answers[item.id] = item.answer || "";
  }

  return {
    industry: (answers.q1 || "dental").split(",").map((s) => s.trim().toLowerCase()),
    location: {
      city: "Austin",
      state: "TX",
      radiusMiles: 50,
    },
    minEmployees: parseInt(answers.q3) || 10,
    maxEmployees: 100,
    requiredSignals: [
      "appointment_volume",
      "phone_accessibility_problem",
      "missed_calls",
      "no_online_booking",
    ],
    excluded: ["new_businesses", "solo_practitioners", "chain_franchises"],
    callQuestions: [
      "Who handles inbound calls?",
      "Do you miss calls during busy periods?",
      "What happens after hours?",
      "Are you considering an answering solution?",
      "Who makes the relevant decision?",
    ],
  };
}
