"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface DistributionData {
  versionDistribution: Record<string, number>
  countryDistribution: Record<string, number>
}

const VERSION_COLORS = [
  "#ef4444", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899",
  "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#10b981",
  "#fbbf24", "#f43f5e", "#6366f1", "#84cc16", "#fb923c"
]
const COUNTRY_COLORS = [
  "#3b82f6", // Blue
  "#60a5fa", // Light Blue
  "#93c5fd", // Lighter Blue
  "#2563eb", // Dark Blue
  "#1d4ed8", // Darker Blue
  "#1e40af", // Even Darker Blue
  "#1e3a8a", // Deep Blue
  "#172554"  // Deepest Blue
]

// Truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

// Define types for distribution items
interface DistributionItem {
  name: string;
  value: number;
}

// Version Distribution Component
export function VersionDistributionChart() {
  const [data, setData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<DistributionItem | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/pnodes', { cache: 'no-store' })
        const result = await response.json()
        setData(result.summary.versionDistribution || {})
      } catch (error) {
        console.error('Failed to fetch version distribution:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl bg-sidebar/40 backdrop-blur-xl p-6 h-80 animate-pulse" />
    )
  }

  const versionData = Object.entries(data)
    .map(([version, count]) => ({
      name: version,
      value: count
    }))
    .sort((a, b) => b.value - a.value)

  const totalVersions = Object.values(data).reduce((sum, count) => sum + count, 0)

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      if (data.name === 'rest') return null // Don't show tooltip for rest segment
      
      return (
        <div className="bg-sidebar/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-xs font-semibold text-sidebar-foreground">{data.name}</p>
          <p className="text-xs text-sidebar-foreground/80">
            Nodes: <span className="font-semibold">{data.value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div 
      className="rounded-xl bg-sidebar/40 backdrop-blur-xl p-6 h-80 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-500 cursor-pointer"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 via-blue-500/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-sidebar-foreground">Version Distribution</h3>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Click on a tier for more details</p>
        </div>

        <div className="flex items-center justify-between flex-1 gap-4">
        {/* Chart on the left */}
        <div className="relative w-56 h-56 shrink-0 p-4">
          <div className="w-full h-full" style={{ overflow: 'visible' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ outline: 'none', overflow: 'visible' }}>
                {versionData.slice(0, 4).map((item, index) => {
                  const isSelected = selectedVersion?.name === item.name
                  return (
                    <Pie
                      key={index}
                      data={[item, { name: 'rest', value: totalVersions - item.value }]}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={40 + index * 15}
                      outerRadius={52 + index * 15}
                      dataKey="value"
                      stroke={isSelected ? VERSION_COLORS[index] : "none"}
                      strokeWidth={isSelected ? 3 : 0}
                      onClick={(data) => {
                        if (data.name !== 'rest') {
                          // Toggle selection
                          if (selectedVersion?.name === data.name) {
                            setSelectedVersion(null)
                          } else {
                            setSelectedVersion(data)
                          }
                        }
                      }}
                      style={{ 
                        cursor: 'pointer',
                        filter: isSelected ? 'brightness(1.3) drop-shadow(0 0 8px ' + VERSION_COLORS[index] + ')' : 'brightness(1)',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      isAnimationActive={false}
                    >
                      <Cell fill={VERSION_COLORS[index]} style={{ outline: 'none' }} />
                      <Cell fill="rgba(255,255,255,0.05)" style={{ outline: 'none' }} />
                    </Pie>
                  )
                })}
                <Tooltip 
                  content={<CustomTooltip />}
                  position={{ x: 250, y: 100 }}
                  wrapperStyle={{ zIndex: 1000 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-3xl font-bold text-sidebar-foreground">
                {totalVersions > 0 ? Math.round((versionData[0]?.value || 0) / totalVersions * 100) : 0}%
              </div>
              <div className="text-[10px] text-sidebar-foreground/60 mt-1">Top Version</div>
            </div>
          </div>
        </div>

        {/* Legend or Selected Version Detail */}
        {selectedVersion ? (
          <div className="flex-1 space-y-3 animate-in fade-in duration-300">
            <h4 className="text-sm font-semibold text-sidebar-foreground">Version Details</h4>
            <div className="space-y-2 bg-white/5 rounded-lg p-3">
              <div>
                <p className="text-[10px] text-sidebar-foreground/60 mb-1">Version</p>
                <p className="text-sm font-medium text-sidebar-foreground break-all">
                  {selectedVersion.name}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-sidebar-foreground/60 mb-1">Nodes</p>
                <p className="text-2xl font-bold text-sidebar-foreground">
                  {selectedVersion.value}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-sidebar-foreground/60 mb-1">Percentage</p>
                <p className="text-lg font-semibold text-sidebar-foreground">
                  {totalVersions > 0 ? ((selectedVersion.value / totalVersions) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-2 content-center">
            {versionData.slice(0, 4).map((item, index) => {
              const percentage = totalVersions > 0 ? ((item.value / totalVersions) * 100).toFixed(1) : 0
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 rounded px-2 py-1 transition-colors"
                  onClick={() => setSelectedVersion(item)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: VERSION_COLORS[index % VERSION_COLORS.length] }}
                    />
                    <span className="text-sidebar-foreground/80 truncate" title={item.name}>
                      {truncateText(item.name, 18)}
                    </span>
                  </div>
                  <span className="text-sidebar-foreground/60 ml-2 shrink-0 font-medium">
                    {percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

// Country Distribution Component
export function CountryDistributionChart() {
  const [data, setData] = useState<Record<string, number>>({})
  const [cityData, setCityData] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<DistributionItem | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/pnodes', { cache: 'no-store' })
        const result = await response.json()
        setData(result.summary.countryDistribution || {})
        
        // Build city data from nodes
        const cityByCountry: Record<string, Record<string, number>> = {}
        if (result.pNodes) {
          result.pNodes.forEach((node: any) => {
            const country = node.country || 'Unknown'
            const city = node.city || 'Unknown'
            
            if (!cityByCountry[country]) {
              cityByCountry[country] = {}
            }
            cityByCountry[country][city] = (cityByCountry[country][city] || 0) + 1
          })
        }
        setCityData(cityByCountry)
      } catch (error) {
        console.error('Failed to fetch country distribution:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl bg-sidebar/40 backdrop-blur-xl p-6 h-80 animate-pulse" />
    )
  }

  const countryData: DistributionItem[] = Object.entries(data)
    .map(([country, count]) => ({
      name: country,
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const totalCountries = Object.values(data).reduce((sum, count) => sum + count, 0)

  return (
    <div 
      className="rounded-xl bg-sidebar/40 backdrop-blur-xl p-6 h-80 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-500 cursor-pointer"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 via-cyan-500/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-sidebar-foreground">Country Distribution</h3>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">
            {selectedCountry ? 'City breakdown' : `${countryData.length} countries • Click a bar for city details`}
          </p>
        </div>

        {selectedCountry ? (
          <div className="flex-1 space-y-3 animate-in fade-in duration-300 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-sidebar-foreground">{selectedCountry.name}</h4>
                <p className="text-xs text-sidebar-foreground/60">{selectedCountry.value} nodes</p>
              </div>
              <button 
                onClick={() => setSelectedCountry(null)}
                className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors px-2 py-1 rounded hover:bg-white/5"
              >
                Back
              </button>
            </div>
            
            <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none">
              {cityData[selectedCountry.name] ? (
                Object.entries(cityData[selectedCountry.name])
                  .sort(([, a], [, b]) => b - a)
                  .map(([city, count], index) => {
                    const percentage = selectedCountry.value > 0 ? (count / selectedCountry.value) * 100 : 0
                    const maxCityValue = Math.max(...Object.values(cityData[selectedCountry.name]))
                    const widthPercentage = (count / maxCityValue) * 100
                    
                    return (
                      <div key={city}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-sidebar-foreground/80 w-20 truncate" title={city}>
                            {truncateText(city, 12)}
                          </span>
                          <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden relative">
                            <div
                              className="h-full rounded-md transition-all duration-500 ease-out"
                              style={{
                                width: `${widthPercentage}%`,
                                backgroundColor: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-end pr-2 gap-1">
                              <span className="text-[10px] font-medium text-sidebar-foreground/90">
                                {count}
                              </span>
                              <span className="text-[9px] text-sidebar-foreground/60">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
              ) : (
                <p className="text-xs text-sidebar-foreground/60">No city data available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-1.5 overflow-hidden">
          {countryData.length > 0 ? (
            countryData.map((item, index) => {
              const percentage = totalCountries > 0 ? (item.value / totalCountries) * 100 : 0
              const maxValue = countryData[0]?.value || 1
              const widthPercentage = (item.value / maxValue) * 100
              const isSelected = selectedCountry!.name === item.name
              
              return (
                <div key={index}>
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5 transition-all"
                    onClick={() => {
                      if (selectedCountry!.name === item.name) {
                        setSelectedCountry(null)
                      } else {
                        setSelectedCountry(item)
                      }
                    }}
                  >
                    <span className="text-[10px] text-sidebar-foreground/80 w-20 truncate" title={item.name}>
                      {truncateText(item.name, 12)}
                    </span>
                    <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden relative">
                      <div
                        className="h-full rounded-md transition-all duration-500 ease-out"
                        style={{
                          width: `${widthPercentage}%`,
                          backgroundColor: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
                          filter: isSelected ? 'brightness(1.3) drop-shadow(0 0 4px ' + COUNTRY_COLORS[index % COUNTRY_COLORS.length] + ')' : 'brightness(1)',
                          boxShadow: isSelected ? `0 0 0 2px ${COUNTRY_COLORS[index % COUNTRY_COLORS.length]}40` : 'none'
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <span className="text-[10px] font-medium text-sidebar-foreground/90">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-sidebar-foreground/60">No country data available</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}

export function DistributionCharts() {
  return (
    <div className="space-y-4">
      <VersionDistributionChart />
      <CountryDistributionChart />
    </div>
  )
}
