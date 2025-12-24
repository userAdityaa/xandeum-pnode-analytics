import { NextResponse } from 'next/server'
import healthSyncService from '@/app/lib/health-sync'
import snapshotStore from '@/app/lib/snapshot-store'

/**
 * POST /api/snapshots
 * Manually trigger a health data sync
 */
export async function POST() {
  try {
    const success = await healthSyncService.sync()

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to sync health data' },
        { status: 500 }
      )
    }

    const status = healthSyncService.getStatus()
    const totalSnapshots = await snapshotStore.getCount()

    return NextResponse.json({
      success: true,
      message: 'Health data synced successfully',
      status,
      totalSnapshots,
    })
  } catch (error: any) {
    console.error('Error in snapshot POST:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to sync health data' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/snapshots
 * Get all snapshots and sync service status
 */
export async function GET() {
  try {
    const snapshots = await snapshotStore.getSnapshots()
    const status = healthSyncService.getStatus()

    return NextResponse.json({
      snapshots,
      count: snapshots.length,
      syncStatus: status,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to read snapshots' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/snapshots
 * Control the sync service (start/stop/configure)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action, interval } = body

    if (action === 'start') {
      healthSyncService.start(interval)
      return NextResponse.json({
        success: true,
        message: 'Sync service started',
        status: healthSyncService.getStatus(),
      })
    } else if (action === 'stop') {
      healthSyncService.stop()
      return NextResponse.json({
        success: true,
        message: 'Sync service stopped',
        status: healthSyncService.getStatus(),
      })
    } else if (action === 'setInterval' && interval) {
      healthSyncService.setInterval(interval)
      return NextResponse.json({
        success: true,
        message: `Sync interval set to ${interval}ms`,
        status: healthSyncService.getStatus(),
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start", "stop", or "setInterval"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to control sync service' },
      { status: 500 }
    )
  }
}
