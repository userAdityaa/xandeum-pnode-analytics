"use client"

import { useEffect, useRef } from 'react'

/**
 * HealthSyncInitializer
 * Automatically starts the health data sync service when the app loads
 */
export function HealthSyncInitializer() {
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent double initialization in development mode (React.StrictMode)
    if (initialized.current) {
      return
    }
    initialized.current = true

    const initializeSync = async () => {
      try {
        // Check if sync is already running
        const statusRes = await fetch('/api/sync', { cache: 'no-store' })
        const status = await statusRes.json()

        if (status.isRunning) {
          console.log('[HealthSync] Service already running')
          return
        }

        // Start the sync service with 2-minute interval
        const startRes = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            interval: 2 * 60 * 1000, // 2 minutes
          }),
        })

        if (startRes.ok) {
          const result = await startRes.json()
          console.log('[HealthSync] Service initialized:', result.status)
        } else {
          console.error('[HealthSync] Failed to start service')
        }
      } catch (error) {
        console.error('[HealthSync] Initialization error:', error)
      }
    }

    // Initialize after a short delay to let the app settle
    const timer = setTimeout(initializeSync, 1000)

    return () => clearTimeout(timer)
  }, [])

  // This component doesn't render anything
  return null
}
