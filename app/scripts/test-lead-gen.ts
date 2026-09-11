/**
 * Test Lead Generation Pipeline
 * 
 * Tests the lead generation system with sample queries.
 * 
 * Usage: npx tsx scripts/test-lead-gen.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { LeadGenerationOrchestrator, LeadGenerationConfig } from "../src/server/services/scraper/lead-orchestrator";

const prisma = new PrismaClient();
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  console.log("🧪 Testing Lead Generation Pipeline\n");
  
  // Ensure organization exists
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    create: { id: DEFAULT_ORG_ID, name: "Default Org" },
    update: {},
  });
  
  // Test configuration
  const config: LeadGenerationConfig = {
    query: "dental clinic",
    location: "Austin, TX",
    category: "healthcare",
    platforms: ['google'], // Start with just Google for testing
    maxResults: 10,
    requirePhone: true,
  };
  
  console.log("📋 Test Configuration:");
  console.log(`   Query: ${config.query}`);
  console.log(`   Location: ${config.location}`);
  console.log(`   Platforms: ${config.platforms.join(', ')}`);
  console.log(`   Max Results: ${config.maxResults}`);
  console.log(`   Require Phone: ${config.requirePhone}`);
  
  console.log("\n🚀 Starting lead generation...");
  
  const orchestrator = new LeadGenerationOrchestrator();
  
  try {
    const result = await orchestrator.generateLeads(config);
    
    console.log("\n📊 Results:");
    console.log(`   Total Found: ${result.totalFound}`);
    console.log(`   With Phone: ${result.leadsWithPhone}`);
    console.log(`   Stored: ${result.leadsStored}`);
    
    if (result.leads.length > 0) {
      console.log("\n📞 Sample Leads:");
      result.leads.slice(0, 5).forEach((lead, i) => {
        console.log(`\n   ${i + 1}. ${lead.name}`);
        console.log(`      Phone: ${lead.phone || 'N/A'}`);
        console.log(`      Source: ${lead.discoveredFrom}`);
        console.log(`      Location: ${lead.location || 'N/A'}`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log("\n⚠️  Errors:");
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log("\n✅ Test completed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
