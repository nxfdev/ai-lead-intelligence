/**
 * Test CALL-E Real Call
 * 
 * Makes a real call to a lead and records the conversation.
 * 
 * Usage: npx tsx scripts/test-calle-real-call.ts
 */

import "dotenv/config";

const CALLE_API_KEY = process.env.CALLE_API_KEY;

async function main() {
  console.log("📞 Making Real Call via CALL-E\n");

  if (!CALLE_API_KEY || CALLE_API_KEY === "your-calle-api-key-here") {
    console.error("❌ CALLE_API_KEY not set in .env");
    process.exit(1);
  }

  const { CalleClient } = await import("@call-e/calle");

  const client = new CalleClient({
    apiKey: CALLE_API_KEY,
    baseUrl: "https://api.heycall-e.com",
  });

  // Get phone number from command line or use placeholder
  const phoneNumber = process.argv[2] || "+15551234567";
  const recipientName = process.argv[3] || "John Doe";
  const companyName = process.argv[4] || "ACME Corp";

  console.log("✅ Client initialized");
  console.log(`📞 Calling ${phoneNumber}...\n`);

  try {
    const call = await client.calls.createAndWait(
      {
        task: `You are an AI phone agent calling on behalf of ${companyName}. 

Start the call by:
1. Say "Hi ${recipientName}"
2. Introduce yourself and say you work for ${companyName}
3. Ask them a question about how their business is doing

Be professional, friendly, and conversational. Keep responses short and natural.

After the conversation, provide a structured result with:
- Whether ${recipientName} was reached
- What they said about their business
- What the next action should be
- Any additional notes`,
        recipients: [{ phones: [phoneNumber] }],
        resultSchema: {
          type: "object",
          required: ["recipient_reached", "business_update", "next_action", "additional_notes"],
          properties: {
            recipient_reached: { type: "boolean", description: `Whether ${recipientName} was reached` },
            business_update: { type: "string", description: "What they said about their business" },
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

    console.log("✅ Call completed!\n");
    console.log("📊 Results:");
    console.log(`   Call ID: ${call.id}`);
    console.log(`   Status: ${call.status}`);
    console.log(`   Task Completed: ${call.taskCompleted}`);
    console.log(`   Completion Confidence: ${JSON.stringify(call.completionConfidence)}`);
    console.log(`   Structured Result:`, JSON.stringify(call.structuredResult, null, 2));
    console.log(`   Evidence:`, call.evidence);
    
    // Save call ID for transcript retrieval
    console.log(`\n💡 To get full transcript, run:`);
    console.log(`   npx tsx scripts/test-calle-transcript.ts ${call.id}`);

  } catch (error: any) {
    console.error("❌ Call failed:", error.message);
    if (error.status) {
      console.error("   Status:", error.status);
    }
  }
}

main().catch(console.error);
