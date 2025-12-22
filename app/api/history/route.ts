import { NextResponse } from "next/server"
import snapshotStore, { Snapshot } from "@/app/lib/snapshot-store"

interface TrendData {
  timestamp: string
  networkHealth: number
  activeNodes: number
  riskScore: number
  versionDrift: number
}

function generateMockDataPoint(date: Date): TrendData {
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  
  // Simulate realistic trends
  const baseHealth = 75 + Math.sin(date.getTime() / 10000000) * 10 + Math.random() * 5
  const baseNodes = 180 + Math.sin(date.getTime() / 8000000) * 20 + Math.random() * 10
  const baseRisk = 100 - baseHealth + Math.random() * 10
  const baseDrift = 15 + Math.sin(date.getTime() / 12000000) * 8 + Math.random() * 5
  
  return {
    timestamp: `${month} ${day} ${hour}:${minute.toString().padStart(2, '0')}`,
    networkHealth: Math.round(baseHealth),
    activeNodes: Math.round(baseNodes),
    riskScore: Math.round(baseRisk),
    versionDrift: Math.round(baseDrift)
  }
}

function formatTimestamp(date: Date, range: string): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  
  if (range === "1h") {
    return `${hour}:${minute.toString().padStart(2, '0')}`
  } else if (range === "24h") {
    return `${hour}:00`
  } else {
    return `${month} ${day}`
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '1h'
    
    const allSnapshots = snapshotStore.getSnapshots()
    const now = new Date()
    
    console.log('Total snapshots in store:', allSnapshots.length)
    if (allSnapshots.length > 0) {
      const latest = allSnapshots[allSnapshots.length - 1]
      console.log('Latest snapshot:', {
        timestamp: new Date(latest.timestamp).toISOString(),
        networkHealth: latest.networkHealth,
        activeNodes: latest.activeNodes
      })
    }
    
    let timeWindow: number
    let intervalMs: number
    let pointsToShow: number
    
    // Configure based on range
    if (range === "1h") {
      timeWindow = 60 * 60 * 1000 // 1 hour in ms
      intervalMs = 2 * 60 * 1000 // 2 minute intervals
      pointsToShow = 30
    } else if (range === "24h") {
      timeWindow = 24 * 60 * 60 * 1000 // 24 hours in ms
      intervalMs = 60 * 60 * 1000 // 1 hour intervals
      pointsToShow = 24
    } else {
      timeWindow = 30 * 24 * 60 * 60 * 1000 // 30 days in ms
      intervalMs = 24 * 60 * 60 * 1000 // 1 day intervals
      pointsToShow = 30
    }
    
    const startTime = now.getTime() - timeWindow
    
    // Filter snapshots within time window
    const relevantSnapshots = allSnapshots.filter(s => s.timestamp >= startTime)
    
    console.log('Relevant snapshots for range:', relevantSnapshots.length)
    
    // Get the absolute latest snapshot for current time
    const latestSnapshot = allSnapshots.length > 0 ? allSnapshots[allSnapshots.length - 1] : null
    
    // Group snapshots by time bucket
    const buckets = new Map<number, Snapshot[]>()
    
    relevantSnapshots.forEach(snapshot => {
      const bucketKey = Math.floor(snapshot.timestamp / intervalMs) * intervalMs
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, [])
      }
      buckets.get(bucketKey)!.push(snapshot)
    })
    
    console.log('Buckets created:', buckets.size)
    
    // Generate data points
    const trendData: TrendData[] = []
    let realDataCount = 0
    
    for (let i = pointsToShow - 1; i >= 0; i--) {
      const pointTime = now.getTime() - (i * intervalMs)
      const bucketKey = Math.floor(pointTime / intervalMs) * intervalMs
      const date = new Date(pointTime)
      const isLastPoint = i === 0
      
      const bucketSnapshots = buckets.get(bucketKey)
      
      if (bucketSnapshots && bucketSnapshots.length > 0) {
        // Use real data - average of all snapshots in bucket
        realDataCount++
        const avg = bucketSnapshots.reduce(
          (acc, s) => ({
            networkHealth: acc.networkHealth + s.networkHealth,
            activeNodes: acc.activeNodes + s.activeNodes,
            riskScore: acc.riskScore + s.riskScore,
            versionDrift: acc.versionDrift + s.outdatedPercentage
          }),
          { networkHealth: 0, activeNodes: 0, riskScore: 0, versionDrift: 0 }
        )
        
        trendData.push({
          timestamp: formatTimestamp(date, range),
          networkHealth: Math.round(avg.networkHealth / bucketSnapshots.length),
          activeNodes: Math.round(avg.activeNodes / bucketSnapshots.length),
          riskScore: Math.round(avg.riskScore / bucketSnapshots.length),
          versionDrift: Math.round(avg.versionDrift / bucketSnapshots.length)
        })
      } else if (isLastPoint && latestSnapshot) {
        // For the current/most recent point, always use the latest real snapshot if available
        realDataCount++
        trendData.push({
          timestamp: formatTimestamp(date, range),
          networkHealth: latestSnapshot.networkHealth,
          activeNodes: latestSnapshot.activeNodes,
          riskScore: latestSnapshot.riskScore,
          versionDrift: latestSnapshot.outdatedPercentage
        })
      } else {
        // Use mock data for missing buckets in the past
        const mockPoint = generateMockDataPoint(date)
        mockPoint.timestamp = formatTimestamp(date, range)
        trendData.push(mockPoint)
      }
    }
    
    console.log('History API response:', {
      range,
      realDataPoints: realDataCount,
      totalPoints: pointsToShow,
      latestDataPoint: trendData[trendData.length - 1]
    })
    
    return NextResponse.json({
      data: trendData,
      realDataPoints: realDataCount,
      totalPoints: pointsToShow,
      hasRealData: realDataCount > 0,
      range
    })
  } catch (error: any) {
    console.error("Failed to fetch historical data:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to fetch historical data" },
      { status: 500 }
    )
  }
}
