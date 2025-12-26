import { NextResponse } from "next/server";
import { SEEDS } from "@/app/lib/prpc/constants";
import { callPRPC } from "@/app/lib/prpc/client";

// Helper to fetch from any seed
async function fetchFromAnySeed(method: string) {
  for (const seed of SEEDS) {
    try {
      return await callPRPC(seed, method);
    } catch (err) {
      // Try next seed
    }
  }
  throw new Error("All seeds unreachable");
}

export async function GET() {
  try {
    // Get network stats from /api/stats
    let networkStorageTotal = 0;
    try {
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        networkStorageTotal = statsData.storage?.fileSizeBytes || 0;
      }
    } catch (error) {
      // error handling
    }

    // Get pods with stats
    const podsResult = await fetchFromAnySeed("get-pods-with-stats");
    const pods = podsResult.pods || [];

    let publicNodes = 0;
    let privateNodes = 0;
    let aggregateStorageUsed = 0;

    pods.forEach((pod: any) => {
      if (pod.is_public) publicNodes++;
      else privateNodes++;
      if (pod.storage_used) aggregateStorageUsed += pod.storage_used;
    });

    return NextResponse.json({
      publicNodes,
      privateNodes,
      networkStorageTotal,
      aggregateStorageUsed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to fetch storage overview" }, { status: 500 });
  }
}
