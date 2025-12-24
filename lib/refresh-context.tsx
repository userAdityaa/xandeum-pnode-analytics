"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface RefreshContextType {
  refreshTrigger: number
  timeUntilRefresh: number
}

const RefreshContext = createContext<RefreshContextType>({
  refreshTrigger: 0,
  timeUntilRefresh: 30
})

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(30)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          // Trigger refresh
          setRefreshTrigger((t) => t + 1)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshTrigger, timeUntilRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  return useContext(RefreshContext)
}
