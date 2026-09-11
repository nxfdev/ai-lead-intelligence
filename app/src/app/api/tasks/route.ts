/**
 * POST /api/tasks — Create a new lead research task
 * GET /api/tasks — List all tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/server/services/orchestrator";
import { z } from "zod/v4";

const CreateTaskSchema = z.object({
  goal: z.string().min(10, "Goal must be at least 10 characters"),
});

// Default org ID for MVP (no auth)
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Ensure default org exists
    await prisma.organization.upsert({
      where: { id: DEFAULT_ORG_ID },
      create: { id: DEFAULT_ORG_ID, name: "Demo Organization" },
      update: {},
    });

    // Create the task
    const task = await prisma.task.create({
      data: {
        organizationId: DEFAULT_ORG_ID,
        goal: parsed.data.goal,
        status: "CREATED",
        progressJson: {
          discovered: 0,
          enriched: 0,
          scored: 0,
          qualified: 0,
          calls: 0,
          completedCalls: 0,
          failedCalls: 0,
        },
      },
    });

    // Run the pipeline asynchronously (don't await)
    runPipeline(task.id, DEFAULT_ORG_ID).catch((err) => {
      console.error("Pipeline error:", err);
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
      },
    });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { organizationId: DEFAULT_ORG_ID },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: tasks.map((t) => ({
        id: t.id,
        status: t.status,
        goal: t.goal,
        progress: t.progressJson,
        errorMessage: t.error,
        createdAt: t.createdAt,
        completedAt: t.status === "COMPLETED" ? t.updatedAt : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
