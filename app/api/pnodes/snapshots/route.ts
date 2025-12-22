import { NextResponse } from "next/server"
import snapshotStore, { Snapshot } from "@/app/lib/snapshot-store"

export async function POST() {
  try {
    // Fetch current data from health and risk endpoints
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    
    const [healthRes, riskRes] = await Promise.all([
      fetch(`${baseUrl}/api/health`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/network/risk`, { cache: 'no-store' })
    ])

    if (!healthRes.ok || !riskRes.ok) {
      throw new Error("Failed to fetch data from endpoints")
    }

    const healthData = await healthRes.json()
    const riskData = await riskRes.json()

    // Create snapshot with exact current data
    const snapshot: Snapshot = {
      timestamp: Date.now(),
      networkHealth: healthData.networkSummary?.networkHealth || 0,
      activeNodes: healthData.networkSummary?.activeNodes || 0,
      totalNodes: healthData.networkSummary?.totalNodes || 0,
      riskScore: riskData.risk?.score || 0,
      riskLevel: riskData.risk?.level || "unknown",
      outdatedNodes: healthData.version?.outdatedNodes || 0,
      outdatedPercentage: healthData.networkSummary?.totalNodes > 0
        ? Math.round((healthData.version?.outdatedNodes / healthData.networkSummary?.totalNodes) * 100)
        : 0
    }

    // Add to in-memory store
    snapshotStore.addSnapshot(snapshot)

    console.log('Snapshot collected:', {
      networkHealth: snapshot.networkHealth,
      activeNodes: snapshot.activeNodes,
      riskScore: snapshot.riskScore,
      versionDrift: snapshot.outdatedPercentage,
      totalSnapshots: snapshotStore.getCount()
    })

    return NextResponse.json({ 
      success: true, 
      snapshot,
      totalSnapshots: snapshotStore.getCount() 
    })
  } catch (error: any) {
    console.error("Failed to collect snapshot:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to collect snapshot" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const snapshots = snapshotStore.getSnapshots()
    return NextResponse.json({ 
      snapshots,
      count: snapshots.length 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to read snapshots" },
      { status: 500 }
    )
  }
}
