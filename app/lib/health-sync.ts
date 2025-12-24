import snapshotStore, { Snapshot } from './snapshot-store'

interface HealthSyncConfig {
  interval: number // milliseconds
  enabled: boolean
}

class HealthSyncService {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private syncCount = 0
  private lastSyncTime: number | null = null
  private config: HealthSyncConfig = {
    interval: 2 * 60 * 1000, // Default: 2 minutes
    enabled: true,
  }

  constructor() {
    // Auto-start in non-production environments or when explicitly enabled
    if (process.env.HEALTH_SYNC_ENABLED === 'true') {
      this.start()
    }
  }

  /**
   * Start the health sync service
   */
  start(interval?: number): void {
    if (this.isRunning) {
      console.log('[HealthSync] Service already running')
      return
    }

    if (interval) {
      this.config.interval = interval
    }

    this.isRunning = true
    console.log(`[HealthSync] Starting service with ${this.config.interval}ms interval`)

    // Immediate first sync
    this.sync()

    // Schedule regular syncs
    this.intervalId = setInterval(() => {
      this.sync()
    }, this.config.interval)
  }

  /**
   * Stop the health sync service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[HealthSync] Service not running')
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    console.log('[HealthSync] Service stopped')
  }

  /**
   * Perform a single sync operation
   */
  async sync(): Promise<boolean> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

      console.log('[HealthSync] Fetching current network data...')

      const [healthRes, riskRes] = await Promise.all([
        fetch(`${baseUrl}/api/health`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/network/risk`, { cache: 'no-store' }),
      ])

      if (!healthRes.ok || !riskRes.ok) {
        console.error('[HealthSync] Failed to fetch data:', {
          health: healthRes.status,
          risk: riskRes.status,
        })
        return false
      }

      const healthData = await healthRes.json()
      const riskData = await riskRes.json()

      // Only sync if we have valid data (status is ok)
      if (healthData.status !== 'ok') {
        console.error('[HealthSync] Health endpoint returned non-ok status')
        return false
      }

      // Create snapshot with current data
      const snapshot: Snapshot = {
        timestamp: Date.now(),
        networkHealth: healthData.networkSummary?.networkHealth || 0,
        activeNodes: healthData.networkSummary?.activeNodes || 0,
        totalNodes: healthData.networkSummary?.totalNodes || 0,
        riskScore: riskData.risk?.score || 0,
        riskLevel: riskData.risk?.level || 'unknown',
        outdatedNodes: healthData.version?.outdatedNodes || 0,
        outdatedPercentage:
          healthData.networkSummary?.totalNodes > 0
            ? Math.round(
                (healthData.version?.outdatedNodes /
                  healthData.networkSummary?.totalNodes) *
                  100
              )
            : 0,
      }

      await snapshotStore.addSnapshot(snapshot)

      this.syncCount++
      this.lastSyncTime = Date.now()

      const totalSnapshots = await snapshotStore.getCount()

      console.log('[HealthSync] Sync completed:', {
        syncNumber: this.syncCount,
        networkHealth: snapshot.networkHealth,
        activeNodes: snapshot.activeNodes,
        totalNodes: snapshot.totalNodes,
        riskScore: snapshot.riskScore,
        totalSnapshots,
        timestamp: new Date(snapshot.timestamp).toISOString(),
      })

      return true
    } catch (error) {
      console.error('[HealthSync] Sync error:', error)
      return false
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      syncCount: this.syncCount,
      lastSyncTime: this.lastSyncTime,
      interval: this.config.interval,
      enabled: this.config.enabled,
    }
  }

  /**
   * Update sync interval
   */
  setInterval(interval: number): void {
    this.config.interval = interval
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }
}

// Use globalThis to ensure singleton across Next.js API routes
const globalForHealthSync = globalThis as unknown as {
  healthSyncService: HealthSyncService | undefined
}

const healthSyncService = globalForHealthSync.healthSyncService ?? new HealthSyncService()

if (process.env.NODE_ENV !== 'production') {
  globalForHealthSync.healthSyncService = healthSyncService
}

export default healthSyncService
