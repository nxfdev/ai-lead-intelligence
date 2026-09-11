/**
 * GET /api/tasks/:id/events — Get events for a task
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const after = url.searchParams.get("after"); // cursor-based pagination

    const where: Record<string, unknown> = { taskId: id };
    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    const events = await prisma.event.findMany({
      where: where as Parameters<typeof prisma.event.findMany>[0] extends { where?: infer W } ? W : never,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: events.map((e) => ({
        id: e.id,
        type: e.type,
        data: e.data,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/tasks/:id/events error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
