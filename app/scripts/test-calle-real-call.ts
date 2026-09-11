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

  console.log("✅ Client initialized");
  console.log("📞 Calling +16158159219...\n");

  try {
    const call = await client.calls.createAndWait(
      {
        task: `You are an AI phone agent calling on behalf of Lord Nasif. 

Start the call by:
1. Say "Hi Drakula Serat"
2. Introduce yourself and say you work for Lord Nasif
3. Ask him a question about how his business is doing

Be professional, friendly, and conversational. Keep responses short and natural.

After the conversation, provide a structured result with:
- Whether Drakula Serat was reached
- What he said about his business
- What the next action should be
- Any additional notes`,
        recipients: [{ phones: ["+16158159219"] }],
        resultSchema: {
          type: "object",
          required: ["drakula_reached", "business_update", "next_action", "additional_notes"],
          properties: {
            drakula_reached: { type: "boolean", description: "Whether Drakula Serat was reached" },
            business_update: { type: "string", description: "What he said about his business" },
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
