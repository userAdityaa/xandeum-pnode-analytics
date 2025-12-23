"use client"

import { useEffect, useState } from "react"
import { Trophy, HardDrive, Activity, TrendingUp } from "lucide-react"

type SortMode = 'credits' | 'storage' | 'health'

interface Node {
  id: string
  version: string
  lastSeen: number
  status: 'active' | 'inactive'
  healthScore: number
  isPublic?: boolean
  storageUsed?: number
  credits?: number
  cpuPercent?: number
  ramUsedBytes?: number
  ramTotalBytes?: number
}

export function TopNodesTable() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('credits')

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/pnodes', { cache: 'no-store' })
        const result = await response.json()
        setNodes(result.pNodes || [])
      } catch (error) {
        console.error('Failed to fetch nodes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getSortedNodes = () => {
    const sorted = [...nodes].filter(node => node.status === 'active')
    
    switch (sortMode) {
      case 'credits':
        return sorted.sort((a, b) => (b.credits || 0) - (a.credits || 0))
      case 'storage':
        return sorted.sort((a, b) => (b.storageUsed || 0) - (a.storageUsed || 0))
      case 'health':
        return sorted.sort((a, b) => b.healthScore - a.healthScore)
      default:
        return sorted
    }
  }

  const topNodes = getSortedNodes().slice(0, 10)
  const totalNodes = nodes.length

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '—'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const formatRamPercent = (used?: number, total?: number) => {
    if (!used || !total) return '—'
    return `${((used / total) * 100).toFixed(1)}%`
  }

  const getSortIcon = (mode: SortMode) => {
    switch (mode) {
      case 'credits':
        return <Trophy className="w-4 h-4" />
      case 'storage':
        return <HardDrive className="w-4 h-4" />
      case 'health':
        return <Activity className="w-4 h-4" />
    }
  }

  const getSortLabel = () => {
    switch (sortMode) {
      case 'credits':
        return 'Credits'
      case 'storage':
        return 'Storage'
      case 'health':
        return 'Health'
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-sidebar/40 backdrop-blur-xl p-6 h-125 animate-pulse" />
    )
  }

  return (
    <div 
      className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 relative overflow-hidden group hover:-translate-y-2 hover:scale-[1.005] transition-all duration-500 border-2 border-white/20"
      style={{
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 15px 35px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.4)',
        transform: 'perspective(1000px) rotateX(2deg)',
      }}
    >
      {/* Background effects */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-linear-to-t from-black/30 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-black/30" />
      <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-linear-to-br from-amber-500/40 via-orange-500/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
        boxShadow: 'inset 0 0 30px rgba(251, 146, 60, 0.4), 0 0 40px rgba(251, 146, 60, 0.3)'
      }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getSortIcon(sortMode)}
            <div>
              <h3 className="text-lg font-semibold text-sidebar-foreground">
                Top Performers by {getSortLabel()}
              </h3>
              <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                Showing {topNodes.length} of {totalNodes} nodes
              </p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            View All
          </button>
        </div>

        {/* Sort Mode Tabs */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setSortMode('credits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortMode === 'credits'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-sidebar-foreground/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Credits
          </button>
          <button
            onClick={() => setSortMode('storage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortMode === 'storage'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-sidebar-foreground/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Storage
          </button>
          <button
            onClick={() => setSortMode('health')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortMode === 'health'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-sidebar-foreground/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Health
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">#</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">{getSortLabel()}</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">Status</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">Address</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">Version</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">CPU</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">RAM</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-sidebar-foreground/60">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {topNodes.map((node, index) => (
                <tr key={node.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2 text-xs text-sidebar-foreground/60">{index + 1}</td>
                  <td className="py-3 px-2 text-sm font-semibold text-sidebar-foreground">
                    {sortMode === 'credits' && (node.credits?.toLocaleString() || '0')}
                    {sortMode === 'storage' && formatBytes(node.storageUsed)}
                    {sortMode === 'health' && `${node.healthScore}%`}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${node.isPublic ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-xs text-sidebar-foreground/70">
                        Online ({node.isPublic ? 'Public' : 'Private'})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-mono text-sidebar-foreground/80">
                      {node.id.split(':')[0]}
                    </span>
                    <span className="text-xs text-sidebar-foreground/40">:{node.id.split(':')[1]}</span>
                  </td>
                  <td className="py-3 px-2 text-xs text-sidebar-foreground/70">{node.version}</td>
                  <td className="py-3 px-2 text-xs text-sidebar-foreground/70">
                    {node.cpuPercent ? `${node.cpuPercent.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-3 px-2 text-xs text-sidebar-foreground/70">
                    {formatRamPercent(node.ramUsedBytes, node.ramTotalBytes)}
                  </td>
                  <td className="py-3 px-2 text-xs text-sidebar-foreground/60">{formatTimeAgo(node.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
