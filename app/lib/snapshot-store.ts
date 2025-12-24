import prisma from './prisma'

export interface Snapshot {
  timestamp: number
  networkHealth: number
  activeNodes: number
  totalNodes: number
  riskScore: number
  riskLevel: string
  outdatedNodes: number
  outdatedPercentage: number
}

class SnapshotStore {
  private readonly maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in ms

  async addSnapshot(snapshot: Snapshot): Promise<void> {
    try {
      await prisma.snapshot.create({
        data: {
          timestamp: BigInt(snapshot.timestamp),
          networkHealth: snapshot.networkHealth,
          activeNodes: snapshot.activeNodes,
          totalNodes: snapshot.totalNodes,
          riskScore: snapshot.riskScore,
          riskLevel: snapshot.riskLevel,
          outdatedNodes: snapshot.outdatedNodes,
          outdatedPercentage: snapshot.outdatedPercentage,
        },
      })
      await this.cleanup()
      const count = await this.getCount()
      console.log(`[SnapshotStore] Added snapshot. Total: ${count}`)
    } catch (error) {
      console.error('[SnapshotStore] Error adding snapshot:', error)
    }
  }

  async getSnapshots(): Promise<Snapshot[]> {
    try {
      await this.cleanup()
      const snapshots = await prisma.snapshot.findMany({
        orderBy: { timestamp: 'asc' },
      })
      return snapshots.map(s => ({
        timestamp: Number(s.timestamp),
        networkHealth: s.networkHealth,
        activeNodes: s.activeNodes,
        totalNodes: s.totalNodes,
        riskScore: s.riskScore,
        riskLevel: s.riskLevel,
        outdatedNodes: s.outdatedNodes,
        outdatedPercentage: s.outdatedPercentage,
      }))
    } catch (error) {
      return []
    }
  }

  async getSnapshotsInRange(startTime: number, endTime: number): Promise<Snapshot[]> {
    try {
      await this.cleanup()
      const snapshots = await prisma.snapshot.findMany({
        where: {
          timestamp: {
            gte: BigInt(startTime),
            lte: BigInt(endTime),
          },
        },
        orderBy: { timestamp: 'asc' },
      })
      return snapshots.map(s => ({
        timestamp: Number(s.timestamp),
        networkHealth: s.networkHealth,
        activeNodes: s.activeNodes,
        totalNodes: s.totalNodes,
        riskScore: s.riskScore,
        riskLevel: s.riskLevel,
        outdatedNodes: s.outdatedNodes,
        outdatedPercentage: s.outdatedPercentage,
      }))
    } catch (error) {
      console.error('[SnapshotStore] Error getting snapshots in range:', error)
      return []
    }
  }

  private async cleanup(): Promise<void> {
    try {
      const cutoff = Date.now() - this.maxAge
      await prisma.snapshot.deleteMany({
        where: {
          timestamp: {
            lt: BigInt(cutoff),
          },
        },
      })
    } catch (error) {
      console.error('[SnapshotStore] Error during cleanup:', error)
    }
  }

  async getCount(): Promise<number> {
    try {
      await this.cleanup()
      return await prisma.snapshot.count()
    } catch (error) {
      console.error('[SnapshotStore] Error getting count:', error)
      return 0
    }
  }
}

// Use globalThis to ensure singleton across Next.js API routes
const globalForSnapshot = globalThis as unknown as {
  snapshotStore: SnapshotStore | undefined
}

const snapshotStore = globalForSnapshot.snapshotStore ?? new SnapshotStore()

if (process.env.NODE_ENV !== 'production') {
  globalForSnapshot.snapshotStore = snapshotStore
}

export default snapshotStore
