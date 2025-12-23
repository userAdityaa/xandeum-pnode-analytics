import { NextResponse } from "next/server";
import { SEEDS,  ACTIVE_THRESHOLD_SECONDS } from "@/app/lib/prpc/constants";
import { callPRPC } from "@/app/lib/prpc/client";
import { computeNodeHealth } from "@/app/lib/analytics/health";
import { PNode, PNodesResponse } from "@/app/lib/prpc/types";
import { syncStorageData, getNodeStorageData, getStorageSyncStats } from "@/app/lib/storage-sync";

interface GeoLocation {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// Cache for IP geolocation to avoid excessive API calls
const geoCache = new Map<string, GeoLocation>();

async function getGeolocation(ip: string): Promise<GeoLocation> {
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  try {
    // Using ip-api.com free tier (45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`, {
      signal: AbortSignal.timeout(3000) // Increased timeout to 3 seconds
    });
    
    if (!response.ok) {
      throw new Error('Geolocation API failed');
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const geo = {
        country: data.country,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon
      };
      geoCache.set(ip, geo);
      return geo;
    }
  } catch (error) {
    // Silently fail for geolocation - it's not critical
    // Suppress all errors (timeouts, connection resets, rate limits, etc.)
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
        

        
        const podsResult = await fetchFromAnySeed("get-pods"); 
        const now = Math.floor(Date.now() / 1000);

        const rawNodes = podsResult.pods;

        const versionCount: Record<string, number> = {}; 
        for(const pod of rawNodes) { 
          versionCount[pod.version] = (versionCount[pod.version] ?? 0) + 1;
        }

        const latestVersion = Object.entries(versionCount).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Fetch geolocation data only (stats come from cache)
        const batchSize = 10;
        const geoData: GeoLocation[] = new Array(rawNodes.length).fill({});
        
        // Process in batches to avoid overwhelming the API
        const fetchWithTimeout = async () => {
          for (let i = 0; i < rawNodes.length; i += batchSize) {
            const batch = rawNodes.slice(i, i + batchSize);
            const batchPromises = batch.map(async (pod: any, batchIndex: number) => {
              const ip = pod.address.split(':')[0];
              const geo = await getGeolocation(ip);
              geoData[i + batchIndex] = geo;
            });
            await Promise.all(batchPromises);
          }
        };
        
        // Race between fetching data and a 3-second timeout
        await Promise.race([
          fetchWithTimeout(),
          new Promise(resolve => setTimeout(resolve, 3000))
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

            // Get cached stats from background sync
            // const cachedStats = getNodeStats(pod.address);
            // const hasRealData = cachedStats?.hasRealData || false;
            
            // Get storage data from storage sync
            const storageData = getNodeStorageData(pod.address);

            return { 
                id: pod.address, 
                version: pod.version,
                lastSeen: pod.last_seen_timestamp, 
                status, 
                healthScore, 
                flags,
                ...geoData[index],
                // fileSizeBytes: cachedStats?.fileSizeBytes,
                // totalBytes: cachedStats?.totalBytes,
                // ramUsedBytes: cachedStats?.ramUsedBytes,
                // ramTotalBytes: cachedStats?.ramTotalBytes,
                // cpuPercent: cachedStats?.cpuPercent,
                // uptimeSeconds: cachedStats?.uptimeSeconds,
                // hasRealData
                // Storage data
                isPublic: storageData?.is_public,
                storageCommitted: storageData?.storage_committed,
                storageUsed: storageData?.storage_used,
                storageUsagePercent: storageData?.storage_usage_percent,
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

        // Get storage sync statistics
        const storageStats = getStorageSyncStats();
        
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

        // Get sync statistics
        // const syncStats = getSyncStats();
        // console.log('[API] Sync stats:', JSON.stringify(syncStats, null, 2));

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
            // syncStats
          }, 
          pNodes,
        };
        
        // console.log('[API] Response syncStats:', JSON.stringify(response.summary.syncStats));

        return NextResponse.json(response);
    } catch (error: any) { 
        return NextResponse.json ( 
            { error: error.message ?? "Failed to fetch pNodes" }, 
            { status: 500 }
        )
    }
}