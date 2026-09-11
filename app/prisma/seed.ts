import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_USER_ID = "user_admin_001";

async function main() {
  console.log("🌱 Seeding database with synthetic lead intelligence data...");

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    update: {},
    create: {
      id: DEFAULT_ORG_ID,
      name: "Acme Healthcare Intelligence",
    },
  });
  console.log(`✓ Organization: ${org.name}`);

  // 2. Organization Member
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: DEFAULT_ORG_ID,
        userId: DEFAULT_USER_ID,
      },
    },
    update: {},
    create: {
      organizationId: DEFAULT_ORG_ID,
      userId: DEFAULT_USER_ID,
      role: "owner",
    },
  });

  // 3. Business Profile
  await prisma.businessProfile.create({
    data: {
      organizationId: DEFAULT_ORG_ID,
      version: 1,
      profileJson: {
        company: {
          name: "VoiceFlow AI Reception",
          description: "Autonomous phone reception and smart patient intake for dental practices.",
          industry: "Healthcare SaaS",
        },
        services: [
          "24/7 After-Hours Phone Answering",
          "Automated Appointment Scheduling",
          "Bilingual Call Routing (English/Spanish)",
          "Missed Call Recovery SMS",
        ],
        targetMarket: {
          industries: ["Dental", "Orthodontics", "Pediatric Dentistry"],
          geography: ["Austin, TX", "Central Texas"],
          companySize: "5-30 employees",
        },
      },
    },
  });

  // 4. Lead Criteria
  await prisma.leadCriteria.create({
    data: {
      organizationId: DEFAULT_ORG_ID,
      version: 1,
      criteriaJson: {
        industry: ["Dental Clinic", "Family Dentistry", "Cosmetic Dentistry"],
        location: { city: "Austin", state: "TX", radiusMiles: 30 },
        minEmployees: 5,
        requiredSignals: [
          "Published phone number",
          "Online patient reviews mentioning wait times",
          "Single front-desk receptionist bottleneck",
        ],
      },
    },
  });

  // 5. Business Document
  await prisma.businessDocument.create({
    data: {
      organizationId: DEFAULT_ORG_ID,
      filename: "Dental_AI_Receptionist_Pitch_Deck.pdf",
      storagePath: "uploads/Dental_AI_Receptionist_Pitch_Deck.pdf",
      mimeType: "application/pdf",
      extractedText:
        "Dental practices lose an estimated $120,000 annually due to unanswered calls during lunch hours and after 5 PM. Our CALL-E voice agent handles scheduling, cancellation triage, and patient insurance inquiries with human-parity empathy.",
      fileSize: 1048576,
    },
  });

  // 6. Realistic Synthetic Leads
  const leadsData = [
    {
      name: "Austin Smile Center",
      phone: "+15125551001",
      website: "https://austinsmilecenter.example.com",
      location: "Austin, TX (Downtown)",
      category: "Cosmetic & General Dentistry",
      score: 88,
      status: "COMPLETED",
      qualification: "qualified",
      decisionMaker: "Dr. Sarah Mitchell, DDS (Owner)",
      employeeCount: 16,
      hypothesis:
        "High-volume cosmetic practice running 4 operatories. Reviews note front-desk staff frequently put callers on long hold times during peak morning hours.",
      recommendedAction: "Offer demo of after-hours and overflow triage agent to Dr. Mitchell.",
      scoreComponents: {
        painIndicators: 92,
        techReadiness: 85,
        reachability: 90,
        firmographicFit: 86,
      },
      evidence: [
        {
          type: "OBSERVED",
          claim: "Operating hours 8am-5pm Monday-Friday; closed weekends with standard voicemail box.",
          source: "Google Places / Website",
          confidence: 0.95,
        },
        {
          type: "OBSERVED",
          claim: "Multiple Google Reviews complain: 'Left message for emergency toothache at 6pm, heard back next day noon.'",
          source: "Google Reviews",
          confidence: 0.92,
        },
        {
          type: "INFERRED",
          claim: "Estimated 35+ missed patient inquiries weekly during lunch hours and evening triage.",
          source: "Call Volume Model",
          confidence: 0.82,
        },
        {
          type: "VERIFIED",
          claim: "Office Manager verified front desk is overwhelmed by reminder phone calls and scheduling requests.",
          source: "CALL-E Voice Discovery Call",
          confidence: 0.98,
        },
      ],
      call: {
        calleCallId: "calle_seed_001",
        status: "COMPLETED",
        duration: 94,
        summary:
          "Spoke with front desk manager Brenda. She confirmed they handle 90+ daily incoming calls and frequently miss new patient consult requests after 4:30 PM. Very receptive to AI after-hours intake.",
        qualification: "qualified",
      },
    },
    {
      name: "Capital City Dental Care",
      phone: "+15125551002",
      website: "https://capitalcitydental.example.com",
      location: "Austin, TX (South Congress)",
      category: "Family Dentistry",
      score: 84,
      status: "COMPLETED",
      qualification: "qualified",
      decisionMaker: "Dr. James Roberts (Managing Partner)",
      employeeCount: 22,
      hypothesis:
        "Multi-provider clinic with 3 dentists. High patient churn due to slow rescheduling workflows and lack of weekend emergency intake.",
      recommendedAction: "Demonstrate integrated calendar booking via CALL-E webhook.",
      scoreComponents: {
        painIndicators: 88,
        techReadiness: 82,
        reachability: 85,
        firmographicFit: 80,
      },
      evidence: [
        {
          type: "OBSERVED",
          claim: "No online self-scheduling portal on website; all appointments require phone confirmation.",
          source: "Website Scraping",
          confidence: 0.98,
        },
        {
          type: "OBSERVED",
          claim: "Job posting active for 'Front Desk Receptionist (Bilingual)' on Indeed.",
          source: "Indeed Job Board",
          confidence: 0.90,
        },
        {
          type: "INFERRED",
          claim: "Practice suffers staff shortage at reception leading to dropped inbound calls.",
          source: "Hiring Signal Analysis",
          confidence: 0.85,
        },
      ],
      call: {
        calleCallId: "calle_seed_002",
        status: "COMPLETED",
        duration: 82,
        summary:
          "Dr. Roberts was between patients. Receptionist noted Spanish-speaking phone support is their #1 blocker. Agreed to forward call brief to Dr. Roberts.",
        qualification: "qualified",
      },
    },
    {
      name: "Lakeway Family Dentistry",
      phone: "+15125551003",
      website: "https://lakewayfamily.example.com",
      location: "Lakeway, TX",
      category: "Family Dentistry",
      score: 76,
      status: "SCORED",
      qualification: "needs_follow_up",
      decisionMaker: "Dr. Patricia Chen (Owner)",
      employeeCount: 11,
      hypothesis:
        "Suburban family clinic with high hygiene recall rate. Receptionists spend 3 hours/day manually calling patients for 6-month checkups.",
      recommendedAction: "Pitch outbound automated recall reminders and inbound confirmation bot.",
      scoreComponents: {
        painIndicators: 75,
        techReadiness: 78,
        reachability: 74,
        firmographicFit: 77,
      },
      evidence: [
        {
          type: "OBSERVED",
          claim: "Offers pediatric, adult, and geriatric preventive care.",
          source: "Website",
          confidence: 0.95,
        },
        {
          type: "INFERRED",
          claim: "Manual recall workflows create significant administrative overhead for staff of 11.",
          source: "Practice Model",
          confidence: 0.78,
        },
      ],
    },
    {
      name: "Round Rock Modern Smiles",
      phone: "+15125551004",
      website: "https://roundrockdental.example.com",
      location: "Round Rock, TX",
      category: "Orthodontics & Implants",
      score: 72,
      status: "SCORED",
      qualification: "needs_follow_up",
      decisionMaker: "Mark Johnson (Clinic Director)",
      employeeCount: 19,
      hypothesis:
        "High-ticket implant consultations require immediate qualification before scheduling 45-minute surgeon consultation.",
      recommendedAction: "Position CALL-E as lead pre-qualification agent for dental implant inquiries.",
      scoreComponents: {
        painIndicators: 70,
        techReadiness: 75,
        reachability: 72,
        firmographicFit: 71,
      },
      evidence: [
        {
          type: "OBSERVED",
          claim: "Specializes in high-margin All-on-4 dental implants ($15k-$30k cases).",
          source: "Website Services Page",
          confidence: 0.99,
        },
      ],
    },
    {
      name: "Barton Springs Dental Group",
      phone: "+15125551005",
      website: "https://bartonspringsdental.example.com",
      location: "Austin, TX (Zilker)",
      category: "Cosmetic Dentistry",
      score: 64,
      status: "SCORED",
      qualification: "pending",
      decisionMaker: "Dr. Emily Taylor (Owner)",
      employeeCount: 8,
      hypothesis:
        "Boutique practice with modern aesthetic. Currently using basic Web chat widget but no after-hours phone intelligence.",
      recommendedAction: "Call to explore integration with their existing Weave phone system.",
      scoreComponents: {
        painIndicators: 60,
        techReadiness: 72,
        reachability: 65,
        firmographicFit: 59,
      },
      evidence: [
        {
          type: "OBSERVED",
          claim: "Uses Weave software for appointment reminders.",
          source: "Tech Stack Footprint",
          confidence: 0.88,
        },
      ],
    },
    {
      name: "North Austin Pediatric Dental",
      phone: "+15125551006",
      website: "https://northaustinpediatric.example.com",
      location: "Austin, TX (Domain)",
      category: "Pediatric Dentistry",
      score: 58,
      status: "SCORED",
      qualification: "pending",
      decisionMaker: "Dr. Kenneth Liu (Pediatric Specialist)",
      employeeCount: 14,
      hypothesis:
        "Parents frequently call outside 9-5 hours (evenings and weekends) for tooth trauma or appointment questions.",
      recommendedAction: "Demonstrate pediatric triage protocol via CALL-E.",
      scoreComponents: {
        painIndicators: 55,
        techReadiness: 62,
        reachability: 60,
        firmographicFit: 55,
      },
      evidence: [
        {
          type: "OBSERVED",
          claim: "Focuses exclusively on children age 1 to 18.",
          source: "State Registry",
          confidence: 0.95,
        },
      ],
    },
    {
      name: "Lone Star Emergency Dentistry",
      phone: "+15125551007",
      website: "https://lonestaremergency.example.com",
      location: "Austin, TX (North Loop)",
      category: "Emergency Dental",
      score: 91,
      status: "COMPLETED",
      qualification: "qualified",
      decisionMaker: "Dr. Marcus Vance (Founder)",
      employeeCount: 10,
      hypothesis:
        "24-hour emergency practice loses 40% of nighttime calls because staff are occupied in emergency procedures.",
      recommendedAction: "Urgent deployment of CALL-E immediate dispatch triage.",
      scoreComponents: {
        painIndicators: 98,
        techReadiness: 88,
        reachability: 92,
        firmographicFit: 86,
      },
      evidence: [
        {
          type: "OBSERVED",
          claim: "Advertises 'Open 24/7 for urgent tooth pain'.",
          source: "Website & Google Maps",
          confidence: 1.0,
        },
        {
          type: "VERIFIED",
          claim: "Dr. Vance stated: 'When I am in a root canal at 11 PM, no one can answer the phone. We need an automated voice receptionist immediately.'",
          source: "CALL-E Qualification Call",
          confidence: 0.99,
        },
      ],
      call: {
        calleCallId: "calle_seed_003",
        status: "COMPLETED",
        duration: 110,
        summary:
          "Dr. Marcus Vance personally answered between patients. Strongly enthusiastic about instant emergency call answering. Requested immediate contract & onboarding.",
        qualification: "qualified",
      },
    },
  ];

  for (const item of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        name: item.name,
        phone: item.phone,
        website: item.website,
        location: item.location,
        category: item.category,
        score: item.score,
        status: item.status,
        qualification: item.qualification,
        decisionMaker: item.decisionMaker,
        employeeCount: item.employeeCount,
        hypothesis: item.hypothesis,
        recommendedAction: item.recommendedAction,
        scoreComponents: item.scoreComponents,
      },
    });

    // Create evidence items
    for (const ev of item.evidence) {
      await prisma.evidence.create({
        data: {
          leadId: lead.id,
          type: ev.type,
          claim: ev.claim,
          source: ev.source,
          confidence: ev.confidence,
        },
      });
    }

    // Create call records if present
    if (item.call) {
      const call = await prisma.call.create({
        data: {
          organizationId: DEFAULT_ORG_ID,
          leadId: lead.id,
          calleCallId: item.call.calleCallId,
          idempotencyKey: `call_${lead.id}_seed`,
          status: item.call.status,
          duration: item.call.duration,
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(),
        },
      });

      await prisma.callResult.create({
        data: {
          callId: call.id,
          summary: item.call.summary,
          qualifiedResult: item.call.qualification,
          confidence: 0.92,
          structuredResult: {
            qualified: item.call.qualification === "qualified",
            interestLevel: "high",
            currentSolution: "human receptionist",
            painPointConfirmed: true,
          },
        },
      });
    }

    console.log(`✓ Lead: ${lead.name} (Score: ${lead.score})`);
  }

  console.log("✅ Synthetic seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
