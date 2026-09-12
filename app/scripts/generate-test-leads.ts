/**
 * Generate Test Leads
 * 
 * Creates realistic test leads for demonstration purposes.
 * Used when API keys are not available for real scraping.
 * 
 * Usage: npx tsx scripts/generate-test-leads.ts "dental clinics" 20
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

// Test data for generating realistic leads
const BUSINESS_TYPES = {
  'dental clinic': {
    names: [
      'Bright Smile Dental', 'Austin Dental Care', 'Pflugerville Family Dentistry',
      'Round Rock Dental Studio', 'Lakeway Dental Arts', 'Cedar Park Smiles',
      'Georgetown Dental Clinic', 'San Marcos Family Dentistry', 'Kyle Dental Care',
      'Buda Dental Studio', 'Leander Dental Arts', 'Liberty Hill Family Dentistry',
      'Dripping Springs Dental', 'Bee Cave Dental Care', 'Westlake Dental Studio',
      'East Austin Dental', 'North Austin Family Dentistry', 'South Austin Dental Care',
      'Central Austin Dental', 'Downtown Dental Clinic',
    ],
    categories: ['Dental Clinic', 'Family Dentistry', 'Cosmetic Dentistry', 'Orthodontics'],
    decisionMakers: [
      'Dr. Sarah Chen', 'Dr. Michael Rodriguez', 'Dr. Emily Watson',
      'Dr. James Wilson', 'Dr. Maria Garcia', 'Dr. David Kim',
      'Dr. Jennifer Lee', 'Dr. Robert Taylor', 'Dr. Amanda Johnson',
      'Dr. Christopher Brown', 'Dr. Jessica Martinez', 'Dr. Andrew Davis',
    ],
  },
  'restaurant': {
    names: [
      'Austin Grill', 'Texas BBQ House', 'Lone Star Cafe', 'Capital City Bistro',
      'Hill Country Kitchen', 'South Congress Bistro', 'Rainey Street Grill',
      'East Austin Eats', 'North Loop Diner', 'South Lamar Kitchen',
      'Zilker Park Cafe', 'Mueller Family Restaurant', 'Bouldin Creek Cafe',
      'Clarksville Eats', 'Hyde Park Grill', 'Tarrytown Kitchen',
      'Barton Springs Bistro', 'Lady Bird Cafe', 'Congress Avenue Grill',
      '6th Street Diner',
    ],
    categories: ['Restaurant', 'Cafe', 'Bistro', 'Grill', 'Family Restaurant'],
    decisionMakers: [
      'John Smith', 'Maria Garcia', 'David Johnson', 'Sarah Wilson',
      'Michael Brown', 'Jennifer Davis', 'Robert Martinez', 'Amanda Taylor',
      'Christopher Lee', 'Jessica Anderson', 'Andrew Thomas', 'Emily Jackson',
    ],
  },
  'real estate': {
    names: [
      'Austin Home Realty', 'Texas Property Group', 'Lone Star Real Estate',
      'Capital City Homes', 'Hill Country Properties', 'South Austin Realty',
      'North Austin Homes', 'East Austin Properties', 'West Austin Realty',
      'Downtown Condo Group', 'Lake Travis Properties', 'Barton Creek Realty',
      'Zilker Neighborhood Homes', 'Mueller Real Estate', 'Hyde Park Properties',
      'Clarksville Homes', 'Tarrytown Real Estate', 'Westlake Hills Realty',
      'Rollingwood Properties', 'Westlake Properties',
    ],
    categories: ['Real Estate Agency', 'Property Management', 'Real Estate Brokerage'],
    decisionMakers: [
      'John Smith', 'Maria Garcia', 'David Johnson', 'Sarah Wilson',
      'Michael Brown', 'Jennifer Davis', 'Robert Martinez', 'Amanda Taylor',
      'Christopher Lee', 'Jessica Anderson', 'Andrew Thomas', 'Emily Jackson',
    ],
  },
};

// US phone area codes for Texas
const AREA_CODES = ['512', '737', '512', '737', '512', '737', '512', '737'];

// Austin area locations
const LOCATIONS = [
  'Austin, TX', 'Pflugerville, TX', 'Round Rock, TX', 'Cedar Park, TX',
  'Georgetown, TX', 'San Marcos, TX', 'Kyle, TX', 'Buda, TX',
  'Leander, TX', 'Liberty Hill, TX', 'Dripping Springs, TX', 'Bee Cave, TX',
  'Lakeway, TX', 'Westlake Hills, TX', 'Rollingwood, TX',
];

// Generate a random US phone number
function generatePhone(): string {
  const areaCode = AREA_CODES[Math.floor(Math.random() * AREA_CODES.length)];
  const prefix = Math.floor(200 + Math.random() * 800);
  const lineNum = Math.floor(1000 + Math.random() * 9000);
  return `+1${areaCode}${prefix}${lineNum}`;
}

// Generate a random email
function generateEmail(name: string, business: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  const cleanBusiness = business.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanName}@${domain}`;
}

// Generate a random website
function generateWebsite(business: string): string {
  const cleanBusiness = business.toLowerCase().replace(/[^a-z]/g, '');
  return `https://www.${cleanBusiness}.com`;
}

async function main() {
  console.log("🏗️  Generating Test Leads\n");
  
  // Parse arguments
  const businessType = process.argv[2] || 'dental clinic';
  const count = parseInt(process.argv[3] || '20');
  
  console.log(`   Business Type: ${businessType}`);
  console.log(`   Count: ${count}`);
  
  // Ensure organization exists
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    create: { id: DEFAULT_ORG_ID, name: "Default Org" },
    update: {},
  });
  
  // Get business type data
  const typeData = BUSINESS_TYPES[businessType as keyof typeof BUSINESS_TYPES] || BUSINESS_TYPES['dental clinic'];
  
  const leads = [];
  
  for (let i = 0; i < count; i++) {
    const name = typeData.names[i % typeData.names.length];
    const category = typeData.categories[Math.floor(Math.random() * typeData.categories.length)];
    const decisionMaker = typeData.decisionMakers[Math.floor(Math.random() * typeData.decisionMakers.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const phone = generatePhone();
    const email = generateEmail(decisionMaker, name);
    const website = generateWebsite(name);
    
    // Randomly choose discovery platform
    const platforms = ['google', 'yelp', 'linkedin', 'facebook', 'instagram', 'x'];
    const discoveredFrom = platforms[Math.floor(Math.random() * platforms.length)];
    
    leads.push({
      name,
      phone,
      email,
      website,
      location,
      category,
      businessType: businessType,
      discoveredFrom,
      discoveredUrl: `https://www.${discoveredFrom}.com/search?q=${encodeURIComponent(name)}`,
      decisionMaker,
      socialProfiles: {
        [discoveredFrom]: `https://www.${discoveredFrom}.com/${name.toLowerCase().replace(/[^a-z]/g, '')}`,
      },
    });
  }
  
  // Store leads in database
  let storedCount = 0;
  
  for (const lead of leads) {
    try {
      await prisma.lead.create({
        data: {
          organizationId: DEFAULT_ORG_ID,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          location: lead.location,
          category: lead.category,
          businessType: lead.businessType,
          discoveredFrom: lead.discoveredFrom,
          discoveredUrl: lead.discoveredUrl,
          decisionMaker: lead.decisionMaker,
          socialProfiles: lead.socialProfiles,
          status: 'DISCOVERED',
          qualification: 'PENDING',
        },
      });
      storedCount++;
    } catch (error) {
      console.error(`Error storing lead ${lead.name}:`, error);
    }
  }
  
  console.log(`\n✅ Generated ${storedCount} test leads`);
  
  // Show summary
  console.log("\n📊 Summary:");
  console.log(`   Total Leads: ${storedCount}`);
  console.log(`   With Phone: ${storedCount}`);
  
  // Group by platform
  const byPlatform = leads.reduce((acc, lead) => {
    acc[lead.discoveredFrom] = (acc[lead.discoveredFrom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("\n   By Platform:");
  Object.entries(byPlatform).forEach(([platform, count]) => {
    console.log(`     ${platform}: ${count}`);
  });
  
  // Show sample leads
  console.log("\n📞 Sample Leads:");
  leads.slice(0, 5).forEach((lead, i) => {
    console.log(`\n   ${i + 1}. ${lead.name}`);
    console.log(`      📱 Phone: ${lead.phone}`);
    console.log(`      📧 Email: ${lead.email}`);
    console.log(`      🌐 Website: ${lead.website}`);
    console.log(`      📍 Location: ${lead.location}`);
    console.log(`      👤 Decision Maker: ${lead.decisionMaker}`);
    console.log(`      🔍 Source: ${lead.discoveredFrom}`);
  });
  
  console.log("\n💡 Next steps:");
  console.log("   1. View leads: npx prisma studio");
  console.log("   2. Run CALL-E pipeline: npx tsx scripts/calle-pipeline.ts");
  
  await prisma.$disconnect();
}

main().catch(console.error);
