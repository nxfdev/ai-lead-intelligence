/**
 * CALL-E Usage Tracker
 * 
 * Tracks CALL-E API usage and provides balance information.
 * Stores usage in a JSON file to persist across runs.
 * 
 * Usage: 
 *   npx tsx scripts/usage-tracker.ts check     - Check current usage
 *   npx tsx scripts/usage-tracker.ts log <id>   - Log a call
 *   npx tsx scripts/usage-tracker.ts reset      - Reset usage
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

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
  console.log(`✅ Logged call: ${callId}`);
  console.log(`   Total calls made: ${usage.totalCalls}`);
}

function checkUsage(): void {
  const usage = getUsage();
  
  console.log("📊 CALL-E Usage Report");
  console.log("=" .repeat(50));
  
  console.log(`\n📞 Total Calls Made: ${usage.totalCalls}`);
  console.log(`📅 Last Updated: ${usage.lastUpdated}`);
  
  if (usage.calls.length > 0) {
    console.log("\n📝 Recent Calls:");
    const recentCalls = usage.calls.slice(-10); // Last 10 calls
    recentCalls.forEach((call, i) => {
      console.log(`   ${i + 1}. ${call.leadName} (${call.phone}) - ${call.status}`);
      console.log(`      Time: ${call.timestamp}`);
    });
  }
  
  console.log("\n💡 To check your balance, visit:");
  console.log("   https://dashboard.heycall-e.com/account/billing");
}

function resetUsage(): void {
  const usage: UsageData = {
    totalCalls: 0,
    calls: [],
    lastUpdated: new Date().toISOString(),
  };
  saveUsage(usage);
  console.log("✅ Usage counter reset to 0");
}

// Main
const command = process.argv[2];

switch (command) {
  case "check":
    checkUsage();
    break;
  case "log":
    const callId = process.argv[3] || `call_${Date.now()}`;
    const leadName = process.argv[4] || "Unknown";
    const phone = process.argv[5] || "Unknown";
    const status = process.argv[6] || "completed";
    logCall(callId, leadName, phone, status);
    break;
  case "reset":
    resetUsage();
    break;
  default:
    console.log("Usage:");
    console.log("  npx tsx scripts/usage-tracker.ts check     - Check current usage");
    console.log("  npx tsx scripts/usage-tracker.ts log <id>  - Log a call");
    console.log("  npx tsx scripts/usage-tracker.ts reset     - Reset usage");
}
