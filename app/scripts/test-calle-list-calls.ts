/**
 * List Recent CALL-E Calls
 * 
 * Lists recent calls to find call IDs for transcript retrieval.
 * 
 * Usage: npx tsx scripts/test-calle-list-calls.ts
 */

import "dotenv/config";

const CALLE_API_KEY = process.env.CALLE_API_KEY;

async function main() {
  console.log("📞 Listing Recent CALL-E Calls\n");

  const { CalleClient } = await import("@call-e/calle");
  
  const client = new CalleClient({
    apiKey: CALLE_API_KEY,
    baseUrl: "https://api.heycall-e.com",
  });

  try {
    // List recent calls
    const calls = await client.calls.list({ limit: 10 });
    
    if (calls.data && calls.data.length > 0) {
      console.log(`Found ${calls.data.length} calls:\n`);
      for (const call of calls.data) {
        console.log(`ID: ${call.id}`);
        console.log(`Status: ${call.status}`);
        console.log(`Created: ${call.createdAt}`);
        console.log(`Recipient: ${call.recipients?.[0]?.phone}`);
        console.log("---");
      }
    } else {
      console.log("No calls found");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);
