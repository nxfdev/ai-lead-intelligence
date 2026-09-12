/**
 * Get CALL-E Call Events/Transcript
 * 
 * Retrieves the full conversation transcript for a call.
 * 
 * Usage: npx tsx scripts/test-calle-transcript.ts <callId>
 */

import "dotenv/config";

const CALLE_API_KEY = process.env.CALLE_API_KEY;

async function main() {
  const callId = process.argv[2];
  
  if (!callId) {
    console.error("Usage: npx tsx scripts/test-calle-transcript.ts <callId>");
    process.exit(1);
  }

  console.log(`📞 Getting transcript for call: ${callId}\n`);

  const { CalleClient } = await import("@call-e/calle");
  
  const client = new CalleClient({
    apiKey: CALLE_API_KEY,
    baseUrl: "https://api.heycall-e.com",
  });

  try {
    // Get call details
    const call = await client.calls.get(callId);
    console.log("📊 Call Details:");
    console.log(`   Status: ${call.status}`);
    console.log(`   Task Completed: ${call.taskCompleted}`);
    console.log(`   Structured Result:`, JSON.stringify(call.structuredResult, null, 2));
    console.log(`   Evidence:`, call.evidence);
    
    // Get events (transcript)
    console.log("\n📝 Conversation Events:");
    const events = await client.calls.listEvents(callId, { limit: 100 });
    
    if (events.data && events.data.length > 0) {
      for (const event of events.data) {
        console.log("\n---");
        console.log(JSON.stringify(event, null, 2));
      }
    } else {
      console.log("   No events found");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);
