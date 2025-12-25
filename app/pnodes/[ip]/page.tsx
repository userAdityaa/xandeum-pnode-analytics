'use client'

import { useEffect, useState } from 'react'
import { copyToClipboard } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Globe, TrendingUp, Activity, Network as NetworkIcon } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import dynamic from 'next/dynamic'

const NodeMap = dynamic(() => import('@/components/node-map').then(mod => ({ default: mod.NodeMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-800/30 to-slate-900/30 rounded-xl">
      <div className="text-sidebar-foreground/40">Loading map...</div>
    </div>
  )
})

interface NodeDetails {
  id: string
  ip: string
  port: number
  pubkey: string
  version: string
  status: 'online' | 'offline'
  isPublic: boolean
  country?: string
  city?: string
  latitude?: number
  longitude?: number
  lastSeen?: string
  uptimeSeconds?: number
  cpuPercent?: number
  ramUsedBytes?: number
  ramTotalBytes?: number
  storageUsedBytes?: number
  storageTotalBytes?: number
  credits?: number
  packetsReceived?: number
  packetsSent?: number
  activeStreams?: number
  networkRank?: number
  totalNodes?: number
}

export default function NodeDetailsPage() {
    const { showToast } = useToast();
  const params = useParams()
  const router = useRouter()
  const { state } = useSidebar()
  const [node, setNode] = useState<NodeDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [creditRank, setCreditRank] = useState<number>(0)
  const [totalNodes, setTotalNodes] = useState<number>(0)
  const [performancePercentile, setPerformancePercentile] = useState<number>(0)

  useEffect(() => {
    const fetchNodeDetails = async () => {
      try {
        const response = await fetch('/api/pnodes')
        const data = await response.json()
        
        // Find the node by IP (node.id format is "IP:PORT")
        const foundNode = data.pNodes?.find((n: any) => n.id.split(':')[0] === params.ip)
        
        if (foundNode) {
          console.log('Node found:', foundNode)
          console.log('Packets Received:', foundNode.packetsReceived)
          console.log('Packets Sent:', foundNode.packetsSent)
          console.log('Active Streams:', foundNode.activeStreams)
          setNode(foundNode)
          
          // Calculate rank based on credits
          const allNodes = data.pNodes || []
          const sortedByCredits = [...allNodes].sort((a: any, b: any) => (b.credits || 0) - (a.credits || 0))
          const rank = sortedByCredits.findIndex((n: any) => n.id === foundNode.id) + 1
          const total = allNodes.length
          const percentile = total > 0 ? Math.round((1 - rank / total) * 100) : 0
          
          setCreditRank(rank)
          setTotalNodes(total)
          setPerformancePercentile(percentile)
        }
      } catch (error) {
        console.error('Error fetching node details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNodeDetails()
  }, [params.ip])

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-background p-6"
        style={{
          marginLeft: state === "expanded" ? "14rem" : "6rem",
          transition: "margin-left 300ms ease-in-out"
        }}
      >
        <div className="mb-6 h-8 w-64 rounded-lg bg-sidebar-accent/50 animate-pulse" />
        <div className="mb-6 h-32 rounded-2xl bg-sidebar-accent/50 animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-96 rounded-2xl bg-sidebar-accent/50 animate-pulse" />
          <div className="h-96 rounded-2xl bg-sidebar-accent/50 animate-pulse" />
          <div className="h-80 rounded-2xl bg-sidebar-accent/50 animate-pulse" />
          <div className="h-80 rounded-2xl bg-sidebar-accent/50 animate-pulse" />
          <div className="col-span-2 h-64 rounded-2xl bg-sidebar-accent/50 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!node) {
    return (
      <div 
        className="min-h-screen bg-background p-6 flex items-center justify-center"
        style={{
          marginLeft: state === "expanded" ? "14rem" : "6rem",
          transition: "margin-left 300ms ease-in-out"
        }}
      >
        <div className="text-center">
          <div className="text-2xl font-semibold text-sidebar-foreground mb-2">Node Not Found</div>
          <div className="text-sidebar-foreground/60 mb-6">The node you're looking for doesn't exist or is no longer available.</div>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-sidebar-foreground/80 hover:bg-white/10 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    return num.toLocaleString()
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const ramUsedPercent = node.ramTotalBytes 
    ? ((node.ramUsedBytes || 0) / node.ramTotalBytes * 100).toFixed(1) 
    : '0'
    
  const storageUsedPercent = node.storageTotalBytes 
    ? ((node.storageUsedBytes || 0) / node.storageTotalBytes * 100).toFixed(2) 
    : '0'

  return (
    <div 
      className="min-h-screen bg-background p-6"
      style={{
        marginLeft: state === "expanded" ? "14rem" : "6rem",
        transition: "margin-left 300ms ease-in-out"
      }}
    >
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-sidebar-foreground/60">
        <span>Home</span>
        <span>&gt;</span>
        <span>Dashboard</span>
        <span>&gt;</span>
        <span>Nodes</span>
        <span>&gt;</span>
        <span className="text-sidebar-foreground">{node.id.split(':')[0]}</span>
      </div>

      {/* Header */}
      <div className="mb-6 bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <NetworkIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground mb-1">
                {node.id.split(':')[0]}:{node.id.split(':')[1]}
              </h1>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${node.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sidebar-foreground/80 capitalize">{node.status}</span>
                  {node.isPublic && <span className="text-sidebar-foreground/60">(Public)</span>}
                </span>
                <span className="text-sidebar-foreground/60">v{node.version}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sidebar-foreground/80 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sidebar-foreground/80 hover:bg-white/10 transition-colors"
              onClick={async () => {
                if (node) {
                  await copyToClipboard(node.id.split(':')[0]);
                  showToast(`Copied IP: ${node.id.split(':')[0]}`);
                }
              }}
            >
              Copy Stats
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sidebar-foreground/80 hover:bg-white/10 transition-colors"
              onClick={async () => {
                if (node) {
                  const ip = node.id.split(':')[0];
                  try {
                    const res = await fetch('/api/pnodes/watch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ip }),
                    });
                    if (res.ok) {
                      showToast(`Pnode with ${ip} has been added to watchlist`);
                    } else {
                      showToast('Failed to add to watchlist');
                    }
                  } catch {
                    showToast('Failed to add to watchlist');
                  }
                }
              }}
            >
              Watch
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Node Location */}
        <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">Node Location</h2>
          
          {/* Map */}
          <div className="relative w-full h-64 mb-4 overflow-hidden rounded-lg border border-white/5">
            {node.latitude && node.longitude ? (
              <NodeMap 
                latitude={node.latitude} 
                longitude={node.longitude}
                city={node.city}
                country={node.country}
                ip={node.id.split(':')[0]}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-800/30 to-slate-900/30 text-sidebar-foreground/40">
                Location data unavailable
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-sidebar-foreground/80">
              {node.city && node.country ? `${node.city}, ${node.country}` : 'Location Unknown'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span>
              <span className="text-sidebar-foreground/70">{node.isPublic ? 'Online Public' : 'Online'}</span>
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">System Performance</h2>
          </div>

          {/* CPU Usage */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-sidebar-foreground/70">CPU Usage</span>
              <span className="text-sm font-medium text-sidebar-foreground">{node.cpuPercent?.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                style={{ width: `${Math.min(node.cpuPercent || 0, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Memory */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-sidebar-foreground/70">Memory</span>
              <span className="text-sm font-medium text-sidebar-foreground">
                {formatBytes(node.ramUsedBytes)} / {formatBytes(node.ramTotalBytes)}
              </span>
            </div>
            <div className="text-xs text-sidebar-foreground/50 mb-2">{ramUsedPercent}% Used</div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-linear-to-r from-purple-500 to-pink-400 rounded-full transition-all"
                style={{ width: `${ramUsedPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Storage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-sidebar-foreground/70">Storage</span>
              <span className="text-sm font-medium text-sidebar-foreground">
                {formatBytes(node.storageUsedBytes)} / {formatBytes(node.storageTotalBytes)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-sidebar-foreground/50">{storageUsedPercent}% Used</div>
              <div className="text-xs text-sidebar-foreground/50">
                {node.storageTotalBytes ? Math.floor((node.storageTotalBytes || 0) / (1024 * 1024 * 1024 / 4096)) : 0} Pages
              </div>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-linear-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${storageUsedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Location & Identity */}
        <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">Location & Identity</h2>
          </div>

          {/* Public Key */}
          {node.pubkey && (
            <div className="mb-6">
              <div className="text-sm text-sidebar-foreground/60 mb-2">Public Key</div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                <code className="text-sm text-sidebar-foreground font-mono truncate mr-2">
                  {node.pubkey.substring(0, 44)}
                </code>
                <div className="flex items-center gap-2">
                  <button className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Copy</button>
                  <button className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Link</button>
                </div>
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-sidebar-foreground/60 mb-1">Country</div>
              <div className="text-lg font-medium text-sidebar-foreground">{node.country || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-sidebar-foreground/60 mb-1">City</div>
              <div className="text-lg font-medium text-sidebar-foreground">{node.city || 'Unknown'}</div>
            </div>
          </div>

          {/* Status Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-sidebar-foreground/60 mb-1">Last Seen</div>
              <div className="text-lg font-medium text-sidebar-foreground">
                {node.lastSeen || '3s ago'}
              </div>
            </div>
            <div>
              <div className="text-sm text-sidebar-foreground/60 mb-1">Uptime</div>
              <div className="text-lg font-medium text-sidebar-foreground">
                {formatUptime(node.uptimeSeconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Credit Score */}
        <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">Credit Score</h2>
          </div>

          {/* Credit Score Display */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-sidebar-foreground mb-2">
              {formatNumber(node.credits)}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-sidebar-foreground/60">
              <TrendingUp className="w-4 h-4" />
              <span>Lifetime Credits Earned</span>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-white/5 rounded-lg p-4 border border-white/5">
              <div className="text-sm text-sidebar-foreground/60 mb-2">Network Rank</div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                #{creditRank}
              </div>
              <div className="text-xs text-sidebar-foreground/50">
                of {totalNodes} nodes
              </div>
              <div className="text-xs text-blue-400 mt-1">by credits</div>
            </div>
            
            <div className="text-center bg-white/5 rounded-lg p-4 border border-white/5">
              <div className="text-sm text-sidebar-foreground/60 mb-2">Performance Tier</div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                #{creditRank}
              </div>
              <div className="text-xs text-sidebar-foreground/50">
                {performancePercentile}th percentile
              </div>
              <div className="text-xs text-blue-400 mt-1">by credits</div>
            </div>
          </div>
        </div>

        {/* Network Traffic */}
        <div className="col-span-2 bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <NetworkIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">Network Traffic</h2>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-sidebar-foreground/60 mb-2">Packets Received</div>
              <div className="text-3xl font-bold text-sidebar-foreground">
                {formatNumber(node.packetsReceived)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-sidebar-foreground/60 mb-2">Packets Sent</div>
              <div className="text-3xl font-bold text-sidebar-foreground">
                {formatNumber(node.packetsSent)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-sidebar-foreground/60 mb-2">Active Streams</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-green-400">
                  {node.activeStreams || 0}
                </span>
                <NetworkIcon className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
