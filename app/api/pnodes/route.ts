import { NextResponse } from "next/server";
import { SEEDS,  ACTIVE_THRESHOLD_SECONDS } from "@/app/lib/prpc/constants";
import { callPRPC } from "@/app/lib/prpc/client";

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

        const pNodes = podsResult.pods.map((pod: any) => { 
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

        return NextResponse.json({ 
            summary: { 
                totalKnown: podsResult.total_count, 
                active, 
                inactive,
            }, 
            pNodes
        });
    } catch (error: any) { 
        return NextResponse.json ( 
            { error: error.message ?? "Failed to fetch pNodes" }, 
            { status: 500 }
        )
    }
}