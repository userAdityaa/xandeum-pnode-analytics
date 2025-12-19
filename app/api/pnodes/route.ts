import { NextResponse } from "next/server";
import { SEEDS,  ACTIVE_THRESHOLD_SECONDS } from "@/app/lib/prpc/constants";
import { callPRPC } from "@/app/lib/prpc/client";
import { PNode, PNodesResponse } from "@/app/lib/prpc/types";

async function fetchFromAnySeed(method: string) { 
  for (const seed of SEEDS) { 
    try { 
      return await callPRPC(seed, method); 
    } catch (err) { 
      console.error(`Seed failed: ${seed}`, err);
    }
  }
  throw new Error("All pNode seeds unreachable");
}

export async function GET() { 
    try { 
        const podsResult = await fetchFromAnySeed("get-pods"); 
        const now = Math.floor(Date.now() / 1000);

        const rawNodes = podsResult.pods;

        const versionCount: Record<string, number> = {}; 
        for(const pod of rawNodes) { 
          versionCount[pod.version] = (versionCount[pod.version] ?? 0) + 1;
        }

        const latestVersion = Object.entries(versionCount).sort((a, b) => b[1] - a[1])[0]?.[0];

        const pNodes: PNode[] = rawNodes.map((pod: any) => { 
            const secondsAgo = now - pod.last_seen_timestamp;

            const status = secondsAgo <= ACTIVE_THRESHOLD_SECONDS ? "active" : "inactive";

            const healthScore = status === "active" ? 100: 30;

            const flags: string[] = []; 
            if(status === "inactive") flags.push("offline"); 
            if(pod.version !== latestVersion) flags.push("outdated");

            return { 
                id: pod.address, 
                version: pod.version,
                lastSeen: pod.last_seen_timestamp, 
                status, 
                healthScore, 
                flags,
            }
        });

        const active = pNodes.filter(p => p.status === "active").length; 
        const inactive = pNodes.length - active;
        
        const networkHealth = Math.round((active / pNodes.length) * 100); 

        const response: PNodesResponse = { 
          summary: { 
            totalKnown: podsResult.total_count, 
            active, 
            inactive, 
            networkHealth, 
            lastUpdated: now, 
            versionDistribution: versionCount,
          }, 
          pNodes,
        };

        return NextResponse.json(response);
    } catch (error: any) { 
        return NextResponse.json ( 
            { error: error.message ?? "Failed to fetch pNodes" }, 
            { status: 500 }
        )
    }
}