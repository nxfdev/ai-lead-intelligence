/**
 * CALL-E Quick Conversation Test
 * 
 * Simple test that demonstrates the conversation flow without database.
 * Shows exactly what the AI agent would say and collect.
 * 
 * Usage: pnpm tsx scripts/test-calle-conversation.ts
 */

import { generateCallBrief, briefToCalleTask } from "../src/server/services/call-brief";
import { synthesizeCallResult } from "../src/server/services/synthesis";
import type { CallStructuredResult } from "../src/lib/types";

// ─── Test Lead Data ──────────────────────────────────────────────

const TEST_LEAD = {
  name: "Austin Smile Center",
  phone: "+15551234567",
  location: "Austin, TX",
  category: "Dental Practice",
  evidence: [
    {
      type: "OBSERVED" as const,
      claim: "Business has high call volume during morning hours",
      source: "google_maps_reviews",
      observedAt: new Date().toISOString(),
      confidence: 0.85,
    },
    {
      type: "OBSERVED" as const,
      claim: "Multiple reviews mention difficulty getting through by phone",
      source: "yelp_reviews",
      observedAt: new Date().toISOString(),
      confidence: 0.78,
    },
  ],
  hypothesis: "Austin Smile Center shows strong indicators of phone handling challenges based on customer reviews mentioning difficulty reaching the office.",
};

// ─── Conversation Turns ──────────────────────────────────────────

interface ConversationTurn {
  speaker: "AGENT" | "LEAD";
  text: string;
  notes?: string;
}

const CONVERSATION: ConversationTurn[] = [
  {
    speaker: "AGENT",
    text: "Hello, is this Austin Smile Center? I'm calling from AI Lead Intelligence regarding your business's ability to handle customer calls.",
    notes: "Opening - identify purpose",
  },
  {
    speaker: "LEAD",
    text: "Yes, this is Dr. Mitchell speaking.",
    notes: "Decision maker reached",
  },
  {
    speaker: "AGENT",
    text: "Great, thank you for taking my call, Dr. Mitchell. I'm researching how businesses manage inbound calls during busy periods. Could you tell me who typically handles incoming calls during your business hours?",
    notes: "Question 1: Current call handling",
  },
  {
    speaker: "LEAD",
    text: "We have a receptionist who handles most of the calls, but during busy mornings it can get overwhelming.",
    notes: "Confirmed: Staffing challenge",
  },
  {
    speaker: "AGENT",
    text: "I understand completely. And when you're busy, what happens to the calls that come in? Do they go to voicemail, or is there a hold system?",
    notes: "Question 2: Call overflow handling",
  },
  {
    speaker: "LEAD",
    text: "Most go to voicemail, and we try to return them when we can, but honestly we miss quite a few.",
    notes: "Pain point confirmed: Missed calls",
  },
  {
    speaker: "AGENT",
    text: "That's actually very common for busy practices. How many calls would you estimate you're missing during peak hours?",
    notes: "Question 3: Quantify the problem",
  },
  {
    speaker: "LEAD",
    text: "Probably 5-10 per day, especially between 8-11 AM when we're the busiest.",
    notes: "Quantified: 5-10 missed calls daily",
  },
  {
    speaker: "AGENT",
    text: "That's significant. What would happen if you had an automated system that could answer those calls, take messages, and even schedule appointments?",
    notes: "Question 4: Interest assessment",
  },
  {
    speaker: "LEAD",
    text: "That would be incredible, honestly. We've been looking for a solution but haven't found the right fit.",
    notes: "High interest confirmed",
  },
  {
    speaker: "AGENT",
    text: "Perfect. Could I get the best email address to send you some information about our AI-powered phone answering solution?",
    notes: "Question 5: Contact information",
  },
  {
    speaker: "LEAD",
    text: "Sure, it's dr.mitchell@austinsmilecenter.com.",
    notes: "Email collected",
  },
  {
    speaker: "AGENT",
    text: "Excellent. Thank you so much for your time, Dr. Mitchell. We'll be in touch within 24 hours with more details.",
    notes: "Closing - next step confirmed",
  },
];

// ─── Main Test Function ─────────────────────────────────────────

async function testConversation() {
  console.log("📞 CALL-E Conversation Test");
  console.log("=" .repeat(70));

  // Step 1: Generate call brief
  console.log("\n1️⃣  Generating Call Brief...");
  
  const brief = await generateCallBrief({
    leadName: TEST_LEAD.name,
    phone: TEST_LEAD.phone,
    location: TEST_LEAD.location,
    category: TEST_LEAD.category,
    evidence: TEST_LEAD.evidence,
    hypothesis: TEST_LEAD.hypothesis,
    callQuestions: [
      "Who currently handles incoming calls?",
      "Do you experience missed calls during busy periods?",
      "What happens with after-hours calls?",
      "Are you currently considering any solutions to improve call handling?",
      "Who would make the decision about adopting a new phone solution?",
    ],
    clientDescription: "AI-powered receptionist and phone answering solution provider",
  });

  console.log("\n📋 Call Brief:");
  console.log("-".repeat(70));
  console.log(`Target: ${brief.target.name}`);
  console.log(`Phone: ${brief.target.phone}`);
  console.log(`Objective: ${brief.objective}`);
  console.log(`\nQuestions:`);
  brief.questions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
  console.log(`\nConstraints:`);
  brief.constraints.forEach((c) => console.log(`  • ${c}`));

  // Step 2: Convert to CALL-E task
  console.log("\n2️⃣  CALL-E Task:");
  console.log("-".repeat(70));
  const calleTask = briefToCalleTask(brief);
  console.log(calleTask);

  // Step 3: Simulate conversation
  console.log("\n3️⃣  Conversation Flow:");
  console.log("=" .repeat(70));
  
  for (const turn of CONVERSATION) {
    const prefix = turn.speaker === "AGENT" ? "🤖 Agent:" : "👤 Lead: ";
    console.log(`\n${prefix}`);
    console.log(`"${turn.text}"`);
    if (turn.notes) {
      console.log(`  📝 ${turn.notes}`);
    }
  }

  console.log("\n" + "=" .repeat(70));

  // Step 4: Generate structured result
  console.log("\n4️⃣  Structured Result:");
  console.log("-".repeat(70));
  
  const structuredResult: CallStructuredResult = {
    decisionMakerReached: true,
    needConfirmed: true,
    currentSolution: "Receptionist with voicemail fallback",
    nextAction: "Schedule product demo with Dr. Sarah Mitchell",
    additionalNotes: "Confirmed Austin Smile Center misses 5-10 calls daily during peak hours. Decision maker expressed strong interest in AI solution.",
  };

  console.log("Decision Maker Reached: ✅ YES");
  console.log("Need Confirmed: ✅ YES");
  console.log(`Current Solution: ${structuredResult.currentSolution}`);
  console.log(`Next Action: ${structuredResult.nextAction}`);
  console.log(`Notes: ${structuredResult.additionalNotes}`);

  // Step 5: Synthesize result
  console.log("\n5️⃣  Synthesis:");
  console.log("-".repeat(70));
  
  const synthesis = await synthesizeCallResult(
    TEST_LEAD.name,
    structuredResult,
    TEST_LEAD.hypothesis
  );

  console.log(`Qualification: ${synthesis.qualification.toUpperCase()}`);
  console.log(`Summary: ${synthesis.summary}`);
  console.log(`\nVerified Facts:`);
  synthesis.verifiedFacts.forEach((fact) => console.log(`  ✓ ${fact}`));
  console.log(`\nNext Action: ${synthesis.nextAction}`);

  // Step 6: What would be saved
  console.log("\n6️⃣  What Gets Saved to Database:");
  console.log("-".repeat(70));
  console.log("Lead Record:");
  console.log(`  • Status: CALLED`);
  console.log(`  • Qualification: ${synthesis.qualification.toUpperCase()}`);
  console.log(`  • Recommended Action: ${synthesis.nextAction}`);
  console.log("\nCall Record:");
  console.log(`  • Duration: ~3 minutes`);
  console.log(`  • Status: COMPLETED`);
  console.log(`  • Brief: [Stored as JSON]`);
  console.log("\nCall Result:");
  console.log(`  • Structured Result: [Stored as JSON]`);
  console.log(`  • Summary: ${synthesis.summary}`);
  console.log(`  • Confidence: 85%`);
  console.log("\nEvidence Items Added:");
  synthesis.verifiedFacts.forEach((fact) => console.log(`  • ${fact}`));

  // Summary
  console.log("\n" + "=" .repeat(70));
  console.log("✅ CONVERSATION TEST COMPLETE");
  console.log("=" .repeat(70));
  console.log("\nTo run the full pipeline with database:");
  console.log("  pnpm tsx scripts/test-calle-pipeline.ts");
}

// Run the test
testConversation().catch(console.error);
