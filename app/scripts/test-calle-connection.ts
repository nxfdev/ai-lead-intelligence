/**
 * Test CALL-E SDK Connection
 * 
 * Tests the CALL-E SDK integration:
 * 1. Verifies API key works
 * 2. Tests client initialization
 * 3. Optionally makes a real call (if phone number provided)
 * 
 * Usage: 
 *   npx tsx scripts/test-calle-connection.ts                    # Test connection only
 *   npx tsx scripts/test-calle-connection.ts +15125551234       # Test with real call
 */

import "dotenv/config";

const CALLE_API_KEY = process.env.CALLE_API_KEY;
const phoneArg = process.argv[2];

async function main() {
  console.log("📞 CALL-E SDK Connection Test\n");

  // Check API key
  if (!CALLE_API_KEY || CALLE_API_KEY === "your-calle-api-key-here") {
    console.error("❌ CALLE_API_KEY not set in .env");
    process.exit(1);
  }

  console.log("✅ API Key found:", CALLE_API_KEY.substring(0, 20) + "...");

  // Dynamic import to avoid ESM issues
  const { CalleClient } = await import("@call-e/calle");

  // Initialize client
  const client = new CalleClient({
    apiKey: CALLE_API_KEY,
    baseUrl: "https://api.heycall-e.com",
  });

  console.log("✅ Client initialized");

  // Test connection by listing goals (read-only operation)
  try {
    console.log("\n🔍 Testing connection...");
    const goals = await client.goals.list({ limit: 1 });
    console.log("✅ Connection successful!");
    console.log(`   Found ${goals.data?.length || 0} goals in your account`);
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message);
    if (error.status === 401) {
      console.error("   → Invalid API key");
    } else if (error.status === 403) {
      console.error("   → API key doesn't have access");
    }
    process.exit(1);
  }

  // If phone number provided, make a test call
  if (phoneArg) {
    console.log(`\n📞 Making test call to ${phoneArg}...`);
    
    try {
      const call = await client.calls.createAndWait(
        {
          task: `Hello, this is a test call from AI Lead Intelligence. Please confirm you can hear me clearly. Just say "yes" or "no".`,
          recipients: [{ phones: [phoneArg] }],
          resultSchema: {
            type: "object",
            required: ["can_hear_clearly"],
            properties: {
              can_hear_clearly: { type: "string", enum: ["yes", "no", "unknown"] },
            },
          },
        },
        {
          timeoutMs: 60_000,
          intervalMs: 2_000,
        }
      );

      console.log("\n✅ Call completed!");
      console.log(`   Status: ${call.status}`);
      console.log(`   Task Completed: ${call.taskCompleted}`);
      console.log(`   Result:`, call.structuredResult);
      console.log(`   Evidence:`, call.evidence);
    } catch (error: any) {
      console.error("❌ Call failed:", error.message);
    }
  } else {
    console.log("\n💡 To test a real call, run:");
    console.log("   npx tsx scripts/test-calle-connection.ts +15125551234");
  }

  console.log("\n✅ SDK test completed!");
}

main().catch(console.error);
