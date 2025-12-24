import { callPRPCWithFallback } from "./prpc/client";
import prisma from './prisma';

// Pod storage data structure from get-pods-with-stats
export interface PodStorageData {
  address: string;
  is_public: boolean;
  last_seen_timestamp: number;
  pubkey: string;
  rpc_port: number;
  storage_committed: number;
  storage_usage_percent: number;
  storage_used: number;
  uptime: number;
  version: string;
  credits?: number; // Credits from podcredits API
}

interface PodsWithStatsResponse {
  pods: PodStorageData[];
}

interface PodCredit {
  pod_id: string;
  credits: number;
}

interface PodsCreditsResponse {
  pods_credits: PodCredit[];
}

let lastSyncTimestamp: number = 0;
let isSyncing: boolean = false;

/**
 * Fetch and sync storage data from get-pods-with-stats
 */
export async function syncStorageData(): Promise<void> {
  if (isSyncing) {
    console.log('[StorageSync] Sync already in progress, skipping...');
    return;
  }

  try {
    isSyncing = true;
    console.log('[StorageSync] Starting storage data sync...');
    
    const result = await callPRPCWithFallback<PodsWithStatsResponse>("get-pods-with-stats");
    
    if (!result || !result.pods) {
      throw new Error("Invalid response from get-pods-with-stats");
    }

    // Fetch credits data
    let creditsMap = new Map<string, number>();
    try {
      const creditsResponse = await fetch('https://podcredits.xandeum.network/api/pods-credits');
      const creditsData: PodsCreditsResponse = await creditsResponse.json();
      
      for (const credit of creditsData.pods_credits) {
        creditsMap.set(credit.pod_id, credit.credits);
      }
      console.log(`[StorageSync] Fetched credits for ${creditsMap.size} pods`);
    } catch (error: any) {
      console.error('[StorageSync] Failed to fetch credits:', error.message);
    }

    // Upsert all pods to database
    for (const pod of result.pods) {
      await prisma.podStorage.upsert({
        where: { address: pod.address },
        update: {
          isPublic: pod.is_public,
          lastSeenTimestamp: BigInt(pod.last_seen_timestamp),
          pubkey: pod.pubkey,
          rpcPort: pod.rpc_port,
          storageCommitted: BigInt(pod.storage_committed),
          storageUsagePercent: pod.storage_usage_percent,
          storageUsed: BigInt(pod.storage_used),
          uptime: BigInt(pod.uptime),
          version: pod.version,
          credits: creditsMap.get(pod.pubkey) || 0,
        },
        create: {
          address: pod.address,
          isPublic: pod.is_public,
          lastSeenTimestamp: BigInt(pod.last_seen_timestamp),
          pubkey: pod.pubkey,
          rpcPort: pod.rpc_port,
          storageCommitted: BigInt(pod.storage_committed),
          storageUsagePercent: pod.storage_usage_percent,
          storageUsed: BigInt(pod.storage_used),
          uptime: BigInt(pod.uptime),
          version: pod.version,
          credits: creditsMap.get(pod.pubkey) || 0,
        },
      });
    }
    
    lastSyncTimestamp = Math.floor(Date.now() / 1000);
    const count = await prisma.podStorage.count();
    console.log(`[StorageSync] Synced ${count} pods with storage data`);
    
  } catch (error: any) {
    console.error('[StorageSync] Failed to sync storage data:', error.message);
    throw error;
  } finally {
    isSyncing = false;
  }
}

/**
 * Get storage data for a specific node
 */
export async function getNodeStorageData(address: string): Promise<PodStorageData | undefined> {
  try {
    const pod = await prisma.podStorage.findUnique({
      where: { address },
    });
    
    if (!pod) return undefined;
    
    return {
      address: pod.address,
      is_public: pod.isPublic,
      last_seen_timestamp: Number(pod.lastSeenTimestamp),
      pubkey: pod.pubkey,
      rpc_port: pod.rpcPort,
      storage_committed: Number(pod.storageCommitted),
      storage_usage_percent: pod.storageUsagePercent,
      storage_used: Number(pod.storageUsed),
      uptime: Number(pod.uptime),
      version: pod.version,
      credits: pod.credits,
    };
  } catch (error) {
    console.error('[StorageSync] Error getting node storage data:', error);
    return undefined;
  }
}

/**
 * Get all cached storage data
 */
export async function getAllStorageData(): Promise<PodStorageData[]> {
  try {
    const pods = await prisma.podStorage.findMany();
    
    return pods.map(pod => ({
      address: pod.address,
      is_public: pod.isPublic,
      last_seen_timestamp: Number(pod.lastSeenTimestamp),
      pubkey: pod.pubkey,
      rpc_port: pod.rpcPort,
      storage_committed: Number(pod.storageCommitted),
      storage_usage_percent: pod.storageUsagePercent,
      storage_used: Number(pod.storageUsed),
      uptime: Number(pod.uptime),
      version: pod.version,
      credits: pod.credits,
    }));
  } catch (error) {
    console.error('[StorageSync] Error getting all storage data:', error);
    return [];
  }
}

/**
 * Get storage sync statistics
 */
export async function getStorageSyncStats() {
  try {
    const allData = await getAllStorageData();
    
    const publicNodes = allData.filter(pod => pod.is_public).length;
    const privateNodes = allData.length - publicNodes;
    
    const totalStorageUsed = allData.reduce((sum, pod) => sum + pod.storage_used, 0);
    const totalStorageCommitted = allData.reduce((sum, pod) => sum + pod.storage_committed, 0);
    
    return {
      totalNodes: allData.length,
      publicNodes,
      privateNodes,
      totalStorageUsed,
      totalStorageCommitted,
      lastSyncTimestamp,
      cacheSize: allData.length,
    };
  } catch (error) {
    console.error('[StorageSync] Error getting storage sync stats:', error);
    return {
      totalNodes: 0,
      publicNodes: 0,
      privateNodes: 0,
      totalStorageUsed: 0,
      totalStorageCommitted: 0,
      lastSyncTimestamp,
      cacheSize: 0,
    };
  }
}

/**
 * Initialize storage sync (call this once on app start)
 */
export function initStorageSync(): void {
  // Trigger initial sync
  syncStorageData().catch(err => {
    console.error('[StorageSync] Initial sync failed:', err);
  });
  
  // Set up periodic sync every 30 seconds
  setInterval(() => {
    syncStorageData().catch(err => {
      console.error('[StorageSync] Periodic sync failed:', err);
    });
  }, 30000);
}
