/**
 * CALL-E LLM Conversation Test
 * 
 * Tests the NVIDIA LLM-powered conversation generation.
 * Shows real AI-generated responses for phone qualification calls.
 * 
 * Usage: npx tsx scripts/test-calle-llm.ts
 */

import "dotenv/config";
import { callLLMFreeform } from "../src/lib/llm";

// ─── Test Lead Data ──────────────────────────────────────────────

const TEST_LEAD = {
  name: "Austin Smile Center",
  phone: "+15551234567",
  location: "Austin, TX",
  category: "Dental Practice",
  decisionMaker: "Dr. Sarah Mitchell",
};

// ─── Test 1: Basic LLM Connection ───────────────────────────────

async function testLLMConnection() {
  console.log("🔌 Testing NVIDIA LLM Connection...");
  console.log("=" .repeat(60));
  
  try {
    const response = await callLLMFreeform({
      prompt: "Say 'Hello from NVIDIA LLM!' in exactly 5 words.",
      temperature: 0.1,
      maxTokens: 50,
    });
    
    console.log("✅ LLM Response:", response);
    console.log("\n");
    return true;
  } catch (error) {
    console.error("❌ LLM Connection Failed:", (error as Error).message);
    console.log("\n");
    return false;
  }
}

// ─── Test 2: Generate Call Brief ─────────────────────────────────

async function testCallBriefGeneration() {
  console.log("📋 Testing Call Brief Generation...");
  console.log("=" .repeat(60));
  
  const prompt = `Generate a call brief for this lead:

Business: ${TEST_LEAD.name}
Phone: ${TEST_LEAD.phone}
Location: ${TEST_LEAD.location}
Category: ${TEST_LEAD.category}
Decision Maker: ${TEST_LEAD.decisionMaker}

Respond in JSON:
{
  "objective": "Main goal of the call",
  "openingLine": "First thing to say",
  "questions": ["question 1", "question 2", "question 3"],
  "constraints": ["constraint 1", "constraint 2"],
  "successCriteria": ["criteria 1", "criteria 2"]
}`;

  try {
    const response = await callLLMFreeform({
      prompt,
      system: "You are a sales call planner. Generate structured call briefs.",
      temperature: 0.3,
      maxTokens: 1000,
    });
    
    console.log("✅ Call Brief Generated:");
    console.log(response);
    console.log("\n");
    return true;
  } catch (error) {
    console.error("❌ Call Brief Generation Failed:", (error as Error).message);
    console.log("\n");
    return false;
  }
}

// ─── Test 3: Simulate Conversation ───────────────────────────────

async function testConversation() {
  console.log("📞 Testing AI Conversation Generation...");
  console.log("=" .repeat(60));
  
  const conversationHistory = [
    {
      role: "agent" as const,
      content: `Hello, is this ${TEST_LEAD.name}? I'm calling from AI Lead Intelligence regarding your business's ability to handle customer calls.`,
    },
    {
      role: "lead" as const,
      content: `Yes, this is ${TEST_LEAD.decisionMaker} speaking.`,
    },
  ];

  const brief = {
    objective: "Determine whether the business currently has difficulty handling inbound calls.",
    questions: [
      "Who currently handles incoming calls?",
      "Do you experience missed calls during busy periods?",
      "What happens with after-hours calls?",
      "Are you currently considering any solutions to improve call handling?",
      "Who would make the decision about adopting a new phone solution?",
    ],
    constraints: [
      "Do not make purchases or financial commitments",
      "Do not misrepresent identity",
      "Be professional and respectful of the recipient's time",
    ],
  };

  const systemPrompt = `You are an AI phone agent conducting a qualification call.
Your goal is to determine if the business needs better call handling.
Be professional, friendly, and concise.
Never make commitments or promises.
Stay on topic and ask one question at a time.

OBJECTIVE: ${brief.objective}

CONSTRAINTS:
${brief.constraints.map((c) => `- ${c}`).join("\n")}

Questions to ask:
${brief.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

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
    
    console.log("✅ AI Agent Response:");
    console.log(`"${response}"`);
    console.log("\n");
    return true;
  } catch (error) {
    console.error("❌ Conversation Generation Failed:", (error as Error).message);
    console.log("\n");
    return false;
  }
}

// ─── Test 4: Generate Lead Score Analysis ────────────────────────

async function testScoreAnalysis() {
  console.log("📊 Testing Lead Score Analysis...");
  console.log("=" .repeat(60));
  
  const prompt = `Analyze this lead and provide a qualification summary:

Business: ${TEST_LEAD.name}
Location: ${TEST_LEAD.location}
Category: ${TEST_LEAD.category}

Evidence:
- High call volume during morning hours
- Multiple reviews mention difficulty getting through by phone
- Extended hours (7AM-7PM) create coverage challenges

Respond in JSON:
{
  "score": 85,
  "qualification": "POTENTIAL",
  "hypothesis": "Analysis of the business's needs",
  "recommendedAction": "Recommended next step"
}`;

  try {
    const response = await callLLMFreeform({
      prompt,
      system: "You are a lead scoring analyst. Provide concise analysis.",
      temperature: 0.2,
      maxTokens: 500,
    });
    
    console.log("✅ Score Analysis:");
    console.log(response);
    console.log("\n");
    return true;
  } catch (error) {
    console.error("❌ Score Analysis Failed:", (error as Error).message);
    console.log("\n");
    return false;
  }
}

// ─── Main Test Function ─────────────────────────────────────────

async function runTests() {
  console.log("🚀 CALL-E NVIDIA LLM Integration Test");
  console.log("=" .repeat(60));
  console.log(`Model: ${process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b"}`);
  console.log("=".repeat(60));
  console.log("\n");

  const results = {
    connection: false,
    callBrief: false,
    conversation: false,
    scoreAnalysis: false,
  };

  // Run tests
  results.connection = await testLLMConnection();
  results.callBrief = await testCallBriefGeneration();
  results.conversation = await testConversation();
  results.scoreAnalysis = await testScoreAnalysis();

  // Summary
  console.log("=" .repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Connection:     ${results.connection ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Call Brief:     ${results.callBrief ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Conversation:   ${results.conversation ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Score Analysis: ${results.scoreAnalysis ? "✅ PASS" : "❌ FAIL"}`);
  console.log("=".repeat(60));

  const allPassed = Object.values(results).every((r) => r);
  console.log(`\n${allPassed ? "✅ All tests passed!" : "⚠️ Some tests failed."}`);
  
  if (allPassed) {
    console.log("\n🚀 Ready to run the full pipeline:");
    console.log("   pnpm tsx scripts/test-calle-pipeline.ts");
  }
}

// Run the tests
runTests().catch(console.error);
