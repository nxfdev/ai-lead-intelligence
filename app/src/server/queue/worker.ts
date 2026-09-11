/**
 * BullMQ Batch Worker Engine
 *
 * Processes discovery and enrichment batch jobs.
 * Emits real-time progress events and persists leads directly to Prisma DB.
 */

import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { BatchDiscoveryJobData, BatchEnrichmentJobData, RawLead } from "@/lib/types";
import {
  DISCOVERY_QUEUE_NAME,
  ENRICHMENT_QUEUE_NAME,
  getRedisConnection,
} from "./queue";
import { ToolRegistryDiscoveryProvider } from "../tools/registry";
import { enrichLeadWithScout } from "../tools/scout-enricher";
import { scoreLead } from "../services/scoring";
import { broadcastEvent } from "../services/event-bus";
import { jitterDelay } from "../tools/lib";

/**
 * Execute discovery batch processing
 */
export async function executeDiscoveryBatch(data: BatchDiscoveryJobData): Promise<number> {
  const { taskId, organizationId, criteria, strategy } = data;

  const discoveryProvider = new ToolRegistryDiscoveryProvider();
  const rawLeads: RawLead[] = await discoveryProvider.search(criteria, strategy);

  let createdCount = 0;
  for (const raw of rawLeads) {
    try {
      const lead = await prisma.lead.create({
        data: {
          organizationId,
          taskId,
          name: raw.name,
          phone: raw.phone,
          website: raw.website,
          location: raw.location,
          category: raw.category,
          status: "DISCOVERED",
          qualification: "PENDING",
          decisionMaker: raw.decisionMaker,
          employeeCount: raw.employeeCount,
          profileJson: {
            source: raw.source,
            sourceId: raw.sourceId,
            ...(raw.metadata || {}),
          } as Prisma.InputJsonValue,
        },
      });

      createdCount++;

      broadcastEvent({
        type: "lead.discovered",
        organizationId,
        taskId,
        leadId: lead.id,
        data: { name: lead.name, category: lead.category, phone: lead.phone },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[Worker] Failed to save lead ${raw.name}:`, (err as Error).message);
    }
  }

  // Update task progress in DB
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  const currentProgress = (task?.progressJson as Record<string, unknown>) || {};
  await prisma.task.update({
    where: { id: taskId },
    data: {
      progressJson: {
        ...currentProgress,
        discovered: createdCount,
      } as Prisma.InputJsonValue,
    },
  });

  return createdCount;
}

/**
 * Execute Scout enrichment batch processing
 */
export async function executeEnrichmentBatch(data: BatchEnrichmentJobData): Promise<number> {
  const { taskId, organizationId, leadIds } = data;

  const leads = await prisma.lead.findMany({
    where: {
      taskId,
      organizationId,
      ...(leadIds && leadIds.length > 0 ? { id: { in: leadIds } } : {}),
    },
    include: { evidence: true },
  });

  let enrichedCount = 0;

  for (const lead of leads) {
    try {
      await jitterDelay(300, 800);

      // Run Scout multi-platform & SMTP enrichment
      const scoutData = await enrichLeadWithScout({
        name: lead.name,
        website: lead.website,
        phone: lead.phone,
        location: lead.location,
        decisionMaker: lead.decisionMaker,
      });

      const currentProfile = (lead.profileJson as Record<string, unknown>) || {};
      const updatedProfile = {
        ...currentProfile,
        emails: scoutData.emails,
        verifiedEmail: scoutData.verifiedEmail,
        socialProfiles: scoutData.socialProfiles,
        description: scoutData.description || currentProfile.description,
      };

      // Create evidence items for discovered facts
      const evidenceToCreate: Array<{
        type: string;
        claim: string;
        source: string;
        sourceReference?: string;
        confidence: number;
      }> = [];

      if (scoutData.verifiedEmail) {
        evidenceToCreate.push({
          type: scoutData.verifiedEmail.status === "verified" ? "VERIFIED" : "OBSERVED",
          claim: `Email ${scoutData.verifiedEmail.email} checked via SMTP: ${scoutData.verifiedEmail.status.toUpperCase()}`,
          source: "smtp_verifier",
          sourceReference: scoutData.verifiedEmail.mxHost,
          confidence: scoutData.verifiedEmail.status === "verified" ? 0.98 : 0.65,
        });
      }

      if (scoutData.socialProfiles.length > 0) {
        const platforms = scoutData.socialProfiles.map((s) => s.platform).join(", ");
        evidenceToCreate.push({
          type: "OBSERVED",
          claim: `Active social media profiles identified: ${platforms}`,
          source: "scout_social_finder",
          confidence: 0.90,
        });
      }

      if (scoutData.decisionMaker && !lead.decisionMaker) {
        evidenceToCreate.push({
          type: "OBSERVED",
          claim: `Decision maker identified: ${scoutData.decisionMaker}`,
          source: "scout_leadership_analyzer",
          confidence: 0.88,
        });
      }

      // Persist evidence items to DB
      for (const ev of evidenceToCreate) {
        await prisma.evidence.create({
          data: {
            leadId: lead.id,
            type: ev.type,
            claim: ev.claim,
            source: ev.source,
            sourceReference: ev.sourceReference,
            confidence: ev.confidence,
          },
        });
      }

      // Update lead record
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          website: lead.website || (scoutData.domain ? `https://${scoutData.domain}` : undefined),
          phone: lead.phone || scoutData.phones[0] || undefined,
          decisionMaker: scoutData.decisionMaker || lead.decisionMaker,
          profileJson: updatedProfile as unknown as Prisma.InputJsonValue,
          status: "ENRICHED",
        },
      });

      // Score the enriched lead
      try {
        const criteriaRecord = await prisma.leadCriteria.findFirst({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
        });

        if (criteriaRecord) {
          const freshLead = await prisma.lead.findUnique({
            where: { id: lead.id },
            include: { evidence: true },
          });

          if (freshLead) {
            const rawCriteria = (criteriaRecord.criteriaJson as any) || { industry: [] };
            const score = await scoreLead({
              name: freshLead.name,
              category: freshLead.category || undefined,
              location: freshLead.location || undefined,
              employeeCount: freshLead.employeeCount || undefined,
              decisionMaker: freshLead.decisionMaker || undefined,
              phone: freshLead.phone || undefined,
              website: freshLead.website || undefined,
              evidence: freshLead.evidence.map((e) => ({
                type: (e.type as "OBSERVED" | "INFERRED" | "VERIFIED") || "OBSERVED",
                claim: e.claim,
                source: e.source,
                sourceReference: e.sourceReference || undefined,
                observedAt: e.observedAt.toISOString(),
                confidence: e.confidence ?? 0.8,
              })),
              criteria: {
                industry: rawCriteria.industry || [],
                minEmployees: rawCriteria.minEmployees,
                maxEmployees: rawCriteria.maxEmployees,
                requiredSignals: rawCriteria.requiredSignals,
              },
            });

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                score: score.score,
                scoreComponents: score.components as unknown as Prisma.InputJsonValue,
                hypothesis: score.hypothesis,
                recommendedAction: score.recommendedAction,
                status: "SCORED",
                qualification: score.score >= 60 ? "QUALIFIED" : "DISQUALIFIED",
              },
            });
          }
        }
      } catch (scoreErr) {
        console.warn(`[Worker] Failed scoring lead ${lead.name}:`, (scoreErr as Error).message);
      }

      enrichedCount++;

      broadcastEvent({
        type: "lead.enriched",
        organizationId,
        taskId,
        leadId: lead.id,
        data: {
          name: lead.name,
          verifiedEmail: scoutData.verifiedEmail?.email,
          socialsCount: scoutData.socialProfiles.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[Worker] Failed to enrich lead ${lead.name}:`, (err as Error).message);
    }
  }

  // Update task progress in DB
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  const currentProgress = (task?.progressJson as Record<string, unknown>) || {};
  await prisma.task.update({
    where: { id: taskId },
    data: {
      progressJson: {
        ...currentProgress,
        enriched: enrichedCount,
      } as Prisma.InputJsonValue,
    },
  });

  return enrichedCount;
}

/**
 * Start background BullMQ workers if Redis is available
 */
export function initBullMQWorkers(): {
  discoveryWorker: Worker | null;
  enrichmentWorker: Worker | null;
} {
  const connection = getRedisConnection();
  if (!connection) {
    return { discoveryWorker: null, enrichmentWorker: null };
  }

  try {
    const discoveryWorker = new Worker<BatchDiscoveryJobData>(
      DISCOVERY_QUEUE_NAME,
      async (job: Job<BatchDiscoveryJobData>) => {
        return executeDiscoveryBatch(job.data);
      },
      { connection, concurrency: 2 }
    );

    const enrichmentWorker = new Worker<BatchEnrichmentJobData>(
      ENRICHMENT_QUEUE_NAME,
      async (job: Job<BatchEnrichmentJobData>) => {
        return executeEnrichmentBatch(job.data);
      },
      { connection, concurrency: 3 }
    );

    return { discoveryWorker, enrichmentWorker };
  } catch (err) {
    console.warn("[BullMQ] Failed initializing workers:", (err as Error).message);
    return { discoveryWorker: null, enrichmentWorker: null };
  }
}
