/**
 * Lead Generation Pipeline Script
 * 
 * Scrapes leads from multiple platforms and stores them in the database.
 * All leads MUST have valid phone numbers for CALL-E.
 * 
 * Usage: npx tsx scripts/lead-generation.ts "dental clinics" "Austin, TX" "dental"
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { LeadGenerationOrchestrator, LeadGenerationConfig } from "../src/server/services/scraper/lead-orchestrator";

const prisma = new PrismaClient();
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

// Parse command line arguments
const query = process.argv[2] || "AI receptionist service";
const location = process.argv[3] || "Austin, TX";
const category = process.argv[4] || "dental clinic";

async function main() {
  console.log("🚀 LEAD GENERATION PIPELINE");
  console.log("=" .repeat(80));
  
  console.log("\n📋 Configuration:");
  console.log(`   Product Query: ${query}`);
  console.log(`   Location: ${location}`);
  console.log(`   Target Category: ${category}`);
  console.log(`   Platforms: Google, Yelp, LinkedIn, Facebook, Instagram, X`);
  console.log(`   Requirement: MUST have phone number`);
  
  // Ensure organization exists
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    create: { id: DEFAULT_ORG_ID, name: "Default Org" },
    update: {},
  });
  
  // Configure lead generation
  const config: LeadGenerationConfig = {
    query,
    location,
    category,
    platforms: ['google', 'yelp', 'social'],
    maxResults: 100,
    requirePhone: true,
  };
  
  // Run lead generation
  const orchestrator = new LeadGenerationOrchestrator();
  const result = await orchestrator.generateLeads(config);
  
  // Display results
  console.log("\n" + "=" .repeat(80));
  console.log("📊 LEAD GENERATION RESULTS");
  console.log("=" .repeat(80));
  
  console.log("\n📈 Statistics:");
  console.log(`   Total Found: ${result.totalFound}`);
  console.log(`   With Phone: ${result.leadsWithPhone}`);
  console.log(`   Stored in DB: ${result.leadsStored}`);
  
  if (result.errors.length > 0) {
    console.log("\n⚠️  Errors:");
    result.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Show sample leads
  if (result.leads.length > 0) {
    console.log("\n📞 Sample Leads (with phone numbers):");
    console.log("-".repeat(80));
    
    const sampleLeads = result.leads.filter(l => l.phone).slice(0, 10);
    
    for (const lead of sampleLeads) {
      console.log(`\n   📌 ${lead.name}`);
      console.log(`      📱 Phone: ${lead.phone}`);
      if (lead.email) console.log(`      📧 Email: ${lead.email}`);
      if (lead.website) console.log(`      🌐 Website: ${lead.website}`);
      if (lead.location) console.log(`      📍 Location: ${lead.location}`);
      console.log(`      🔍 Source: ${lead.discoveredFrom}`);
      if (lead.socialProfiles) {
        const platforms = Object.keys(lead.socialProfiles);
        console.log(`      📱 Social: ${platforms.join(', ')}`);
      }
    }
  }
  
  // Get overall stats
  console.log("\n" + "-".repeat(80));
  console.log("📊 Database Statistics:");
  
  const stats = await orchestrator.getLeadStats();
  console.log(`   Total Leads: ${stats.total}`);
  console.log(`   With Phone: ${stats.withPhone}`);
  console.log(`   Without Phone: ${stats.withPhone}`);
  
  if (stats.byPlatform.length > 0) {
    console.log("\n   By Platform:");
    stats.byPlatform.forEach((p: any) => {
      console.log(`     ${p.platform}: ${p.count}`);
    });
  }
  
  console.log("\n✅ Lead generation pipeline complete!");
  console.log("\n💡 Next steps:");
  console.log("   1. Review leads in database: npx prisma studio");
  console.log("   2. Run CALL-E pipeline: npx tsx scripts/calle-pipeline.ts");
  console.log("   3. Call leads with: CALL_MODE=live");
  
  await prisma.$disconnect();
}

main().catch(console.error);
