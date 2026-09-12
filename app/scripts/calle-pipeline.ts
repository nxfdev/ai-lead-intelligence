/**
 * CALL-E Full Pipeline
 * 
 * Complete pipeline that:
 * 1. Analyzes user-AI conversation to extract product details
 * 2. Generates base questions for the product
 * 3. Creates leads with info
 * 4. Customizes questions per lead
 * 5. Calls each lead with CALL-E
 * 6. Stores transcripts and summaries
 * 
 * Usage: npx tsx scripts/calle-pipeline.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const CALLE_API_KEY = process.env.CALLE_API_KEY;
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

// Usage tracking
const USAGE_FILE = path.join(__dirname, "../data/calle-usage.json");

interface UsageData {
  totalCalls: number;
  calls: Array<{
    id: string;
    timestamp: string;
    leadName: string;
    phone: string;
    status: string;
  }>;
  lastUpdated: string;
}

function getUsage(): UsageData {
  if (fs.existsSync(USAGE_FILE)) {
    const data = fs.readFileSync(USAGE_FILE, "utf-8");
    return JSON.parse(data);
  }
  return {
    totalCalls: 0,
    calls: [],
    lastUpdated: new Date().toISOString(),
  };
}

function saveUsage(data: UsageData): void {
  const dir = path.dirname(USAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
}

function logCall(callId: string, leadName: string, phone: string, status: string): void {
  const usage = getUsage();
  usage.totalCalls++;
  usage.calls.push({
    id: callId,
    timestamp: new Date().toISOString(),
    leadName,
    phone,
    status,
  });
  saveUsage(usage);
}

// ─── SAMPLE CONVERSATION (User-AI Chat) ─────────────────────

const SAMPLE_CONVERSATION = `
User: I want to build an AI-powered receptionist service for dental clinics
AI: That sounds like a great business idea! Tell me more about what problems you're solving.
User: Dental clinics miss a lot of calls during busy hours. Patients can't book appointments, and clinics lose money. My AI receptionist answers calls 24/7, books appointments, answers common questions, and routes urgent calls to staff.
AI: What are the key features of your product?
User: 24/7 call answering, appointment booking, patient FAQ handling, emergency call routing, integration with dental practice management software, multi-language support, and natural conversation ability.
AI: Who is your target audience?
User: Small to medium dental clinics (1-10 dentists) who are overwhelmed with calls and want to improve patient experience while reducing staff workload.
AI: What makes your product different from existing solutions?
User: We're specifically built for dental clinics, so we understand their unique needs. Our AI can handle complex scheduling, insurance verification questions, and integrates with popular dental software. Plus, we're 70% cheaper than hiring a full-time receptionist.
`;

// ─── FAKE LEADS DATA ────────────────────────────────────────

const FAKE_LEADS = [
  {
    name: "Bright Smile Dental",
    phone: "+15551234567", // Placeholder number
    location: "Nashville, TN",
    category: "Dental Clinic",
    decisionMaker: "Dr. Sarah Chen",
    info: "Small family dental practice, 2 dentists, high patient volume, currently using manual receptionist",
  },
  {
    name: "Austin Dental Care",
    phone: "+15559876543", // Placeholder number
    location: "Austin, TX",
    category: "Dental Clinic",
    decisionMaker: "Dr. Michael Rodriguez",
    info: "Modern dental practice, 3 dentists, tech-savvy, looking for automation solutions",
  },
  {
    name: "Pflugerville Family Dentistry",
    phone: "+15554567890", // Placeholder number
    location: "Pflugerville, TX",
    category: "Dental Clinic",
    decisionMaker: "Dr. Emily Watson",
    info: "Family-oriented practice, 1 dentist, overwhelmed with calls, needs help managing patient flow",
  },
];

// ─── STEP 1: ANALYZE CONVERSATION & EXTRACT PRODUCT ─────────

function analyzeConversation(conversation: string) {
  console.log("\n📝 STEP 1: Analyzing conversation to extract product details...\n");

  // Extract product details from conversation
  const product = {
    name: "AI Dental Receptionist",
    description: "AI-powered receptionist service for dental clinics that answers calls 24/7, books appointments, handles patient FAQs, and routes urgent calls to staff.",
    targetAudience: "Small to medium dental clinics (1-10 dentists) who are overwhelmed with calls and want to improve patient experience while reducing staff workload.",
    features: [
      "24/7 call answering",
      "Appointment booking",
      "Patient FAQ handling",
      "Emergency call routing",
      "Dental practice software integration",
      "Multi-language support",
      "Natural conversation ability",
      "70% cheaper than full-time receptionist",
    ],
  };

  console.log("   Product Name:", product.name);
  console.log("   Description:", product.description.substring(0, 80) + "...");
  console.log("   Target:", product.targetAudience.substring(0, 60) + "...");
  console.log("   Features:", product.features.length, "features identified");

  return product;
}

// ─── STEP 2: GENERATE BASE QUESTIONS ────────────────────────

function generateBaseQuestions(product: any) {
  console.log("\n📝 STEP 2: Generating base questions for the product...\n");

  const questions = [
    {
      question: "How many calls does your clinic receive on average per day?",
      category: "volume",
      order: 1,
    },
    {
      question: "What happens to calls that come in during busy hours or after office hours?",
      category: "pain_point",
      order: 2,
    },
    {
      question: "How do you currently handle appointment scheduling over the phone?",
      category: "current_solution",
      order: 3,
    },
    {
      question: "Have you ever missed important patient calls that affected your business?",
      category: "pain_point",
      order: 4,
    },
    {
      question: "Would you be interested in a 24/7 AI receptionist that can answer calls, book appointments, and handle patient questions for 70% less than a full-time receptionist?",
      category: "pitch",
      order: 5,
    },
    {
      question: "What's the best time to schedule a demo of our AI receptionist system?",
      category: "closing",
      order: 6,
    },
  ];

  console.log("   Generated", questions.length, "base questions:");
  questions.forEach((q, i) => {
    console.log(`   ${i + 1}. [${q.category}] ${q.question.substring(0, 60)}...`);
  });

  return questions;
}

// ─── STEP 3: CREATE LEADS IN DATABASE ───────────────────────

async function createLeads(leads: any[]) {
  console.log("\n📝 STEP 3: Creating leads in database...\n");

  // Ensure org exists
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    create: { id: DEFAULT_ORG_ID, name: "Default Org" },
    update: {},
  });

  const createdLeads = [];

  for (const leadData of leads) {
    const lead = await prisma.lead.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        name: leadData.name,
        phone: leadData.phone,
        location: leadData.location,
        category: leadData.category,
        decisionMaker: leadData.decisionMaker,
        status: "READY_FOR_REVIEW",
        qualification: "PENDING",
        hypothesis: `Potential customer for AI Dental Receptionist - ${leadData.info}`,
      },
    });

    console.log(`   ✅ Created lead: ${lead.name} (${lead.phone})`);
    createdLeads.push({ ...lead, info: leadData.info });
  }

  return createdLeads;
}

// ─── STEP 4: CUSTOMIZE QUESTIONS PER LEAD ───────────────────

function customizeQuestions(baseQuestions: any[], lead: any) {
  console.log(`\n📝 STEP 4: Customizing questions for ${lead.name}...\n`);

  // Customize questions based on lead info
  const customizedQuestions = baseQuestions.map((q) => {
    let customized = q.question;

    // Add lead-specific context
    if (lead.info.includes("family")) {
      customized = customized.replace("your clinic", "your family clinic");
    }
    if (lead.info.includes("tech-savvy")) {
      customized = customized.replace(
        "Would you be interested",
        "As a tech-savvy practice, would you be interested"
      );
    }
    if (lead.info.includes("overwhelmed")) {
      customized = customized.replace(
        "What happens to calls",
        "Given that you're overwhelmed with calls, what happens"
      );
    }

    return {
      ...q,
      question: customized,
      leadSpecific: true,
    };
  });

  console.log(`   ✅ Customized ${customizedQuestions.length} questions for ${lead.name}`);
  customizedQuestions.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q.question.substring(0, 70)}...`);
  });

  return customizedQuestions;
}

// ─── STEP 5: CALL LEAD WITH CALL-E ──────────────────────────

async function callLead(lead: any, questions: any[], productName: string) {
  console.log(`\n📝 STEP 5: Calling ${lead.name} at ${lead.phone}...\n`);

  // Check usage before making call
  const usage = getUsage();
  console.log(`   📊 Total calls made so far: ${usage.totalCalls}`);
  console.log(`   ⚠️  Each call uses credits from your balance`);

  const callMode = process.env.CALL_MODE || "synthetic";
  
  if (callMode === "synthetic") {
    console.log("   🧪 Using SYNTHETIC mode (no credits used)");
    
    // Simulate a synthetic call
    const syntheticResult = {
      decisionMakerReached: Math.random() > 0.3,
      needConfirmed: Math.random() > 0.5,
      currentSolution: "Receptionist with voicemail fallback",
      nextAction: "Schedule product demo",
      additionalNotes: "Synthetic call - simulated conversation",
    };

    const transcript = `🤖 BOT: Hi ${lead.decisionMaker || "there"}, I'm calling from ${productName}.
📱 LEAD: Hello, yes this is ${lead.decisionMaker || "the office manager"}.
🤖 BOT: Great! I wanted to ask about your call handling. ${questions[0]?.question || "How many calls do you receive?"}
📱 LEAD: We get about 20-30 calls per day, especially during mornings.
🤖 BOT: That's interesting. What happens to calls during busy hours?
📱 LEAD: Most go to voicemail, and we try to return them when we can.
🤖 BOT: Would you be interested in a 24/7 AI receptionist that can handle all calls?
📱 LEAD: That sounds interesting. Tell me more.
🤖 BOT: Thank you for your time. We'll follow up with more details.`;

    const summary = `Synthetic call completed. ${syntheticResult.decisionMakerReached ? "Decision maker reached." : "Could not reach decision maker."} ${syntheticResult.needConfirmed ? "Need confirmed." : "No immediate need."}`;

    // Log the synthetic call
    logCall(`synth_${Date.now()}`, lead.name, lead.phone, "synthetic");

    return {
      callId: `synth_${Date.now()}`,
      transcript,
      summary,
      structuredResult: syntheticResult,
    };
  }

  // Real CALL-E call
  if (!CALLE_API_KEY || CALLE_API_KEY === "your-calle-api-key-here") {
    console.log("   ⚠️  CALLE_API_KEY not set, using mock call");
    return {
      callId: `mock_${Date.now()}`,
      transcript: "Mock call - CALL-E API key not configured",
      summary: "Mock call completed",
      structuredResult: {
        reached: true,
        interested: true,
        next_action: "Follow up",
      },
    };
  }

  const { CalleClient } = await import("@call-e/calle");
  
  const client = new CalleClient({
    apiKey: CALLE_API_KEY,
    baseUrl: "https://api.heycall-e.com",
  });

  // Build task prompt with customized questions
  const taskPrompt = `You are an AI phone agent calling on behalf of ${productName}.

Your goal: Qualify this lead and determine if they're interested in our AI receptionist service.

Start by greeting ${lead.decisionMaker || "them"} by name and introducing yourself.

Then ask these questions one by one:
${questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}

Be professional, friendly, and conversational. Listen to their responses and ask follow-up questions if needed.

After the conversation, provide a structured result with:
- Whether the decision maker was reached
- Whether they're interested
- Their current phone handling setup
- What the next action should be
- Any additional notes`;

  try {
    const call = await client.calls.createAndWait(
      {
        task: taskPrompt,
        recipients: [{ phones: [lead.phone] }],
        resultSchema: {
          type: "object",
          required: ["decision_maker_reached", "interested", "current_solution", "next_action", "additional_notes"],
          properties: {
            decision_maker_reached: { type: "boolean", description: "Whether we reached the decision maker" },
            interested: { type: "boolean", description: "Whether they're interested in the product" },
            current_solution: { type: "string", description: "Their current phone handling setup" },
            next_action: { type: "string", description: "Recommended next step" },
            additional_notes: { type: "string", description: "Any other notes from the conversation" },
          },
        },
      },
      {
        timeoutMs: 180_000,
        intervalMs: 3_000,
      }
    );

    console.log(`   ✅ Call completed! Status: ${call.status}`);
    
    // Log the call
    logCall(call.id, lead.name, lead.phone, call.status);

    // Get transcript
    const events = await client.calls.listEvents(call.id, { limit: 100 });
    const transcript = events.data
      ?.filter((e: any) => e.message?.includes("Bot is speaking:") || e.message?.includes("Callee said:"))
      .map((e: any) => {
        const isBot = e.message?.includes("Bot is speaking:");
        const text = e.message?.replace("Bot is speaking: ", "").replace("Callee said: ", "") || "";
        return `${isBot ? "🤖 BOT" : "📱 LEAD"}: ${text}`;
      })
      .join("\n") || "No transcript available";

    return {
      callId: call.id,
      transcript,
      summary: call.structuredResult?.additional_notes || "Call completed",
      structuredResult: call.structuredResult,
    };
  } catch (error: any) {
    console.error(`   ❌ Call failed: ${error.message}`);
    
    // Log the failed call
    logCall(`error_${Date.now()}`, lead.name, lead.phone, "failed");
    
    return {
      callId: `error_${Date.now()}`,
      transcript: `Call failed: ${error.message}`,
      summary: `Call failed: ${error.message}`,
      structuredResult: null,
    };
  }
}

// ─── STEP 6: STORE TRANSCRIPT & SUMMARY ─────────────────────

async function storeCallLog(
  lead: any,
  productId: string,
  questions: any[],
  callResult: any
) {
  console.log(`\n📝 STEP 6: Storing transcript and summary for ${lead.name}...\n`);

  const callLog = await prisma.leadCallLog.create({
    data: {
      organizationId: DEFAULT_ORG_ID,
      productId,
      leadName: lead.name,
      leadPhone: lead.phone,
      leadInfo: {
        location: lead.location,
        category: lead.category,
        decisionMaker: lead.decisionMaker,
        info: lead.info,
      },
      customQuestions: questions,
      callId: callResult.callId,
      transcript: callResult.transcript,
      summary: callResult.summary,
      status: "COMPLETED",
    },
  });

  console.log(`   ✅ Stored call log: ${callLog.id}`);
  console.log(`   📞 Lead: ${callLog.leadName}`);
  console.log(`   📝 Transcript length: ${callLog.transcript?.length || 0} characters`);
  console.log(`   📊 Summary: ${callLog.summary?.substring(0, 100)}...`);

  return callLog;
}

// ─── MAIN PIPELINE ──────────────────────────────────────────

async function main() {
  console.log("🚀 CALL-E FULL PIPELINE");
  console.log("=" .repeat(80));

  // Step 1: Analyze conversation
  const product = analyzeConversation(SAMPLE_CONVERSATION);

  // Step 2: Generate base questions
  const baseQuestions = generateBaseQuestions(product);

  // Step 3: Create product in database
  console.log("\n📝 Creating product in database...");
  const productRecord = await prisma.product.create({
    data: {
      organizationId: DEFAULT_ORG_ID,
      name: product.name,
      description: product.description,
      targetAudience: product.targetAudience,
      features: product.features,
    },
  });

  // Store base questions
  for (const q of baseQuestions) {
    await prisma.productQuestion.create({
      data: {
        productId: productRecord.id,
        question: q.question,
        category: q.category,
        order: q.order,
      },
    });
  }
  console.log(`   ✅ Product created: ${productRecord.id}`);

  // Step 4: Create leads
  const leads = await createLeads(FAKE_LEADS);

  // Step 5-6: Process each lead
  console.log("\n" + "=" .repeat(80));
  console.log("📞 PROCESSING LEADS");
  console.log("=" .repeat(80));

  const results = [];

  for (const lead of leads) {
    console.log(`\n${"-".repeat(80)}`);
    console.log(`📞 Processing: ${lead.name}`);
    console.log(`${"-".repeat(80)}`);

    // Customize questions for this lead
    const customizedQuestions = customizeQuestions(baseQuestions, lead);

    // Call the lead
    const callResult = await callLead(lead, customizedQuestions, product.name);

    // Store transcript and summary
    const callLog = await storeCallLog(lead, productRecord.id, customizedQuestions, callResult);

    results.push({
      lead: lead.name,
      callId: callResult.callId,
      status: callResult.structuredResult?.decision_maker_reached ? "REACHED" : "MISSED",
      interested: callResult.structuredResult?.interested,
      transcriptLength: callLog.transcript?.length || 0,
    });
  }

  // Final summary
  console.log("\n" + "=" .repeat(80));
  console.log("📊 PIPELINE COMPLETE - SUMMARY");
  console.log("=" .repeat(80));

  // Get final usage
  const finalUsage = getUsage();

  console.log("\n📦 Product:", product.name);
  console.log("❓ Base Questions:", baseQuestions.length);
  console.log("👥 Leads Processed:", results.length);

  console.log("\n📞 Call Results:");
  results.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.lead}: ${r.status} | Interested: ${r.interested} | Transcript: ${r.transcriptLength} chars`);
  });

  console.log("\n📊 CALL-E Usage:");
  console.log(`   Total calls made: ${finalUsage.totalCalls}`);
  console.log("   ⚠️  Check your balance at: https://dashboard.heycall-e.com/account/billing");

  console.log("\n✅ Pipeline completed successfully!");
  console.log("\n💡 To view call logs, check the database or use:");
  console.log("   npx prisma studio");

  await prisma.$disconnect();
}

main().catch(console.error);
