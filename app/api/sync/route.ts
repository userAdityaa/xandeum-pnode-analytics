import { NextResponse } from 'next/server'
import healthSyncService from '@/app/lib/health-sync'

/**
 * GET /api/sync/status
 * Get the status of the health sync service
 */
export async function GET() {
  try {
    const status = healthSyncService.getStatus()
    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sync/control
 * Control the health sync service (start/stop/setInterval)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, interval } = body

    switch (action) {
      case 'start':
        healthSyncService.start(interval)
        return NextResponse.json({
          success: true,
          message: 'Health sync service started',
          status: healthSyncService.getStatus(),
        })

      case 'stop':
        healthSyncService.stop()
        return NextResponse.json({
          success: true,
          message: 'Health sync service stopped',
          status: healthSyncService.getStatus(),
        })

      case 'setInterval':
        if (!interval || typeof interval !== 'number') {
          return NextResponse.json(
            { error: 'Invalid interval. Must be a number in milliseconds' },
            { status: 400 }
          )
        }
        healthSyncService.setInterval(interval)
        return NextResponse.json({
          success: true,
          message: `Sync interval updated to ${interval}ms`,
          status: healthSyncService.getStatus(),
        })

      case 'syncNow':
        const success = await healthSyncService.sync()
        return NextResponse.json({
          success,
          message: success
            ? 'Manual sync completed successfully'
            : 'Manual sync failed',
          status: healthSyncService.getStatus(),
        })

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use "start", "stop", "setInterval", or "syncNow"',
          },
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
