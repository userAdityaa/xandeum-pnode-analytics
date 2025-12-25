"use client"

import { useEffect, useState } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { Cpu, MemoryStick, Network as NetworkIcon, Activity, Users, Lock, Unlock, Shield, AlertTriangle, TrendingUp, Database, Zap, Globe, Server } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"

interface NetworkStats {
  summary: {
    totalNodes: number
    avgCpuPercent: number
    avgRamPercent: number
    totalPacketsPerSecond: number
    totalActiveStreams: number
  }
  nodes: Array<{
    address: string
    cpuPercent: number
    ramPercent: number
    packetsReceived: number
    packetsSent: number
    activeStreams: number
  }>
}

interface HealthData {
  networkSummary: {
    totalNodes: number
    activeNodes: number
    inactiveNodes: number
    networkHealth: number
  }
  version: {
    outdatedNodes: number
  }
}

interface PNodesData {
  summary: {
    publicNodes: number
    privateNodes: number
    active: number
    inactive: number
    networkStorageTotal?: number
    aggregateStorageUsed?: number
  }
  pNodes: Array<any>
}

interface RiskData {
  risk: {
    level: string
    score: number
  }
}

type TabType = "overview" | "performance"

export default function NetworkPage() {
  const { state } = useSidebar()
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [pNodesData, setPNodesData] = useState<PNodesData | null>(null)
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/network/stats')
        const data = await response.json()
        console.log('[Network Page] Stats received:', data)
        console.log('[Network Page] Number of nodes:', data.nodes?.length)
        console.log('[Network Page] Summary:', data.summary)
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch network stats:', error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchOverviewData() {
      try {
        const [health, pnodes, risk] = await Promise.all([
          fetch('/api/health').then(r => r.json()),
          fetch('/api/pnodes').then(r => r.json()),
          fetch('/api/network/risk').then(r => r.json())
        ])
        
        console.log('[Network Page] Overview data:', { health, pnodes, risk })
        setHealthData(health)
        setPNodesData(pnodes)
        setRiskData(risk)
      } catch (error) {
        console.error('Failed to fetch overview data:', error)
      }
    }

    fetchStats()
    fetchOverviewData()
    
    const statsInterval = setInterval(fetchStats, 5000) // Refresh every 5 seconds
    const overviewInterval = setInterval(fetchOverviewData, 30000) // Refresh every 30 seconds
    
    return () => {
      clearInterval(statsInterval)
      clearInterval(overviewInterval)
    }
  }, [])

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatPacketsPerSecond = (num: number) => {
    if (num > 1000000) {
      return `${(num / 1000000).toFixed(2)}M pkt/s`
    }
    if (num > 1000) {
      return `${(num / 1000).toFixed(2)}K pkt/s`
    }
    return `${num} pkt/s`
  }

  if (loading || !stats || !healthData || !pNodesData || !riskData) {
    return (
      <div 
        className="p-6 space-y-6"
        style={{
          marginLeft: state === "expanded" ? "14rem" : "6rem",
          transition: "margin-left 300ms ease-in-out"
        }}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-sidebar/40 rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-sidebar/40 rounded-xl"></div>
            <div className="h-96 bg-sidebar/40 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data (top 15 nodes)
  const cpuChartData = stats.nodes.slice(0, 15).map((node, idx) => ({
    name: node.address.split(':')[0].slice(0, 10),
    value: node.cpuPercent,
    fullAddress: node.address.split(':')[0]
  }))

  const ramChartData = stats.nodes
    .sort((a, b) => b.ramPercent - a.ramPercent)
    .slice(0, 15)
    .map((node, idx) => ({
      name: node.address.split(':')[0].slice(0, 10),
      value: node.ramPercent,
      fullAddress: node.address.split(':')[0]
    }))
  
  console.log('[Network Page] CPU Chart Data:', cpuChartData)
  console.log('[Network Page] RAM Chart Data:', ramChartData)

  return (
    <div 
      className="p-6 space-y-6"
      style={{
        marginLeft: state === "expanded" ? "14rem" : "6rem",
        transition: "margin-left 300ms ease-in-out"
      }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-sidebar-foreground mb-2">Network Overview</h1>
        <p className="text-sm text-sidebar-foreground/60">
          Real-time network statistics and performance metrics.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "overview"
              ? "bg-white/10 text-sidebar-foreground"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground/80 hover:bg-white/5"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "performance"
              ? "bg-white/10 text-sidebar-foreground"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground/80 hover:bg-white/5"
          }`}
        >
          Performance
        </button>
      </div>

      {activeTab === "overview" && stats && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Network Health */}
            <div className="bg-linear-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-2xl border border-emerald-500/20 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">
                  {Math.round((healthData.networkSummary.activeNodes / healthData.networkSummary.totalNodes) * 100)}%
                </span>
              </div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {healthData.networkSummary.networkHealth}%
              </div>
              <div className="text-xs text-sidebar-foreground/70">Network Health</div>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400"
                  style={{ width: `${healthData.networkSummary.networkHealth}%` }}
                />
              </div>
            </div>

            {/* Active Nodes */}
            <div className="bg-linear-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-2xl border border-blue-500/20 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <Server className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">
                  {healthData.networkSummary.totalNodes} total
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {healthData.networkSummary.activeNodes}
              </div>
              <div className="text-xs text-sidebar-foreground/70">Active Nodes</div>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400"
                  style={{ width: `${(healthData.networkSummary.activeNodes / healthData.networkSummary.totalNodes) * 100}%` }}
                />
              </div>
            </div>

            {/* Network Traffic */}
            <div className="bg-linear-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-2xl border border-purple-500/20 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">
                  {stats.summary.totalActiveStreams} streams
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {formatPacketsPerSecond(stats.summary.totalPacketsPerSecond)}
              </div>
              <div className="text-xs text-sidebar-foreground/70">Network Traffic</div>
              <div className="mt-3 flex gap-1 h-8 items-end">
                {stats.nodes.slice(0, 8).map((node, i) => {
                  const packets = node.packetsReceived + node.packetsSent
                  const max = Math.max(...stats.nodes.slice(0, 8).map(n => n.packetsReceived + n.packetsSent))
                  return (
                    <div 
                      key={i}
                      className="flex-1 bg-purple-400/50 rounded-t"
                      style={{ height: `${Math.max((packets / max) * 100, 10)}%` }}
                    />
                  )
                })}
              </div>
            </div>

            {/* Storage Capacity */}
            <div className="bg-linear-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-2xl border border-amber-500/20 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <Database className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">
                  {((pNodesData.summary.networkStorageTotal ?? 0) / (1024**4)).toFixed(1)} TB
                </span>
              </div>
              <div className="text-3xl font-bold text-amber-400 mb-1">
                {(
                  ((pNodesData.summary.aggregateStorageUsed ?? 0) && (pNodesData.summary.networkStorageTotal ?? 0))
                    ? ((pNodesData.summary.aggregateStorageUsed ?? 0) / (pNodesData.summary.networkStorageTotal ?? 1)) * 100
                    : 0
                ).toFixed(1)}%
              </div>
              <div className="text-xs text-sidebar-foreground/70">Storage Used</div>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400"
                  style={{ width: `${
                    ((pNodesData.summary.aggregateStorageUsed ?? 0) && (pNodesData.summary.networkStorageTotal ?? 0))
                      ? ((pNodesData.summary.aggregateStorageUsed ?? 0) / (pNodesData.summary.networkStorageTotal ?? 1)) * 100
                      : 0
                  }%` }}
                />
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Node Performance Distribution */}
            <div className="lg:col-span-2 bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-sidebar-foreground">Node Performance Distribution</h3>
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { 
                        name: 'CPU', 
                        avg: stats.summary.avgCpuPercent,
                        nodes: stats.summary.totalNodes 
                      },
                      { 
                        name: 'RAM', 
                        avg: stats.summary.avgRamPercent,
                        nodes: stats.summary.totalNodes 
                      },
                      { 
                        name: 'Active', 
                        avg: (healthData.networkSummary.activeNodes / healthData.networkSummary.totalNodes) * 100,
                        nodes: healthData.networkSummary.activeNodes 
                      },
                      { 
                        name: 'Public', 
                        avg: (pNodesData.summary.publicNodes / healthData.networkSummary.totalNodes) * 100,
                        nodes: pNodesData.summary.publicNodes 
                      },
                      { 
                        name: 'Compliance', 
                        avg: ((healthData.networkSummary.totalNodes - healthData.version.outdatedNodes) / healthData.networkSummary.totalNodes) * 100,
                        nodes: healthData.networkSummary.totalNodes - healthData.version.outdatedNodes 
                      },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                      formatter={(value: any, name?: string) => [`${Number(value).toFixed(1)}%`, name ?? '']}
                    />
                    <Bar dataKey="avg" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Network Status Radar */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sidebar-foreground mb-4">Network Metrics</h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { metric: 'Health', value: healthData.networkSummary.networkHealth },
                    { metric: 'Active', value: (healthData.networkSummary.activeNodes / healthData.networkSummary.totalNodes) * 100 },
                    { metric: 'Public', value: (pNodesData.summary.publicNodes / healthData.networkSummary.totalNodes) * 100 },
                    { metric: 'Compliance', value: ((healthData.networkSummary.totalNodes - healthData.version.outdatedNodes) / healthData.networkSummary.totalNodes) * 100 },
                    { metric: 'Risk', value: 100 - riskData.risk.score },
                  ]}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                    <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resource Utilization Trend */}
            <div className="lg:col-span-2 bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sidebar-foreground mb-4">Top Nodes by Performance</h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={stats.nodes.slice(0, 12).map((node, i) => ({
                      node: node.address.split(':')[0].slice(0, 8),
                      cpu: node.cpuPercent,
                      ram: node.ramPercent,
                      traffic: (node.packetsReceived + node.packetsSent) / 1000000
                    }))}
                  >
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="node" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="cpu" stroke="#a78bfa" fill="url(#cpuGrad)" name="CPU %" />
                    <Area type="monotone" dataKey="ram" stroke="#10b981" fill="url(#ramGrad)" name="RAM %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Node Type & Status Breakdown */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sidebar-foreground mb-4">Node Breakdown</h3>
              
              <div className="space-y-4">
                {/* Active vs Inactive */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-sidebar-foreground/70">Active Nodes</span>
                    <span className="text-emerald-400 font-medium">{healthData.networkSummary.activeNodes}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${(healthData.networkSummary.activeNodes / healthData.networkSummary.totalNodes) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-sidebar-foreground/70">Inactive Nodes</span>
                    <span className="text-gray-400 font-medium">{healthData.networkSummary.inactiveNodes}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400" style={{ width: `${(healthData.networkSummary.inactiveNodes / healthData.networkSummary.totalNodes) * 100}%` }} />
                  </div>
                </div>

                {/* Public vs Private */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-sidebar-foreground/70">Public Nodes</span>
                    <span className="text-blue-400 font-medium">{pNodesData.summary.publicNodes}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${(pNodesData.summary.publicNodes / healthData.networkSummary.totalNodes) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-sidebar-foreground/70">Private Nodes</span>
                    <span className="text-purple-400 font-medium">{pNodesData.summary.privateNodes}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400" style={{ width: `${(pNodesData.summary.privateNodes / healthData.networkSummary.totalNodes) * 100}%` }} />
                  </div>
                </div>

                {/* Version Compliance */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-sidebar-foreground/70">Up-to-date</span>
                    <span className="text-emerald-400 font-medium">{healthData.networkSummary.totalNodes - healthData.version.outdatedNodes}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${((healthData.networkSummary.totalNodes - healthData.version.outdatedNodes) / healthData.networkSummary.totalNodes) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-sidebar-foreground/70">Outdated</span>
                    <span className="text-amber-400 font-medium">{healthData.version.outdatedNodes}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${(healthData.version.outdatedNodes / healthData.networkSummary.totalNodes) * 100}%` }} />
                  </div>
                </div>

                {/* Risk Score */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-sidebar-foreground/70">Risk Level</span>
                    <div className={`text-lg font-bold ${
                      riskData.risk.level === 'low' ? 'text-emerald-400' :
                      riskData.risk.level === 'medium' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {riskData.risk.level.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-center text-3xl font-bold text-sidebar-foreground/60 mt-2">
                    {riskData.risk.score}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "performance" && stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Summary Card */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-sidebar-foreground">CPU Usage</h3>
              </div>
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {stats.summary.avgCpuPercent.toFixed(1)}%
              </div>
              <p className="text-xs text-sidebar-foreground/60">Average per node</p>
            </div>

            {/* RAM Summary Card */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <MemoryStick className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-semibold text-sidebar-foreground">RAM Usage</h3>
              </div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {stats.summary.avgRamPercent.toFixed(1)}%
              </div>
              <p className="text-xs text-sidebar-foreground/60">Average per node</p>
            </div>

            {/* Network Traffic Summary Card */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <NetworkIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-sidebar-foreground">Network Traffic</h3>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {formatPacketsPerSecond(stats.summary.totalPacketsPerSecond)}
              </div>
              <p className="text-xs text-sidebar-foreground/60">Total packets</p>
            </div>

            {/* Active Streams Summary Card */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-semibold text-sidebar-foreground">Active Streams</h3>
              </div>
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {stats.summary.totalActiveStreams}
              </div>
              <p className="text-xs text-sidebar-foreground/60">Total active streams</p>
            </div>
          </div>
        
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Usage Chart */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-sidebar-foreground">CPU Usage</h3>
                </div>
                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-sidebar-foreground/60 mb-4">CPU utilization per node</p>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cpuChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      itemStyle={{ color: '#a78bfa' }}
                      formatter={(value: any, name: any, props: any) => [
                        `${Number(value).toFixed(1)}%`,
                        props.payload.fullAddress
                      ]}
                    />
                    <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Bottom area chart */}
              <div className="h-16 -mx-2 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cpuChartData}>
                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} fill="url(#cpuGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RAM Usage Chart */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-sidebar-foreground">RAM Usage</h3>
                </div>
                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-sidebar-foreground/60 mb-4">Memory utilization per node</p>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ramChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: any, name: any, props: any) => [
                        `${Number(value).toFixed(1)}%`,
                        props.payload.fullAddress
                      ]}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Bottom area chart */}
              <div className="h-16 -mx-2 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ramChartData}>
                    <defs>
                      <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#ramGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid - Network Traffic & Active Streams */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Network Traffic Chart */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <NetworkIcon className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-sidebar-foreground">Network Traffic</h3>
                </div>
                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-sidebar-foreground/60 mb-6">Packets sent/received per node</p>
              
              <div className="text-3xl font-bold text-blue-400 mb-6">
                {formatPacketsPerSecond(stats.summary.totalPacketsPerSecond)}
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.nodes.slice(0, 15).map(node => ({
                      name: node.address.split(':')[0].slice(0, 10),
                      packets: node.packetsReceived + node.packetsSent,
                      fullAddress: node.address.split(':')[0]
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        formatNumber(value as number),
                        props.payload.fullAddress
                      ]}
                    />
                    <Bar dataKey="packets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Bottom area chart */}
              <div className="h-16 -mx-2 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.nodes.slice(0, 15).map(n => ({ value: n.packetsReceived + n.packetsSent }))}>
                    <defs>
                      <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#trafficGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Streams Chart */}
            <div className="bg-linear-to-br from-white/8 to-white/3 backdrop-blur-2xl border border-white/10 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-sidebar-foreground">Active Streams</h3>
                </div>
                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-sidebar-foreground/60 mb-6">Data streams per node</p>
              
              <div className="text-3xl font-bold text-orange-400 mb-6">
                {stats.summary.totalActiveStreams} <span className="text-lg text-sidebar-foreground/60">total</span>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.nodes.slice(0, 15).map(node => ({
                      name: node.address.split(':')[0].slice(0, 10),
                      streams: node.activeStreams,
                      fullAddress: node.address.split(':')[0]
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        value,
                        props.payload.fullAddress
                      ]}
                    />
                    <Bar dataKey="streams" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Bottom area chart */}
              <div className="h-16 -mx-2 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.nodes.slice(0, 15).map(n => ({ value: n.activeStreams }))}>
                    <defs>
                      <linearGradient id="streamsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#streamsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
