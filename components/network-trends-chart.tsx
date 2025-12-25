"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TrendData {
  timestamp: string
  networkHealth: number
  activeNodes: number
  riskScore: number
  versionDrift: number
}

interface HistoryResponse {
  data: TrendData[]
  realDataPoints: number
  mockDataPoints: number
  totalPoints: number
  realDataPercentage: number
  hasRealData: boolean
  totalSnapshotsInDB: number
  range: string
}

type TimeRange = "1h" | "24h" | "30d"

export function NetworkTrendsChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [hasRealData, setHasRealData] = useState(false)
  const [realDataPoints, setRealDataPoints] = useState(0)
  const [mockDataPoints, setMockDataPoints] = useState(0)
  const [realDataPercentage, setRealDataPercentage] = useState(0)
  const [totalSnapshots, setTotalSnapshots] = useState(0)
  const [timeRange, setTimeRange] = useState<TimeRange>("1h")

  useEffect(() => {
    async function collectAndFetch() {
      try {
        // Collect snapshot first
        await fetch('/api/snapshots', { method: 'POST', cache: 'no-store' })
        
        // Small delay to ensure snapshot is stored
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Then fetch historical data
        const response = await fetch(`/api/history?range=${timeRange}`, { cache: 'no-store' })
        const result: HistoryResponse = await response.json()
        
        setData(result.data)
        setHasRealData(result.hasRealData)
        setRealDataPoints(result.realDataPoints)
        setMockDataPoints(result.mockDataPoints || 0)
        setRealDataPercentage(result.realDataPercentage || 0)
        setTotalSnapshots(result.totalSnapshotsInDB || 0)
      } catch (error) {
        console.error('Failed to update chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    // Initial load
    setLoading(true)
    collectAndFetch()
    
    // Set up periodic collection and refresh
    const interval = timeRange === "1h" ? 30 * 1000 : timeRange === "24h" ? 5 * 60 * 1000 : 10 * 60 * 1000
    const timer = setInterval(collectAndFetch, interval)
    
    return () => clearInterval(timer)
  }, [timeRange])

  if (loading) {
    return (
      <div className="rounded-xl bg-sidebar/40 backdrop-blur-xl p-6 h-80 animate-pulse" />
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sidebar/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-sidebar-foreground/60 mb-2">{payload[0].payload.timestamp}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-semibold text-sidebar-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 h-80 relative overflow-hidden group hover:-translate-y-2 hover:scale-[1.005] transition-all duration-500 cursor-pointer border-2 border-white/20"
      style={{
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 15px 35px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.4)',
        transform: 'perspective(1000px) rotateX(2deg)',
      }}
    >
      {/* Top highlight edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
      
      {/* Bottom shadow edge */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-linear-to-t from-black/30 to-transparent" />
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 via-purple-500/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-sidebar-foreground">Network Health Trends</h3>
            <p className="text-xs text-sidebar-foreground/60">
              {timeRange === "1h" ? "Last hour" : timeRange === "24h" ? "Last 24 hours" : "Last 30 days"} performance metrics
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs">
              {hasRealData ? (
                <>
                  <span className="text-emerald-400 font-medium">
                    ✓ {realDataPoints} real ({realDataPercentage}%)
                  </span>
                  {mockDataPoints > 0 && (
                    <span className="text-amber-400/70">
                      {mockDataPoints} simulated
                    </span>
                  )}
                  <span className="text-sidebar-foreground/40">
                    | {totalSnapshots} total in DB
                  </span>
                </>
              ) : (
                <span className="text-amber-400/70">
                  ⚠ Using simulated data - sync in progress
                </span>
              )}
            </div>
          </div>
          
          {/* Time range selector */}
          <div className="flex gap-1 bg-sidebar/60 backdrop-blur-sm rounded-lg p-1">
            {[
              { value: "1h", label: "1H" },
              { value: "24h", label: "24H" },
              { value: "30d", label: "30D" }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as TimeRange)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-md transition-all duration-200
                  ${timeRange === option.value 
                    ? "bg-emerald-500/20 text-emerald-400 shadow-lg" 
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground/80 hover:bg-sidebar/40"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="timestamp" 
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
                iconType="line"
                iconSize={12}
              />
              <Line 
                type="monotone" 
                dataKey="networkHealth" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                name="Network Health %"
                activeDot={{ r: 4, fill: '#10b981' }}
              />
              <Line 
                type="monotone" 
                dataKey="activeNodes" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                name="Active Nodes"
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
              <Line 
                type="monotone" 
                dataKey="riskScore" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={false}
                name="Risk Score"
                activeDot={{ r: 4, fill: '#f97316' }}
              />
              <Line 
                type="monotone" 
                dataKey="versionDrift" 
                stroke="#a855f7" 
                strokeWidth={2}
                dot={false}
                name="Version Drift %"
                activeDot={{ r: 4, fill: '#a855f7' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
