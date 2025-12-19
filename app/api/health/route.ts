import { NextResponse } from "next/server";
import { callPRPCWithFallback } from "@/app/lib/prpc/client";

export async function GET() {
  const start = Date.now();

  try {
    const versionResult = await callPRPCWithFallback("get-version");

    return NextResponse.json({
      status: "ok",
      network: "xandeum-pnode",
      version: versionResult.version,
      latencyMs: Date.now() - start,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "down",
        network: "xandeum-pnode",
        error: error.message ?? "Network unreachable",
        timestamp: Math.floor(Date.now() / 1000),
      },
      { status: 503 }
    );
  }
}
