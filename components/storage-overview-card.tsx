"use client"

import { useEffect, useState } from "react"
import { HardDrive, Database, Disc } from "lucide-react"

interface StorageData {
  publicNodes: number
  privateNodes: number
  networkStorageTotal: number
  aggregateStorageUsed: number
}

export function StorageOverviewCard() {
  const [data, setData] = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/pnodes', { cache: 'no-store' })
        const result = await response.json()
        
        setData({
          publicNodes: result.summary.publicNodes || 0,
          privateNodes: result.summary.privateNodes || 0,
          networkStorageTotal: result.summary.networkStorageTotal || 0,
          aggregateStorageUsed: result.summary.aggregateStorageUsed || 0,
        })
      } catch (error) {
        console.error('Failed to fetch storage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60 * 1000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl bg-sidebar/40 backdrop-blur-xl p-6 h-80 animate-pulse" />
    )
  }

  if (!data) return null

  // Calculate storage metrics
  const totalStorageGB = data.networkStorageTotal / (1024 ** 3)
  const usedStorageGB = data.aggregateStorageUsed / (1024 ** 3)
  const availableStorageGB = totalStorageGB - usedStorageGB
  const usagePercentage = totalStorageGB > 0 ? (usedStorageGB / totalStorageGB) * 100 : 0

  // Format bytes to human readable
  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <div 
      className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 h-80 relative overflow-hidden group hover:-translate-y-2 hover:scale-[1.005] transition-all duration-500 cursor-pointer border-2 border-white/20"
      style={{
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 15px 35px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.4)',
        transform: 'perspective(1000px) rotateX(2deg)',
      }}
    >
      {/* Top highlight edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
      
      {/* Bottom shadow edge */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-linear-to-t from-black/30 to-transparent" />
      
      {/* 3D depth layer */}
      <div className="absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-black/30" />
      
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-500/40 via-pink-500/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Elevated border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
        boxShadow: 'inset 0 0 30px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.3)'
      }} />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-sidebar-foreground flex items-center gap-2">
            <Database className="w-4 h-4" />
            Network Storage
          </h3>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">
            {data.publicNodes + data.privateNodes} nodes • {data.publicNodes} public • {data.privateNodes} private
          </p>
        </div>

        {/* Bar Chart - Horizontal */}
        <div className="mb-4">
          <div className="space-y-3">
            {/* Total Storage Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-sidebar-foreground/80">Total</span>
                </div>
                <span className="text-xs font-bold text-sidebar-foreground">
                  {formatStorage(data.networkStorageTotal)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-purple-500 to-purple-400"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Used Storage Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Disc className="w-3 h-3 text-pink-400" />
                  <span className="text-xs text-sidebar-foreground/80">Used</span>
                </div>
                <span className="text-xs font-bold text-sidebar-foreground">
                  {formatStorage(data.aggregateStorageUsed)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-pink-500 to-pink-400"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>

            {/* Available Storage Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-sidebar-foreground/80">Available</span>
                </div>
                <span className="text-xs font-bold text-sidebar-foreground">
                  {formatStorage(data.networkStorageTotal - data.aggregateStorageUsed)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${100 - usagePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Storage Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-auto">
          <div className="backdrop-blur-xl rounded-lg p-3 bg-white/5 border border-white/10 text-center">
            <div className="text-xl font-bold text-sidebar-foreground">
              {usagePercentage.toFixed(1)}%
            </div>
            <div className="text-[10px] text-sidebar-foreground/60 mt-1">Usage</div>
          </div>

          <div className="backdrop-blur-xl rounded-lg p-3 bg-white/5 border border-white/10 text-center">
            <div className="text-xl font-bold text-sidebar-foreground">
              {data.publicNodes}
            </div>
            <div className="text-[10px] text-sidebar-foreground/60 mt-1">Public</div>
          </div>

          <div className="backdrop-blur-xl rounded-lg p-3 bg-white/5 border border-white/10 text-center">
            <div className="text-xl font-bold text-sidebar-foreground">
              {data.privateNodes}
            </div>
            <div className="text-[10px] text-sidebar-foreground/60 mt-1">Private</div>
          </div>
        </div>
      </div>
    </div>
  )
}
