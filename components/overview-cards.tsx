"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, Server, ServerOff, PackageX } from "lucide-react"

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

interface RiskData {
  risk: {
    level: "low" | "medium" | "high"
    score: number
  }
  metrics: {
    outdatedPercentage: number
  }
}

export function OverviewCards() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, riskRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/network/risk')
        ])
        
        const health = await healthRes.json()
        const risk = await riskRes.json()
        
        setHealthData(health)
        setRiskData(risk)
      } catch (error) {
        console.error('Failed to fetch overview data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-sidebar-accent/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!healthData || !riskData) {
    return null
  }

  const outdatedPercentage = healthData.networkSummary.totalNodes > 0
    ? Math.round((healthData.version.outdatedNodes / healthData.networkSummary.totalNodes) * 100)
    : 0

  const inactivePercentage = healthData.networkSummary.totalNodes > 0
    ? Math.round((healthData.networkSummary.inactiveNodes / healthData.networkSummary.totalNodes) * 100)
    : 0

  const cards = [
    {
      title: "Network Health",
      value: `${healthData.networkSummary.networkHealth}%`,
      icon: Activity,
      gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      borderGradient: "from-emerald-500/50 via-emerald-500/30 to-emerald-500/20",
      iconColor: "text-emerald-400",
      glowColor: "shadow-emerald-500/20",
    },
    {
      title: "Risk Level",
      value: riskData.risk.level.toUpperCase(),
      subtitle: `Score: ${riskData.risk.score}`,
      icon: AlertTriangle,
      gradient: riskData.risk.level === "low" 
        ? "from-green-500/20 via-green-500/10 to-transparent"
        : riskData.risk.level === "medium"
        ? "from-amber-500/20 via-amber-500/10 to-transparent"
        : "from-red-500/20 via-red-500/10 to-transparent",
      borderGradient: riskData.risk.level === "low"
        ? "from-green-500/50 via-green-500/30 to-green-500/20"
        : riskData.risk.level === "medium"
        ? "from-amber-500/50 via-amber-500/30 to-amber-500/20"
        : "from-red-500/50 via-red-500/30 to-red-500/20",
      iconColor: riskData.risk.level === "low"
        ? "text-green-400"
        : riskData.risk.level === "medium"
        ? "text-amber-400"
        : "text-red-400",
      glowColor: riskData.risk.level === "low"
        ? "shadow-green-500/20"
        : riskData.risk.level === "medium"
        ? "shadow-amber-500/20"
        : "shadow-red-500/20",
    },
    {
      title: "Active Nodes",
      value: `${healthData.networkSummary.activeNodes} / ${healthData.networkSummary.totalNodes}`,
      icon: Server,
      gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
      borderGradient: "from-blue-500/50 via-blue-500/30 to-blue-500/20",
      iconColor: "text-blue-400",
      glowColor: "shadow-blue-500/20",
    },
    {
      title: "Inactive Nodes",
      value: healthData.networkSummary.inactiveNodes.toString(),
      subtitle: `${inactivePercentage}% of total`,
      icon: ServerOff,
      gradient: "from-orange-500/20 via-orange-500/10 to-transparent",
      borderGradient: "from-orange-500/50 via-orange-500/30 to-orange-500/20",
      iconColor: "text-orange-400",
      glowColor: "shadow-orange-500/20",
    },
    {
      title: "Version Drift",
      value: `${outdatedPercentage}%`,
      subtitle: `${healthData.version.outdatedNodes} outdated`,
      icon: PackageX,
      gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
      borderGradient: "from-purple-500/50 via-purple-500/30 to-purple-500/20",
      iconColor: "text-purple-400",
      glowColor: "shadow-purple-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`
            relative group
            rounded-xl p-4
            bg-sidebar
            border border-sidebar-border
            hover:border-sidebar-border/80
            transition-all duration-300
            overflow-hidden
            ${card.glowColor}
            hover:shadow-lg
          `}
        >
          {/* Gradient background */}
          <div className={`
            absolute inset-0 
            bg-gradient-to-br ${card.gradient}
            opacity-50
            group-hover:opacity-70
            transition-opacity duration-300
          `} />
          
          {/* Border gradient overlay */}
          <div className={`
            absolute inset-0 
            bg-gradient-to-br ${card.borderGradient}
            opacity-0
            group-hover:opacity-100
            transition-opacity duration-300
            pointer-events-none
          `}
          style={{
            maskImage: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskImage: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px'
          }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-sidebar-foreground/60">
                {card.title}
              </span>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
            
            <div className="flex-1">
              <div className={`text-2xl font-bold ${card.iconColor} mb-1`}>
                {card.value}
              </div>
              {card.subtitle && (
                <div className="text-xs text-sidebar-foreground/50">
                  {card.subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
