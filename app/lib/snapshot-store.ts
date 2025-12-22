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
  private snapshots: Snapshot[] = []
  private readonly maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in ms

  addSnapshot(snapshot: Snapshot) {
    this.snapshots.push(snapshot)
    console.log(`[SnapshotStore] Added snapshot. Total: ${this.snapshots.length}`)
    this.cleanup()
  }

  getSnapshots(): Snapshot[] {
    this.cleanup()
    console.log(`[SnapshotStore] Getting snapshots. Total: ${this.snapshots.length}`)
    return [...this.snapshots]
  }

  getSnapshotsInRange(startTime: number, endTime: number): Snapshot[] {
    this.cleanup()
    return this.snapshots.filter(s => s.timestamp >= startTime && s.timestamp <= endTime)
  }

  private cleanup() {
    const cutoff = Date.now() - this.maxAge
    this.snapshots = this.snapshots.filter(s => s.timestamp > cutoff)
  }

  getCount(): number {
    this.cleanup()
    return this.snapshots.length
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
