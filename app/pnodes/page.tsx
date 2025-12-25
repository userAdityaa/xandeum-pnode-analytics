
"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, ChevronDown } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

interface Node {
  id: string
  version: string
  lastSeen: number
  status: 'active' | 'inactive'
  healthScore: number
  isPublic?: boolean
  storageUsed?: number
  storageCommitted?: number
  cpuPercent?: number
  ramUsedBytes?: number
  ramTotalBytes?: number
  uptimeSeconds?: number
}

interface Summary {
  totalKnown: number
  active: number
  inactive: number
}

export default function PNodesPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PNodesPage />
    </Suspense>
  )
}

function PNodesPage() {
  const { state } = useSidebar()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [nodes, setNodes] = useState<Node[]>([])
  const [summary, setSummary] = useState<Summary>({ totalKnown: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [watchlistIPs, setWatchlistIPs] = useState<string[]>([])
  // Load watchlist from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pnodes_watchlist')
    if (stored) {
      try {
        setWatchlistIPs(JSON.parse(stored))
      } catch {
        setWatchlistIPs([])
      }
    }
  }, [])
  const [versionFilter, setVersionFilter] = useState<string>("all")
  const [sortColumn, setSortColumn] = useState<string>("lastSeen")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Always reflect the search param in the input
  const searchQuery = searchParams?.get("search") || ""

  // No need to setSearchQuery; searchQuery is always derived from searchParams

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/pnodes', { cache: 'no-store' })
        const result = await response.json()
        setNodes(result.pNodes || [])
        setSummary(result.summary || { totalKnown: 0, active: 0, inactive: 0 })
      } catch (error) {
        console.error('Failed to fetch nodes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '—'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '—'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return '—'
    return `${value.toFixed(1)}%`
  }

  const formatRamPercent = (used?: number, total?: number) => {
    if (!used || !total) return '—'
    return `${((used / total) * 100).toFixed(0)}%`
  }

  const avgUptime = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + (n.uptimeSeconds || 0), 0) / nodes.length
    : 0

  // Get unique versions for filter
  const versions = Array.from(new Set(nodes.map(n => n.version))).sort()

  // Filter and sort nodes
  const filteredNodes = nodes
    .filter(node => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesIP = node.id.toLowerCase().includes(query)
        return matchesIP
      }
      return true
    })
    .filter(node => {
      // Status filter
      if (statusFilter === "all") return true
      if (statusFilter === "online") return node.status === "active"
      if (statusFilter === "offline") return node.status === "inactive"
      if (statusFilter === "public") return node.isPublic === true
      if (statusFilter === "private") return node.isPublic === false
      if (statusFilter === "watchlist") return watchlistIPs.includes(node.id.split(':')[0])
      return true
    })
    .filter(node => {
      // Version filter
      if (versionFilter === "all") return true
      return node.version === versionFilter
    })
    .sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Node]
      let bVal: any = b[sortColumn as keyof Node]
      if (aVal === undefined) aVal = sortDirection === "asc" ? Infinity : -Infinity
      if (bVal === undefined) bVal = sortDirection === "asc" ? Infinity : -Infinity
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  // Add/remove IP to watchlist
  const toggleWatchlist = (ip: string) => {
    let updated: string[]
    if (watchlistIPs.includes(ip)) {
      updated = watchlistIPs.filter(wip => wip !== ip)
    } else {
      updated = [...watchlistIPs, ip]
    }
    setWatchlistIPs(updated)
    localStorage.setItem('pnodes_watchlist', JSON.stringify(updated))
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Pagination
  const totalPages = Math.ceil(filteredNodes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNodes = filteredNodes.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, versionFilter])

  if (loading) {
    return (
      <div 
        className="p-6 space-y-6"
        style={{
          marginLeft: state === "expanded" ? "14rem" : "6rem",
          transition: "margin-left 300ms ease-in-out"
        }}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-sidebar/40 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-sidebar/40 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-sidebar/40 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="p-6 space-y-6"
      style={{
        marginLeft: state === "expanded" ? "14rem" : "6rem",
        transition: "margin-left 300ms ease-in-out"
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-sidebar-foreground/60">
        <span>Home</span>
        <span>›</span>
        <span>Dashboard</span>
        <span>›</span>
        <span className="text-sidebar-foreground">All Nodes</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 border border-white/10">
          <div className="text-sm text-sidebar-foreground/60 mb-2">Total Nodes</div>
          <div className="text-3xl font-bold text-sidebar-foreground">{summary.totalKnown}</div>
          <div className="text-xs text-sidebar-foreground/50 mt-1">Registered pNodes</div>
        </div>
        
        <div className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 border border-white/10">
          <div className="text-sm text-sidebar-foreground/60 mb-2">Online</div>
          <div className="text-3xl font-bold text-sidebar-foreground">{summary.active}</div>
          <div className="text-xs text-sidebar-foreground/50 mt-1">Currently active</div>
        </div>
        
        <div className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 border border-white/10">
          <div className="text-sm text-sidebar-foreground/60 mb-2">Offline</div>
          <div className="text-3xl font-bold text-sidebar-foreground">{summary.inactive}</div>
          <div className="text-xs text-sidebar-foreground/50 mt-1">No recent heartbeat</div>
        </div>
        
        <div className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 border border-white/10">
          <div className="text-sm text-sidebar-foreground/60 mb-2">Avg Network Uptime</div>
          <div className="text-3xl font-bold text-sidebar-foreground">{formatUptime(avgUptime)}</div>
          <div className="text-xs text-sidebar-foreground/50 mt-1">Across {summary.totalKnown} nodes</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-sidebar/60 backdrop-blur-xl p-6 border border-white/10">
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
            <input
              type="text"
              placeholder="Search IP, Pubkey..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                router.replace(val ? `/pnodes?search=${encodeURIComponent(val)}` : "/pnodes", { scroll: false })
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-white/20"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:border-white/20 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="watchlist">Watchlist</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-sidebar-foreground focus:outline-none focus:border-white/20 cursor-pointer"
            >
              <option value="all">All Versions</option>
              {versions.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60">Status</th>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60 cursor-pointer hover:text-sidebar-foreground"
                  onClick={() => handleSort('id')}
                >
                  Address {sortColumn === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60 cursor-pointer hover:text-sidebar-foreground"
                  onClick={() => handleSort('version')}
                >
                  Version {sortColumn === 'version' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60 cursor-pointer hover:text-sidebar-foreground"
                  onClick={() => handleSort('cpuPercent')}
                >
                  CPU {sortColumn === 'cpuPercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60 cursor-pointer hover:text-sidebar-foreground"
                  onClick={() => handleSort('ramUsedBytes')}
                >
                  RAM {sortColumn === 'ramUsedBytes' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60 cursor-pointer hover:text-sidebar-foreground"
                  onClick={() => handleSort('storageUsed')}
                >
                  Storage {sortColumn === 'storageUsed' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60 cursor-pointer hover:text-sidebar-foreground"
                  onClick={() => handleSort('uptimeSeconds')}
                >
                  Uptime {sortColumn === 'uptimeSeconds' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-sidebar-foreground/60 cursor-pointer hover:text-sidebar-foreground"
                  onClick={() => handleSort('lastSeen')}
                >
                  Last Seen {sortColumn === 'lastSeen' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedNodes.map((node) => {
                const ip = node.id.split(':')[0]
                const isWatched = watchlistIPs.includes(ip)
                return (
                  <tr key={node.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${node.isPublic ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-xs text-sidebar-foreground/70">
                          Online ({node.isPublic ? 'Public' : 'Private'})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span className="text-sm font-mono text-sidebar-foreground/80 cursor-pointer" onClick={() => window.location.href = `/pnodes/${ip}`}>{ip}</span>
                      <span className="text-sm text-sidebar-foreground/40">:{node.id.split(':')[1]}</span>
                      <button
                        onClick={() => toggleWatchlist(ip)}
                        className={`ml-2 px-2 py-0.5 rounded text-xs ${isWatched ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-sidebar-foreground/40'} border border-white/10 hover:bg-blue-500/30`}
                        title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        {isWatched ? '★' : '☆'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-sidebar-foreground/70">{node.version}</td>
                    <td className="py-3 px-4 text-sm text-green-400">{formatPercent(node.cpuPercent)}</td>
                    <td className="py-3 px-4 text-sm text-green-400">{formatRamPercent(node.ramUsedBytes, node.ramTotalBytes)}</td>
                    <td className="py-3 px-4 text-sm text-green-400">{formatBytes(node.storageUsed)}</td>
                    <td className="py-3 px-4 text-sm text-sidebar-foreground/70">{formatUptime(node.uptimeSeconds)}</td>
                    <td className="py-3 px-4 text-sm text-sidebar-foreground/60">{formatTimeAgo(node.lastSeen)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-sidebar-foreground/60">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredNodes.length)} of {filteredNodes.length} nodes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-sidebar-foreground/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-sidebar-foreground/60 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-sidebar-foreground/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
