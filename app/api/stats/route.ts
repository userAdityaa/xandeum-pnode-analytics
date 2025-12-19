import { NextResponse } from "next/server";
import { callPRPCWithFallback } from "@/app/lib/prpc/client";

export async function GET() {
  try {
    const stats = await callPRPCWithFallback("get-stats");

    return NextResponse.json({
      metadata: stats.metadata,
      system: stats.stats,
      fileSize: stats.file_size,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
