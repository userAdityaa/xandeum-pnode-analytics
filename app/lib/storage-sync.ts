import { callPRPCWithFallback } from "./prpc/client";

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
}

interface PodsWithStatsResponse {
  pods: PodStorageData[];
}

// In-memory cache for pod storage data
let storageCache: Map<string, PodStorageData> = new Map();
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

    // Clear old cache and update with fresh data
    storageCache.clear();
    
    for (const pod of result.pods) {
      storageCache.set(pod.address, pod);
    }
    
    lastSyncTimestamp = Math.floor(Date.now() / 1000);
    console.log(`[StorageSync] Synced ${storageCache.size} pods with storage data`);
    
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
export function getNodeStorageData(address: string): PodStorageData | undefined {
  return storageCache.get(address);
}

/**
 * Get all cached storage data
 */
export function getAllStorageData(): PodStorageData[] {
  return Array.from(storageCache.values());
}

/**
 * Get storage sync statistics
 */
export function getStorageSyncStats() {
  const allData = getAllStorageData();
  
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
    cacheSize: storageCache.size,
  };
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
