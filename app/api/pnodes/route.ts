import { NextResponse } from "next/server";
import { SEEDS,  ACTIVE_THRESHOLD_SECONDS } from "@/app/lib/prpc/constants";
import { callPRPC } from "@/app/lib/prpc/client";
import { computeNodeHealth } from "@/app/lib/analytics/health";
import { PNode, PNodesResponse } from "@/app/lib/prpc/types";
import { syncStorageData, getNodeStorageData, getStorageSyncStats } from "@/app/lib/storage-sync";
import { getNodeStats, ensureNodeStatsSync } from "@/app/lib/node-stats-sync";
import prisma from "@/app/lib/prisma";

interface GeoLocation {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

async function getGeolocation(ip: string): Promise<GeoLocation> {
  // Check database cache first
  try {
    const cached = await prisma.geoLocation.findUnique({
      where: { ip },
    });
    
    if (cached) {
      return {
        country: cached.country,
        city: cached.city ?? undefined,
        latitude: cached.latitude,
        longitude: cached.longitude,
      };
    }
  } catch (error) {
    console.error('[Geolocation] Error checking cache:', error);
  }

  // Try ip-api.com first (45 req/min, no key needed)
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`, {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'success' && data.country) {
        const geo = {
          country: data.country,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon
        };
        
        // Save to database cache
        try {
          await prisma.geoLocation.create({
            data: {
              ip,
              country: data.country,
              city: data.city || null,
              latitude: data.lat,
              longitude: data.lon,
            },
          });
        } catch (error) {
          // Ignore duplicate errors
        }
        
        return geo;
      }
    }
  } catch (error) {
    // Try fallback
  }

  // Fallback to ipapi.co (1000 req/day free)
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.country_name) {
        const geo = {
          country: data.country_name,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude
        };
        
        // Save to database cache
        try {
          await prisma.geoLocation.create({
            data: {
              ip,
              country: data.country_name,
              city: data.city || null,
              latitude: data.latitude,
              longitude: data.longitude,
            },
          });
        } catch (error) {
          // Ignore duplicate errors
        }
        
        return geo;
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  return {};
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
        // Sync storage data from get-pods-with-stats
        await syncStorageData();
        
        // Ensure node stats are synced (wait for initial sync)
        await ensureNodeStatsSync();
        
        const podsResult = await fetchFromAnySeed("get-pods"); 
        const now = Math.floor(Date.now() / 1000);

        const rawNodes = podsResult.pods;

        const versionCount: Record<string, number> = {}; 
        for(const pod of rawNodes) { 
          versionCount[pod.version] = (versionCount[pod.version] ?? 0) + 1;
        }

        const latestVersion = Object.entries(versionCount).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Fetch geolocation data in parallel with increased batch size
        const batchSize = 20; // Faster API allows larger batches
        const geoData: GeoLocation[] = rawNodes.map(() => ({}));
        
        // Process all batches in parallel for maximum speed
        const allBatchPromises = [];
        for (let i = 0; i < rawNodes.length; i += batchSize) {
          const batch = rawNodes.slice(i, i + batchSize);
          const batchPromise = Promise.all(
            batch.map(async (pod: any, batchIndex: number) => {
              const ip = pod.address.split(':')[0];
              const geo = await getGeolocation(ip);
              geoData[i + batchIndex] = geo;
            })
          );
          allBatchPromises.push(batchPromise);
        }
        
        // Wait for all geolocation fetches to complete (with 10s max timeout)
        await Promise.race([
          Promise.all(allBatchPromises),
          new Promise(resolve => setTimeout(resolve, 10000))
        ]);
        
        // Fetch storage and node stats for all nodes in parallel
        const storageDataPromises = rawNodes.map((pod: any) => getNodeStorageData(pod.address));
        const nodeStatsPromises = rawNodes.map((pod: any) => getNodeStats(pod.address));
        
        const [allStorageData, allNodeStats] = await Promise.all([
          Promise.all(storageDataPromises),
          Promise.all(nodeStatsPromises)
        ]);
        
        const pNodes: PNode[] = rawNodes.map((pod: any, index: number) => { 
            const secondsAgo = now - pod.last_seen_timestamp;

            const status = secondsAgo <= ACTIVE_THRESHOLD_SECONDS ? "active" : "inactive";

            const healthScore = computeNodeHealth(
              secondsAgo, 
              pod.version, 
              latestVersion
            )

            const flags: string[] = []; 
            if(status === "inactive") flags.push("offline"); 
            if(pod.version !== latestVersion) flags.push("outdated");
            
            // Get storage data from pre-fetched results
            const storageData = allStorageData[index];
            const nodeStats = allNodeStats[index];

            return { 
                id: pod.address, 
                version: pod.version,
                lastSeen: pod.last_seen_timestamp, 
                status, 
                healthScore, 
                flags,
                ...geoData[index],
                isPublic: storageData?.is_public,
                storageCommitted: storageData?.storage_committed,
                storageUsed: storageData?.storage_used,
                storageUsagePercent: storageData?.storage_usage_percent,
                credits: storageData?.credits,
                uptimeSeconds: storageData?.uptime,
                // System metrics from individual node stats (only for public nodes)
                ramUsedBytes: nodeStats?.ramUsed,
                ramTotalBytes: nodeStats?.ramTotal,
                cpuPercent: nodeStats?.cpuPercent,
                // Network traffic stats (only for public nodes)
                packetsReceived: nodeStats?.packetsReceived,
                packetsSent: nodeStats?.packetsSent,
                activeStreams: nodeStats?.activeStreams,
            }
        });

        const active = pNodes.filter(p => p.status === "active").length; 
        const inactive = pNodes.length - active;
        
        const networkHealth = Math.round((active / pNodes.length) * 100); 

        // Calculate country distribution
        const countryCount: Record<string, number> = {};
        for (const node of pNodes) {
          if (node.country) {
            countryCount[node.country] = (countryCount[node.country] ?? 0) + 1;
          }
        }
        
        console.log('[API/pnodes] Country distribution:', {
          totalNodes: pNodes.length,
          nodesWithCountry: Object.values(countryCount).reduce((sum, c) => sum + c, 0),
          uniqueCountries: Object.keys(countryCount).length,
          countries: countryCount
        });

        // Get storage sync statistics
        const storageStats = await getStorageSyncStats();
        
        // Calculate aggregate storage used for active nodes only
        const aggregateStorageUsed = pNodes
          .filter(p => p.status === "active" && p.storageUsed)
          .reduce((sum, p) => sum + (p.storageUsed || 0), 0);
        
        // Fetch network storage total from /api/stats
        let networkStorageTotal = 0;
        try {
          const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/stats`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            networkStorageTotal = statsData.storage?.fileSizeBytes || 0;
          }
        } catch (error) {
          console.error('[API/pnodes] Failed to fetch network storage from /api/stats:', error);
        }

        const response: PNodesResponse = { 
          summary: { 
            totalKnown: podsResult.total_count, 
            active, 
            inactive, 
            networkHealth, 
            lastUpdated: now, 
            versionDistribution: versionCount,
            countryDistribution: countryCount,
            publicNodes: storageStats.publicNodes,
            privateNodes: storageStats.privateNodes,
            networkStorageTotal,
            aggregateStorageUsed,
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