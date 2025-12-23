export type PNodeStatus = "active" | "inactive";

export interface PNode { 
    id: string; 
    version: string; 
    lastSeen: number; 
    status: PNodeStatus;
    healthScore: number;
    flags: string[];
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    // Extended stats from sync worker
    fileSizeBytes?: number;
    totalBytes?: number;
    ramUsedBytes?: number;
    ramTotalBytes?: number;
    cpuPercent?: number;
    uptimeSeconds?: number;
    hasRealData?: boolean; // True if real data, false if mock
    isPublic?: boolean; // True if node is responding
    // Storage stats from get-pods-with-stats
    storageCommitted?: number;
    storageUsed?: number;
    storageUsagePercent?: number;
}

export interface PNodeSummary { 
    totalKnown: number; 
    active: number; 
    inactive: number;
    networkHealth: number; 
    lastUpdated: number;
    versionDistribution: Record<string, number>;
    countryDistribution: Record<string, number>;
    // Storage statistics
    publicNodes?: number;
    privateNodes?: number;
    networkStorageTotal?: number; // Total storage from /api/stats
    aggregateStorageUsed?: number; // Sum of storage_used from active nodes
    // Sync statistics
    syncStats?: {
        totalNodes: number;
        publicNodes: number;
        privateNodes: number;
        nodesWithRealData: number;
        nodesWithMockData: number;
        lastSyncTimestamp: number;
        cacheSize: number;
    };
}

export interface PNodesResponse { 
    summary: PNodeSummary; 
    pNodes: PNode[];
}