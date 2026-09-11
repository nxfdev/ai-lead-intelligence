/**
 * GET /api/tasks/:id — Get task details
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        _count: { select: { leads: true, events: true } },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        status: task.status,
        goal: task.goal,
        progress: task.progressJson,
        errorMessage: task.error,
        leadCount: task._count.leads,
        eventCount: task._count.events,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.status === "COMPLETED" ? task.updatedAt : null,
      },
    });
  } catch (error) {
    console.error("GET /api/tasks/:id error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
