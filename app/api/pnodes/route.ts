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

        const pNodes: PNode[] = podsResult.pods.map((pod: any) => { 
            const secondsAgo = now - pod.last_seen_timestamp;

            return { 
                id: pod.address, 
                version: pod.version,
                lastSeen: pod.last_seen_timestamp, 
                status: 
                secondsAgo <= ACTIVE_THRESHOLD_SECONDS ? "active" : "inactive",
            }
        });

        const active = pNodes.filter(p => p.status === "active").length; 
        const inactive = pNodes.length - active;
        
        const response: PNodesResponse = { 
          summary: { 
            totalKnown: podsResult.total_count, 
            active, 
            inactive, 
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