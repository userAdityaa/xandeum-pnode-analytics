import { NextResponse } from "next/server";
import { SEEDS } from "@/app/lib/prpc/constants";
import { callPRPC } from "@/app/lib/prpc/client";

// Helper to fetch pods from any seed
async function fetchPods() {
  for (const seed of SEEDS) {
    try {
      const result = await callPRPC(seed, "get-pods");
      return result.pods;
    } catch (err) {
      // Try next seed
    }
  }
  throw new Error("All pNode seeds unreachable");
}

export async function GET() {
  try {
    const pods = await fetchPods();
    const versionCount: Record<string, number> = {};
    for (const pod of pods) {
      versionCount[pod.version] = (versionCount[pod.version] ?? 0) + 1;
    }
    return NextResponse.json({ versionDistribution: versionCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to fetch version distribution" }, { status: 500 });
  }
}
