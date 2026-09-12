/**
 * Check CALL-E Balance
 * 
 * Checks current CALL-E account balance and usage.
 * 
 * Usage: npx tsx scripts/check-balance.ts
 */

import "dotenv/config";

const CALLE_API_KEY = process.env.CALLE_API_KEY;

async function main() {
  console.log("💰 Checking CALL-E Balance\n");

  if (!CALLE_API_KEY || CALLE_API_KEY === "your-calle-api-key-here") {
    console.error("❌ CALLE_API_KEY not set in .env");
    process.exit(1);
  }

  // Check balance via API
  try {
    const response = await fetch("https://api.heycall-e.com/v1/account/balance", {
      headers: {
        "Authorization": `Bearer ${CALLE_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Balance Info:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("⚠️  Could not fetch balance via API");
      console.log("   Status:", response.status);
      
      // Try alternative endpoint
      const altResponse = await fetch("https://api.heycall-e.com/v1/account", {
        headers: {
          "Authorization": `Bearer ${CALLE_API_KEY}`,
        },
      });

      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log("\n📊 Account Info:");
        console.log(JSON.stringify(altData, null, 2));
      }
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Show usage tracking info
  console.log("\n📊 Usage Tracking:");
  console.log("   Each call costs credits from your balance");
  console.log("   Check your dashboard for current balance:");
  console.log("   https://dashboard.heycall-e.com/account/billing");
}

main().catch(console.error);
