import { NextResponse } from "next/server";
import axios from 'axios';

const SEEDS = [
  "173.212.220.65",
  "161.97.97.41",
  "192.190.136.36",
  "192.190.136.38",
];

const RPC_TIMEOUT_MS = 4000; 
const ACTIVE_TRESHOLD_SECONDS = 60;

async function callPRPC(seed: string, method: string) { 
    const controller = new AbortController(); 
    const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

    try { 
        const res = await axios.post(
            `http://${seed}:6000/rpc`,
            {
                jsonrpc: "2.0",
                id: 1,
                method,
            },
            {
                timeout: RPC_TIMEOUT_MS,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("what is the response: ", res);

        return res.data.result;
    } finally { 
        clearTimeout(timeout);
    }
}

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
                secondsAgo <= ACTIVE_TRESHOLD_SECONDS ? "active" : "inactive",
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