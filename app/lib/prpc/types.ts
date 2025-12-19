export type PNodeStatus = "active" | "inactive";

export interface PNode { 
    id: string; 
    version: string; 
    lastSeen: number; 
    status: PNodeStatus;
}

export interface PNodeSummary { 
    totalKnown: number; 
    active: number; 
    inactive: number;
    networkHealth: number; 
    lastUpdated: number;
    versionDistribution: Record<string, number>;
}

export interface PNodesResponse { 
    summary: PNodeSummary; 
    pNodes: PNode[];
}