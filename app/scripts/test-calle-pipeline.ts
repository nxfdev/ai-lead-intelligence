/**
 * CALL-E Pipeline Test Script
 * 
 * Comprehensive test that demonstrates the full CALL-E AI agent pipeline:
 * 1. Creates a test lead with evidence
 * 2. Generates a structured call brief
 * 3. Simulates the conversation flow
 * 4. Shows what the agent would say and collect
 * 5. Generates the structured result
 * 6. Synthesizes the outcome
 * 7. Updates the lead record
 * 
 * Usage: npx tsx scripts/test-calle-pipeline.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateCallBrief, briefToCalleTask, generateResultSchema } from "../src/server/services/call-brief";
import { synthesizeCallResult } from "../src/server/services/synthesis";
import type { CallStructuredResult, CallBrief } from "../src/lib/types";

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

// ─── Test Data ──────────────────────────────────────────────────

const TEST_LEADS = [
  {
    name: "Austin Smile Center",
    phone: "+15551234567",
    location: "Austin, TX",
    category: "Dental Practice",
    website: "https://austinsmilecenter.com",
    employeeCount: 15,
    decisionMaker: "Dr. Sarah Mitchell",
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
      {
        type: "INFERRED" as const,
        claim: "Business likely needs additional phone capacity",
        source: "ai_inference",
        observedAt: new Date().toISOString(),
        confidence: 0.72,
      },
    ],
    hypothesis: "Austin Smile Center shows strong indicators of phone handling challenges based on customer reviews mentioning difficulty reaching the office. They likely need an AI receptionist solution to handle peak hours.",
  },
  {
    name: "Pflugerville Dental Associates",
    phone: "+15559876543",
    location: "Pflugerville, TX",
    category: "Dental Practice",
    website: "https://pflugervilledental.com",
    employeeCount: 20,
    decisionMaker: "Dr. James Park",
    evidence: [
      {
        type: "OBSERVED" as const,
        claim: "Extended hours (7AM-7PM) create coverage challenges",
        source: "website_analysis",
        observedAt: new Date().toISOString(),
        confidence: 0.9,
      },
      {
        type: "VERIFIED" as const,
        claim: "Recently posted job listing for receptionist",
        source: "indeed_job_posting",
        observedAt: new Date().toISOString(),
        confidence: 0.95,
      },
    ],
    hypothesis: "Pflugerville Dental Associates has extended operating hours that create phone coverage gaps. Their recent receptionist job posting indicates they're actively seeking solutions for call handling.",
  },
  {
    name: "Westlake Dental Studio",
    phone: "+15554567890",
    location: "Austin, TX",
    category: "Dental Practice",
    website: "https://westlakedentalstudio.com",
    employeeCount: 8,
    decisionMaker: "Dr. Emily Nguyen",
    evidence: [
      {
        type: "OBSERVED" as const,
        claim: "Small practice with limited staff",
        source: "google_maps",
        observedAt: new Date().toISOString(),
        confidence: 0.8,
      },
    ],
    hypothesis: "Westlake Dental Studio is a small practice that may struggle with phone coverage during busy periods.",
  },
];

// ─── Conversation Simulation ────────────────────────────────────

interface ConversationTurn {
  speaker: "AGENT" | "LEAD";
  text: string;
}

function simulateConversation(brief: CallBrief): ConversationTurn[] {
  const leadName = brief.target.name.split(" ")[0]; // First word
  const businessName = brief.target.name;

  return [
    {
      speaker: "AGENT",
      text: `Hello, is this ${businessName}? I'm calling from AI Lead Intelligence regarding your business's ability to handle customer calls.`,
    },
    {
      speaker: "LEAD",
      text: `Yes, this is ${brief.businessContext.decisionMaker || "the office manager"} speaking.`,
    },
    {
      speaker: "AGENT",
      text: `Great, thank you for taking my call. I'm researching how businesses manage inbound calls during busy periods. Could you tell me who typically handles incoming calls during your business hours?`,
    },
    {
      speaker: "LEAD",
      text: `We have a receptionist who handles most of the calls, but during busy mornings it can get overwhelming.`,
    },
    {
      speaker: "AGENT",
      text: `I understand. And when you're busy, what happens to the calls that come in? Do they go to voicemail, or is there a hold system?`,
    },
    {
      speaker: "LEAD",
      text: `Most go to voicemail, and we try to return them when we can, but honestly we miss quite a few.`,
    },
    {
      speaker: "AGENT",
      text: `That's actually very common. How many calls would you estimate you're missing during peak hours?`,
    },
    {
      speaker: "LEAD",
      text: `Probably 5-10 per day, especially between 8-11 AM when we're the busiest.`,
    },
    {
      speaker: "AGENT",
      text: `That's significant. What would happen if you had an automated system that could answer those calls, take messages, and even schedule appointments?`,
    },
    {
      speaker: "LEAD",
      text: `That would be incredible, honestly. We've been looking for a solution but haven't found the right fit.`,
    },
    {
      speaker: "AGENT",
      text: `Perfect. Could I get the best email address to send you some information about our AI-powered phone answering solution?`,
    },
    {
      speaker: "LEAD",
      text: `Sure, it's dr.mitchell@austinsmilecenter.com.`,
    },
    {
      speaker: "AGENT",
      text: `Excellent. Thank you so much for your time, ${brief.businessContext.decisionMaker || "Doctor"}. We'll be in touch within 24 hours with more details.`,
    },
    {
      speaker: "LEAD",
      text: `Sounds great, thank you!`,
    },
  ];
}

// ─── Main Test Function ─────────────────────────────────────────

async function testCallPipeline() {
  console.log("🚀 Starting CALL-E Pipeline Test\n");
  console.log("=" .repeat(80));

  // Ensure default organization exists
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    create: { id: DEFAULT_ORG_ID, name: "Default Org" },
    update: {},
  });

  for (const leadData of TEST_LEADS) {
    console.log(`\n📞 Testing lead: ${leadData.name}`);
    console.log("-".repeat(60));

    // Step 1: Create or find lead in database
    console.log("\n1️⃣  Creating lead in database...");
    
    let lead = await prisma.lead.findFirst({
      where: {
        name: leadData.name,
        organizationId: DEFAULT_ORG_ID,
      },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          organizationId: DEFAULT_ORG_ID,
          name: leadData.name,
          phone: leadData.phone,
          location: leadData.location,
          category: leadData.category,
          website: leadData.website,
          employeeCount: leadData.employeeCount,
          decisionMaker: leadData.decisionMaker,
          score: 85,
          status: "SCORED",
          qualification: "POTENTIAL",
          hypothesis: leadData.hypothesis,
          profileJson: {
            enrichment: {
              description: `${leadData.category} in ${leadData.location}`,
              services: ["Dental Care", "Phone Support"],
            },
          },
        },
      });
      console.log(`   ✅ Created lead: ${lead.id}`);
    } else {
      console.log(`   ℹ️  Lead already exists: ${lead.id}`);
    }

    // Step 2: Create evidence records
    console.log("\n2️⃣  Adding evidence records...");
    
    for (const evidence of leadData.evidence) {
      await prisma.evidence.create({
        data: {
          leadId: lead.id,
          type: evidence.type,
          claim: evidence.claim,
          source: evidence.source,
          observedAt: new Date(evidence.observedAt),
          confidence: evidence.confidence,
        },
      });
    }
    console.log(`   ✅ Added ${leadData.evidence.length} evidence items`);

    // Step 3: Generate call brief
    console.log("\n3️⃣  Generating call brief...");
    
    const brief = await generateCallBrief({
      leadName: leadData.name,
      phone: leadData.phone,
      location: leadData.location,
      category: leadData.category,
      evidence: leadData.evidence,
      hypothesis: leadData.hypothesis,
      callQuestions: [
        "Who currently handles incoming calls?",
        "Do you experience missed calls during busy periods?",
        "What happens with after-hours calls?",
        "Are you currently considering any solutions to improve call handling?",
        "Who would make the decision about adopting a new phone solution?",
      ],
      clientDescription: "AI-powered receptionist and phone answering solution provider",
    });

    console.log("   📋 Call Brief Generated:");
    console.log(`      Target: ${brief.target.name}`);
    console.log(`      Phone: ${brief.target.phone}`);
    console.log(`      Objective: ${brief.objective.substring(0, 80)}...`);
    console.log(`      Questions: ${brief.questions.length}`);
    console.log(`      Constraints: ${brief.constraints.length}`);

    // Step 4: Convert to CALL-E task
    console.log("\n4️⃣  Converting to CALL-E task...");
    
    const calleTask = briefToCalleTask(brief);
    console.log("   📝 CALL-E Task:");
    console.log("   " + "-".repeat(56));
    console.log("   " + calleTask.split("\n").join("\n   "));
    console.log("   " + "-".repeat(56));

    // Step 5: Generate result schema
    console.log("\n5️⃣  Generating result schema...");
    
    const resultSchema = generateResultSchema();
    console.log("   📊 Schema fields:", Object.keys(resultSchema.properties || {}).join(", "));

    // Step 6: Simulate conversation
    console.log("\n6️⃣  Simulating conversation flow...");
    console.log("   " + "=".repeat(56));
    
    const conversation = simulateConversation(brief);
    for (const turn of conversation) {
      const prefix = turn.speaker === "AGENT" ? "🤖 Agent:" : "👤 Lead: ";
      console.log(`   ${prefix} ${turn.text}`);
      if (turn.speaker === "AGENT") {
        await new Promise((r) => setTimeout(r, 500)); // Dramatic pause
      }
    }
    console.log("   " + "=".repeat(56));

    // Step 7: Generate structured result
    console.log("\n7️⃣  Generating structured call result...");
    
    const structuredResult: CallStructuredResult = {
      decisionMakerReached: true,
      needConfirmed: true,
      currentSolution: "Receptionist with voicemail fallback",
      nextAction: "Schedule product demo with Dr. Sarah Mitchell",
      additionalNotes: `Confirmed ${leadData.name} misses 5-10 calls daily during peak hours. Decision maker expressed strong interest in AI solution.`,
    };

    console.log("   📊 Structured Result:");
    console.log(`      Decision Maker Reached: ${structuredResult.decisionMakerReached ? "✅ Yes" : "❌ No"}`);
    console.log(`      Need Confirmed: ${structuredResult.needConfirmed ? "✅ Yes" : "❌ No"}`);
    console.log(`      Current Solution: ${structuredResult.currentSolution}`);
    console.log(`      Next Action: ${structuredResult.nextAction}`);
    console.log(`      Notes: ${structuredResult.additionalNotes}`);

    // Step 8: Synthesize call result
    console.log("\n8️⃣  Synthesizing call result...");
    
    const synthesis = await synthesizeCallResult(
      leadData.name,
      structuredResult,
      leadData.hypothesis
    );

    console.log("   📝 Synthesis:");
    console.log(`      Qualification: ${synthesis.qualification.toUpperCase()}`);
    console.log(`      Summary: ${synthesis.summary}`);
    console.log(`      Verified Facts: ${synthesis.verifiedFacts.length}`);
    for (const fact of synthesis.verifiedFacts) {
      console.log(`        ✓ ${fact}`);
    }
    console.log(`      Next Action: ${synthesis.nextAction}`);

    // Step 9: Update lead record
    console.log("\n9️⃣  Updating lead record...");
    
    // Update lead qualification
    const qualificationMap: Record<string, string> = {
      qualified: "VERIFIED",
      not_qualified: "NOT_QUALIFIED",
      needs_follow_up: "NEEDS_FOLLOW_UP",
      inconclusive: "PENDING",
    };

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "CALLED",
        qualification: qualificationMap[synthesis.qualification] || "PENDING",
        recommendedAction: synthesis.nextAction,
      },
    });

    // Create call record
    const call = await prisma.call.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        leadId: lead.id,
        calleCallId: `test_call_${Date.now()}`,
        idempotencyKey: `test_${lead.id}_${Date.now()}`,
        status: "COMPLETED",
        briefJson: brief as unknown as Record<string, unknown>,
        duration: 180, // 3 minutes
        startedAt: new Date(Date.now() - 180000),
        completedAt: new Date(),
      },
    });

    // Create call result
    await prisma.callResult.create({
      data: {
        callId: call.id,
        structuredResult: structuredResult as unknown as Record<string, unknown>,
        summary: synthesis.summary,
        confidence: 0.85,
        qualifiedResult: synthesis.qualification,
      },
    });

    // Add verified evidence from call
    for (const fact of synthesis.verifiedFacts) {
      await prisma.evidence.create({
        data: {
          leadId: lead.id,
          type: "VERIFIED",
          claim: fact,
          source: "calle_call",
          sourceReference: call.id,
          observedAt: new Date(),
          confidence: 0.90,
        },
      });
    }

    console.log(`   ✅ Updated lead status: CALLED`);
    console.log(`   ✅ Updated qualification: ${qualificationMap[synthesis.qualification]}`);
    console.log(`   ✅ Created call record: ${call.id}`);
    console.log(`   ✅ Added ${synthesis.verifiedFacts.length} verified evidence items`);

    console.log("\n" + "=".repeat(80));
  }

  // Final summary
  console.log("\n📊 PIPELINE TEST COMPLETE");
  console.log("=" .repeat(80));
  
  const finalLeads = await prisma.lead.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    include: { calls: true, evidence: true },
  });

  console.log(`\n📈 Results Summary:`);
  console.log(`   Total Leads: ${finalLeads.length}`);
  console.log(`   Leads with Calls: ${finalLeads.filter((l) => l.calls.length > 0).length}`);
  console.log(`   Verified Leads: ${finalLeads.filter((l) => l.qualification === "VERIFIED").length}`);
  console.log(`   Total Evidence Items: ${finalLeads.reduce((sum, l) => sum + l.evidence.length, 0)}`);

  console.log("\n💡 What You Need to Provide:");
  console.log("   1. OpenRouter API Key - Set OPENROUTER_API_KEY in .env");
  console.log("   2. CALL-E API Key - Set CALL_E_API_KEY in .env (for live calls)");
  console.log("   3. Set CALL_MODE=live in .env (default is synthetic)");
  console.log("\n🚀 To run the live pipeline:");
  console.log("   pnpm tsx scripts/test-calle-pipeline.ts");
}

// Run the test
testCallPipeline()
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
