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
}

export interface PNodeSummary { 
    totalKnown: number; 
    active: number; 
    inactive: number;
    networkHealth: number; 
    lastUpdated: number;
    versionDistribution: Record<string, number>;
    countryDistribution: Record<string, number>;
}

export interface PNodesResponse { 
    summary: PNodeSummary; 
    pNodes: PNode[];
}