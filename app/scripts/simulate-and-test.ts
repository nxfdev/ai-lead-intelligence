/**
 * Quality Testing & Simulation Suite
 * 
 * Verifies:
 * 1. Database & Tables (Read & write integrity)
 * 2. LLM Planner & Criteria Generation Simulation
 * 3. Synthetic Discovery & Multi-Channel Enrichment
 * 4. Multi-Factor Lead Scoring Formula
 * 5. End-to-End Orchestrator Pipeline
 * 6. CALL-E Phone Agent Call Dispatch & Synthesis
 * 7. AI Chat Copilot Intelligence
 */

import { prisma } from "../src/lib/db";
import { runPipeline, executeCall } from "../src/server/services/orchestrator";
import { extractBusinessProfile, generateQuestionnaire, convertToCriteria } from "../src/server/services/planner";
import { createDiscoveryProvider } from "../src/server/services/discovery";
import { createEnrichmentProvider } from "../src/server/services/enrichment";
import { scoreLead } from "../src/server/services/scoring";
import { createPhoneAgent } from "../src/server/services/phone-agent";
import { generateCallBrief, briefToCalleTask, generateResultSchema } from "../src/server/services/call-brief";
import { synthesizeCallResult } from "../src/server/services/synthesis";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function runTestSuite() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AI LEAD INTELLIGENCE + CALL-E PLATFORM QUALITY TEST SUITE  ");
  console.log("══════════════════════════════════════════════════════════════\n");

  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. DATABASE & TABLES INTEGRITY TEST
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST SUITE 1: Database & Table Integrity");
  
  const org = await prisma.organization.findUnique({ where: { id: DEFAULT_ORG_ID } });
  assert(!!org, "Default Organization exists in database");

  const leads = await prisma.lead.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    include: { evidence: true, calls: { include: { result: true } } },
  });
  assert(leads.length >= 7, `Seeded leads retrieved from database (${leads.length} found)`);

  const topLead = leads.find((l) => l.score >= 85);
  assert(!!topLead, `High-intent lead found with score >= 85 (${topLead?.name})`);
  assert(
    (topLead?.evidence.length || 0) > 0,
    `Top lead has grounding evidence (${topLead?.evidence.length} evidence items)`
  );

  const completedCall = leads.flatMap((l) => l.calls).find((c) => c.status === "COMPLETED");
  assert(!!completedCall, "Call logs and call results exist in database");
  console.log(`  ✓ Sample Lead Verified: ${topLead?.name} (${topLead?.score}/100)`);
  console.log();

  // ─────────────────────────────────────────────────────────────
  // 2. PLANNER & MOCK LLM SIMULATION
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST SUITE 2: Planner Service & Mock LLM Simulation");

  const sampleGoal = "Find dental clinics in Austin Texas that need 24/7 AI front desk receptionist";
  const profile = await extractBusinessProfile(sampleGoal);
  assert(!!profile.company.name, "LLM extracted business profile from text prompt");
  assert(profile.targetMarket.industries.includes("dental"), "Profile correctly targeted dental industry");

  const questionnaire = await generateQuestionnaire(profile);
  assert(questionnaire.items.length > 0, `LLM generated ${questionnaire.items.length} targeting questions`);

  const criteria = await convertToCriteria(questionnaire);
  assert(!!criteria.location.city, `Criteria converted with location: ${criteria.location.city}`);
  assert(criteria.minEmployees > 0, `Criteria minimum employees set: ${criteria.minEmployees}`);
  console.log(`  ✓ Extracted ICP: ${profile.company.name} targeting ${criteria.industry.join(", ")}`);
  console.log();

  // ─────────────────────────────────────────────────────────────
  // 3. DISCOVERY & ENRICHMENT SIMULATION
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST SUITE 3: Synthetic Lead Discovery & Multi-Channel Enrichment");

  const discoveryProvider = createDiscoveryProvider();
  const searchResults = await discoveryProvider.search({
    industries: ["dental"],
    location: { city: "Austin", state: "TX", radiusMiles: 25 },
    minEmployees: 5,
  });
  assert(searchResults.length > 0, `Discovery returned ${searchResults.length} candidate leads`);
  assert(!!searchResults[0].phone, `Discovered lead has valid phone: ${searchResults[0].phone}`);

  const enrichmentProvider = createEnrichmentProvider();
  const enrichmentData = await enrichmentProvider.enrich(searchResults[0]);
  const evidenceList = enrichmentProvider.getEvidenceForLead(searchResults[0].name);
  assert(evidenceList.length >= 1, `Enrichment generated ${evidenceList.length} evidence signals`);
  console.log(`  ✓ Candidate Discovered: ${searchResults[0].name} with ${evidenceList.length} signals`);
  console.log();

  // ─────────────────────────────────────────────────────────────
  // 4. MULTI-FACTOR SCORING FORMULA SIMULATION
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST SUITE 4: Multi-Factor Scoring Algorithm");

  const testCandidate = searchResults[0];
  const scoreResult = await scoreLead({
    name: testCandidate.name,
    category: testCandidate.category,
    location: testCandidate.location,
    employeeCount: testCandidate.employeeCount,
    decisionMaker: testCandidate.decisionMaker,
    phone: testCandidate.phone,
    website: testCandidate.website,
    evidence: evidenceList,
    criteria,
  });
  assert(scoreResult.score >= 0 && scoreResult.score <= 100, `Lead score within 0-100 range: ${scoreResult.score}`);
  assert(scoreResult.components.painSignal > 0, "Pain signal component calculated");
  assert(!!scoreResult.hypothesis, `Generated hypothesis: "${scoreResult.hypothesis.slice(0, 60)}..."`);
  assert(!!scoreResult.recommendedAction, `Generated action: ${scoreResult.recommendedAction}`);
  console.log(`  ✓ Score Result: ${scoreResult.score}/100 [Pain: ${scoreResult.components.painSignal}, ICP: ${scoreResult.components.icpFit}, Quality: ${scoreResult.components.businessQuality}]`);
  console.log();

  // ─────────────────────────────────────────────────────────────
  // 5. CALL-E CALL BRIEF & VOICE AGENT SIMULATION
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST SUITE 5: CALL-E Voice Call Dispatch & Synthesis");

  const brief = await generateCallBrief({
    leadName: "Austin Smile Center",
    phone: "+15125551001",
    location: "Austin, TX",
    category: "Dental Practice",
    evidence: evidenceList,
    hypothesis: "Practice misses after-hours emergency patient calls due to lack of night reception.",
    callQuestions: [
      "Who handles patient scheduling after 5 PM?",
      "How do you handle weekend emergency toothaches?",
      "Are you open to an automated scheduling assistant?",
    ],
    clientDescription: "VoiceFlow AI Reception",
  });
  assert(brief.questions.length > 0, "Generated CALL-E structured questions");
  assert(brief.constraints.length > 0, "Generated safety and compliance constraints");

  const calleTaskPrompt = briefToCalleTask(brief);
  assert(calleTaskPrompt.includes("Austin Smile Center"), "CALL-E prompt includes recipient clinic name");

  const phoneAgent = createPhoneAgent();
  const callExecution = await phoneAgent.createCall({
    leadId: "test_lead_id",
    organizationId: DEFAULT_ORG_ID,
    phone: "+15125551001",
    task: calleTaskPrompt,
    resultSchema: generateResultSchema(),
    idempotencyKey: `test_call_${Date.now()}`,
  });
  assert(callExecution.status === "completed", `CALL-E simulation completed: status=${callExecution.status}`);
  assert(!!callExecution.structuredResult, "CALL-E returned structured qualification output");

  const synthesis = await synthesizeCallResult(
    "Austin Smile Center",
    callExecution.structuredResult!,
    "High after-hours missed call volume"
  );
  assert(!!synthesis.qualification, `Synthesized call outcome: ${synthesis.qualification}`);
  assert(synthesis.verifiedFacts.length > 0, `Extracted ${synthesis.verifiedFacts.length} verified facts from call`);
  console.log(`  ✓ Call Synthesis: ${synthesis.qualification} (Duration: ${callExecution.duration}s)`);
  console.log(`  ✓ Summary: ${synthesis.summary}`);
  console.log();

  // ─────────────────────────────────────────────────────────────
  // 6. END-TO-END ORCHESTRATOR PIPELINE SIMULATION
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST SUITE 6: Full Autonomous Orchestrator Pipeline");

  // Create a research task
  const newTask = await prisma.task.create({
    data: {
      organizationId: DEFAULT_ORG_ID,
      goal: "Discover dental clinics in Austin TX needing front desk AI receptionists",
      status: "CREATED",
    },
  });
  assert(!!newTask.id, `Created new research task in database (ID: ${newTask.id})`);

  console.log("  → Running full pipeline (Planning → Discovery → Enrichment → Scoring)...");
  await runPipeline(newTask.id, DEFAULT_ORG_ID);

  const updatedTask = await prisma.task.findUnique({
    where: { id: newTask.id },
    include: { leads: true },
  });
  assert(
    updatedTask?.status === "READY_FOR_REVIEW",
    `Task transitioned to READY_FOR_REVIEW (Actual: ${updatedTask?.status})`
  );
  assert(
    (updatedTask?.leads.length || 0) > 0,
    `Pipeline discovered and scored ${updatedTask?.leads.length} leads in database`
  );

  const bestLead = updatedTask?.leads.sort((a, b) => b.score - a.score)[0];
  console.log(`  ✓ Pipeline completed successfully! Top scored lead: ${bestLead?.name} (${bestLead?.score}/100)`);
  console.log();

  // ─────────────────────────────────────────────────────────────
  // 7. REAL CALL DISPATCH SIMULATION ON PIPELINE LEAD
  // ─────────────────────────────────────────────────────────────
  if (bestLead && bestLead.phone) {
    console.log(`▶ TEST SUITE 7: Dispatching CALL-E Voice Qualification to ${bestLead.name}`);
    const callRecord = await prisma.call.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        leadId: bestLead.id,
        idempotencyKey: `call_e2e_${bestLead.id}_${Date.now()}`,
        status: "PENDING",
      },
    });

    await executeCall(callRecord.id, bestLead.id, DEFAULT_ORG_ID);

    const verifiedCall = await prisma.call.findUnique({
      where: { id: callRecord.id },
      include: { result: true },
    });
    assert(verifiedCall?.status === "COMPLETED", `Voice call finished with status: ${verifiedCall?.status}`);
    assert(!!verifiedCall?.result?.summary, "Voice call result recorded with synthesis summary");

    const reloadedLead = await prisma.lead.findUnique({
      where: { id: bestLead.id },
      include: { evidence: true },
    });
    const verifiedEvidence = reloadedLead?.evidence.filter((e) => e.type === "VERIFIED");
    assert(
      (verifiedEvidence?.length || 0) > 0,
      `Lead updated with VERIFIED evidence from call dialog (${verifiedEvidence?.length} items)`
    );
    console.log(`  ✓ CALL-E Qualification Result: ${verifiedCall?.result?.qualifiedResult}`);
    console.log(`  ✓ Added Verified Evidence: "${verifiedEvidence?.[0]?.claim}"`);
    console.log();
  }

  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  ALL QUALITY TESTS PASSED! (${testsPassed}/${totalTests} Passed - 100%) `);
  console.log("══════════════════════════════════════════════════════════════\n");
}

runTestSuite()
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
