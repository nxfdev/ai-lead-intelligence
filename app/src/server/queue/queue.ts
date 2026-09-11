/**
 * BullMQ Batch Queue Engine
 *
 * Provides enterprise batch queueing for lead discovery & enrichment tasks.
 * Connects to Redis via ioredis with graceful fallback when running in local dev.
 */

import { Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";
import type { BatchDiscoveryJobData, BatchEnrichmentJobData } from "@/lib/types";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export function getRedisConnection(): Redis | null {
  if (redisClient) return redisClient;

  try {
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) {
          isRedisAvailable = false;
          return null; // Stop retrying in local dev without Redis
        }
        return Math.min(times * 100, 1000);
      },
    });

    client.on("connect", () => {
      isRedisAvailable = true;
      console.log("[BullMQ] Redis connected successfully to", REDIS_URL);
    });

    client.on("error", (err) => {
      // Avoid log spamming if Redis server isn't up
      if (isRedisAvailable) {
        console.warn("[BullMQ] Redis connection issue:", err.message);
      }
      isRedisAvailable = false;
    });

    redisClient = client;
    return redisClient;
  } catch (err) {
    console.warn("[BullMQ] Unable to initialize Redis client:", (err as Error).message);
    return null;
  }
}

export const DISCOVERY_QUEUE_NAME = "lead-discovery-batch";
export const ENRICHMENT_QUEUE_NAME = "lead-enrichment-batch";

let discoveryQueue: Queue<BatchDiscoveryJobData> | null = null;
let enrichmentQueue: Queue<BatchEnrichmentJobData> | null = null;

export function getDiscoveryQueue(): Queue<BatchDiscoveryJobData> | null {
  const connection = getRedisConnection();
  if (!connection) return null;
  if (!discoveryQueue) {
    discoveryQueue = new Queue<BatchDiscoveryJobData>(DISCOVERY_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return discoveryQueue;
}

export function getEnrichmentQueue(): Queue<BatchEnrichmentJobData> | null {
  const connection = getRedisConnection();
  if (!connection) return null;
  if (!enrichmentQueue) {
    enrichmentQueue = new Queue<BatchEnrichmentJobData>(ENRICHMENT_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return enrichmentQueue;
}

/**
 * Enqueue a batch discovery job
 */
export async function enqueueDiscoveryBatch(data: BatchDiscoveryJobData): Promise<{
  jobId: string;
  queuedInRedis: boolean;
}> {
  const queue = getDiscoveryQueue();

  if (queue && isRedisAvailable) {
    const job = await queue.add(`batch-discover-${data.taskId}`, data, {
      jobId: `discovery-${data.taskId}-${Date.now()}`,
    });
    return { jobId: job.id as string, queuedInRedis: true };
  }

  // Fallback: Return job ID for direct in-process asynchronous runner
  return { jobId: `local-discovery-${data.taskId}`, queuedInRedis: false };
}

/**
 * Enqueue a batch enrichment job
 */
export async function enqueueEnrichmentBatch(data: BatchEnrichmentJobData): Promise<{
  jobId: string;
  queuedInRedis: boolean;
}> {
  const queue = getEnrichmentQueue();

  if (queue && isRedisAvailable) {
    const job = await queue.add(`batch-enrich-${data.taskId}`, data, {
      jobId: `enrichment-${data.taskId}-${Date.now()}`,
    });
    return { jobId: job.id as string, queuedInRedis: true };
  }

  return { jobId: `local-enrichment-${data.taskId}`, queuedInRedis: false };
}
