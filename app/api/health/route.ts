import { NextResponse } from "next/server";
import { callPRPCWithFallback } from "@/app/lib/prpc/client";
import { ACTIVE_THRESHOLD_SECONDS } from "@/app/lib/prpc/constants";

export async function GET() {
const start = Date.now();
const now = Math.floor(Date.now() / 1000);

try {
  const versionResult = await callPRPCWithFallback("get-version");
  const podsResult = await callPRPCWithFallback("get-pods");

  const nodes = podsResult.pods;
  const totalNodes = nodes.length;

  const activeNodes = nodes.filter(
    (n: any) => 
      now - n.last_seen_timestamp <= ACTIVE_THRESHOLD_SECONDS
  ).length;

  const inactiveNodes = totalNodes - activeNodes;

  const networkHealth = totalNodes === 0
   ? 0
   : Math.round((activeNodes / totalNodes) * 100);

   const versionCount: Record<string, number> = {};
    for (const n of nodes) {
      versionCount[n.version] = (versionCount[n.version] ?? 0) + 1;
    }

  const majorityVersion = Object.entries(versionCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const outdatedNodes = nodes.filter(
    (n: any) => n.version !== majorityVersion
  ).length;

  return NextResponse.json({
      status: "ok",
      network: "xandeum-pnode",
      backend: {
        rpcReachable: true,
        latencyMs: Date.now() - start,
      },
      networkSummary: {
        totalNodes,
        activeNodes,
        inactiveNodes,
        networkHealth,
      },
      version: {
        local: versionResult.version,
        majority: majorityVersion,
        outdatedNodes,
      },
      timestamp: now,
  });
} catch (error: any) {
  return NextResponse.json(
      {
        status: "down",
        network: "xandeum-pnode",
        backend: {
          rpcReachable: false,
        },
        error: error.message ?? "Network unreachable",
        timestamp: now,
      },
      { status: 503 }
    );
}
}
