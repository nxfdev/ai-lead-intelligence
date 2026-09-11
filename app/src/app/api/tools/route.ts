/**
 * GET /api/tools — Status of each discovery scraping tool.
 */

import { NextResponse } from "next/server";
import { getToolStatuses } from "@/server/tools/registry";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: getToolStatuses(),
    });
  } catch (error) {
    console.error("GET /api/tools error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}