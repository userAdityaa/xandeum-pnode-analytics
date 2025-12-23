import axios from "axios";
import { callPRPCWithFallback } from "./prpc/client";

export interface NodeStats {
  address: string;
  cpuPercent?: number;
  ramUsed?: number;
  ramTotal?: number;
  activeStreams?: number;
  packetsReceived?: number;
  packetsSent?: number;
  lastFetched: number;
}

interface GetStatsResponse {
  cpu_percent?: number;
  ram_used?: number;
  ram_total?: number;
  active_streams?: number;
  packets_received?: number;
  packets_sent?: number;
  uptime?: number;
}

interface PodData {
  address: string;
  is_public: boolean;
  rpc_port: number;
  pubkey: string;
}

interface PodsWithStatsResponse {
  pods: PodData[];
}

// In-memory cache for node stats
let statsCache: Map<string, NodeStats> = new Map();
let isSyncing: boolean = false;
let hasInitialSync: boolean = false;

/**
 * Fetch stats from a single public node
 */
async function fetchNodeStats(ip: string, port: number): Promise<GetStatsResponse | null> {
  try {
    const response = await axios.post(`http://${ip}:${port}/rpc`, {
      jsonrpc: '2.0',
      method: 'get-stats',
      id: 1
    }, {
      timeout: 3000, // 3 second timeout per node
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data?.result || null;
  } catch (error) {
    // Silently fail for individual nodes
    return null;
  }
}

/**
 * Sync stats from all public nodes
 */
export async function syncNodeStats(): Promise<void> {
  if (isSyncing) {
    console.log('[NodeStatsSync] Sync already in progress, skipping...');
    return;
  }

  try {
    isSyncing = true;
    const now = Math.floor(Date.now() / 1000);
    
    // Fetch public nodes directly from get-pods-with-stats endpoint
    const result = await callPRPCWithFallback<PodsWithStatsResponse>("get-pods-with-stats");
    
    if (!result || !result.pods) {
      hasInitialSync = true;
      return;
    }
    
    const publicNodes = result.pods.filter(pod => pod.is_public);
    
    if (publicNodes.length === 0) {
      hasInitialSync = true;
      return;
    }
    
    // Fetch stats from all public nodes in parallel
    const fetchPromises = publicNodes.map(async (node) => {
      const [ip, portStr] = node.address.split(':');
      const port = node.rpc_port || 6000; // Use rpc_port from API or default to 6000
      
      const stats = await fetchNodeStats(ip, port);
      
      if (stats) {
        statsCache.set(node.address, {
          address: node.address,
          cpuPercent: stats.cpu_percent,
          ramUsed: stats.ram_used,
          ramTotal: stats.ram_total,
          activeStreams: stats.active_streams,
          packetsReceived: stats.packets_received,
          packetsSent: stats.packets_sent,
          lastFetched: now
        });
      }
    });
    
    await Promise.all(fetchPromises);
    
    hasInitialSync = true;
    
  } catch (error: any) {
    console.error('[NodeStatsSync] Failed to sync node stats:', error.message);
  } finally {
    isSyncing = false;
  }
}

/**
 * Ensure initial sync is complete (wait if not done yet)
 */
export async function ensureNodeStatsSync(): Promise<void> {
  if (hasInitialSync) {
    return; // Already synced
  }
  
  if (isSyncing) {
    // Wait for ongoing sync to complete (max 30 seconds)
    const startTime = Date.now();
    while (isSyncing && (Date.now() - startTime) < 30000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }
  
  // Trigger sync and wait
  await syncNodeStats();
}

/**
 * Get cached stats for a specific node
 */
export function getNodeStats(address: string): NodeStats | undefined {
  return statsCache.get(address);
}

/**
 * Get all cached node stats
 */
export function getAllNodeStats(): NodeStats[] {
  return Array.from(statsCache.values());
}

/**
 * Initialize node stats sync
 */
export function initNodeStatsSync(): void {
  // Trigger initial sync after a delay to let storage sync complete first
  setTimeout(() => {
    syncNodeStats().catch(err => {
      console.error('[NodeStatsSync] Initial sync failed:', err);
    });
  }, 5000); // 5 second delay
  
  // Set up periodic sync every 60 seconds
  setInterval(() => {
    syncNodeStats().catch(err => {
      console.error('[NodeStatsSync] Periodic sync failed:', err);
    });
  }, 60000);
}
