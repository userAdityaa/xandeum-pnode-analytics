"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { MapIcon, Globe, ZoomIn, ZoomOut, Maximize2, Activity, HardDrive, Award } from "lucide-react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import * as Dialog from '@radix-ui/react-dialog'
import * as Popover from '@radix-ui/react-popover'

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
    const interval = setInterval(fetchData, 30 * 1000) // Refresh every 30s
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
      <div className="absolute inset-0 bg-linear-to-br from-purple-500/40 via-blue-500/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Elevated border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
        boxShadow: 'inset 0 0 30px rgba(147, 51, 234, 0.4), 0 0 40px rgba(147, 51, 234, 0.3)'
      }} />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-sidebar-foreground">Version Distribution</h3>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Click on a tier for more details</p>
        </div>

        <div className="flex items-start justify-between flex-1 gap-6">
        {/* Chart on the left */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <div className="w-full h-full" style={{ overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ outline: 'none' }} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                {versionData.map((item, index) => {
                  const isSelected = selectedVersion?.name === item.name
                  // Adjust sizing based on total number of versions
                  const tierCount = versionData.length
                  const maxRadius = 85 // Max radius as percentage to prevent cutoff
                  const centerRadius = 20 // Center empty space
                  const availableSpace = maxRadius - centerRadius
                  const tierWidth = Math.max(6, availableSpace / tierCount) // Minimum 6px per tier
                  const innerRadius = centerRadius + (index * tierWidth)
                  const outerRadius = innerRadius + tierWidth - 1
                  
                  return (
                    <Pie
                      key={index}
                      data={[item, { name: 'rest', value: totalVersions - item.value }]}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={innerRadius}
                      outerRadius={outerRadius}
                      dataKey="value"
                      stroke={isSelected ? VERSION_COLORS[index % VERSION_COLORS.length] : "none"}
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
                        filter: isSelected ? 'brightness(1.3) drop-shadow(0 0 8px ' + VERSION_COLORS[index % VERSION_COLORS.length] + ')' : 'brightness(1)',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      isAnimationActive={false}
                    >
                      <Cell fill={VERSION_COLORS[index % VERSION_COLORS.length]} style={{ outline: 'none' }} />
                      <Cell fill="rgba(255,255,255,0.05)" style={{ outline: 'none' }} />
                    </Pie>
                  )
                })}
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'transparent' }}
                  wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                  allowEscapeViewBox={{ x: false, y: false }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm font-bold text-sidebar-foreground">
                {totalVersions > 0 ? Math.round((versionData[0]?.value || 0) / totalVersions * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Legend - Always visible */}
        <div className={`flex-1 space-y-2 flex flex-col overflow-y-auto overflow-x-hidden pr-1 ${versionData.length <= 4 ? 'justify-center' : 'justify-start'}`}>
          {versionData.map((item, index) => {
            const percentage = totalVersions > 0 ? ((item.value / totalVersions) * 100).toFixed(1) : 0
              const isSelected = selectedVersion?.name === item.name
              const isInChart = index < 4
              const colorIndex = isInChart ? index : index % VERSION_COLORS.length
              return (
                <Popover.Root key={index} open={isSelected} onOpenChange={(open) => {
                  if (!open && isSelected) {
                    setSelectedVersion(null)
                  }
                }}>
                  <Popover.Trigger asChild>
                    <div 
                      className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 rounded px-2 py-1 transition-colors"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedVersion(null)
                        } else {
                          setSelectedVersion(item)
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: VERSION_COLORS[colorIndex] }}
                        />
                        <span className="text-sidebar-foreground/80 truncate block max-w-full" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sidebar-foreground/60 ml-2 shrink-0 font-medium whitespace-nowrap">
                        {percentage}%
                      </span>
                    </div>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="z-50 w-72 rounded-lg bg-sidebar/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl p-4 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                      side="right"
                      sideOffset={10}
                      align="start"
                      style={{
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 10px 20px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">Version Details</h4>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Version</p>
                              <p className="text-sm font-medium text-sidebar-foreground break-all leading-tight">
                                {item.name}
                              </p>
                            </div>
                            <div className="h-px bg-white/10"></div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Nodes</p>
                                <p className="text-xl font-bold text-sidebar-foreground">
                                  {item.value}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Percentage</p>
                                <p className="text-xl font-bold text-sidebar-foreground">
                                  {percentage}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Popover.Arrow className="fill-white/20" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              )
            })}
          </div>
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
  const [showMapView, setShowMapView] = useState(false)
  const [allNodes, setAllNodes] = useState<any[]>([])
  const [mapViewMode, setMapViewMode] = useState<'storage' | 'health' | 'credit'>('storage')
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 20])
  const [countryMetrics, setCountryMetrics] = useState<{
    storage: Record<string, number>,
    health: Record<string, number>,
    credit: Record<string, number>
  }>({
    storage: {},
    health: {},
    credit: {}
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/pnodes', { cache: 'no-store' })
        const result = await response.json()
        console.log('[Country Distribution] Fetched data:', {
          countryDistribution: result.summary?.countryDistribution,
          pNodesCount: result.pNodes?.length,
          hasCountryData: Object.keys(result.summary?.countryDistribution || {}).length > 0
        })
        setData(result.summary.countryDistribution || {})
        setAllNodes(result.pNodes || [])
        
        // Calculate country-level metrics
        const storageByCountry: Record<string, number> = {}
        const healthByCountry: Record<string, { total: number, count: number }> = {}
        const creditsByCountry: Record<string, number> = {}
        
        if (result.pNodes) {
          result.pNodes.forEach((node: any) => {
            const country = node.country || 'Unknown'
            
            // Aggregate storage from real node data - use storageUsed from get-pods-with-stats
            let nodeStorageBytes = 0
            if (node.storageUsed && node.storageUsed > 0) {
              nodeStorageBytes = node.storageUsed
            }
            storageByCountry[country] = (storageByCountry[country] || 0) + nodeStorageBytes
            
            // Aggregate actual health scores for averaging
            const nodeHealth = node.healthScore || 0
            if (!healthByCountry[country]) {
              healthByCountry[country] = { total: 0, count: 0 }
            }
            healthByCountry[country].total += nodeHealth
            healthByCountry[country].count += 1
            
            // Aggregate actual credits from podcredits API
            const nodeCredits = node.credits || 0
            creditsByCountry[country] = (creditsByCountry[country] || 0) + nodeCredits
          })
        }
        
        // Convert health to averages
        const avgHealthByCountry: Record<string, number> = {}
        Object.entries(healthByCountry).forEach(([country, data]) => {
          avgHealthByCountry[country] = data.total / data.count
        })
        
        setCountryMetrics({
          storage: storageByCountry,
          health: avgHealthByCountry,
          credit: creditsByCountry
        })
        
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
    const interval = setInterval(fetchData, 30 * 1000) // Refresh every 30s
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
  
  console.log('[Country Distribution Render]', {
    dataKeys: Object.keys(data),
    countryDataLength: countryData.length,
    totalCountries,
    rawData: data
  })

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
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/40 via-cyan-500/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Elevated border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
        boxShadow: 'inset 0 0 30px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.3)'
      }} />

      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-sidebar-foreground">Country Distribution</h3>
            <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">{selectedCountry ? 'City breakdown' : `${countryData.length} countries • Click a bar for city details`}</p>
          </div>
          <button
            onClick={() => {
              console.log('View Map clicked, showMapView:', showMapView)
              setShowMapView(true)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-[10px] text-sidebar-foreground/80 hover:text-sidebar-foreground font-medium"
          >
            <Globe className="w-3 h-3" />
            View Map
          </button>
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
          <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none">
          {countryData.length > 0 ? (
            countryData.map((item: DistributionItem, index: number) => {
              const percentage = totalCountries > 0 ? (item.value / totalCountries) * 100 : 0
              const maxValue = countryData[0]?.value || 1
              const widthPercentage = (item.value / maxValue) * 100
              const isSelected = selectedCountry?.name === item.name
              
              return (
                <div key={index}>
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5 transition-all"
                    onClick={() => {
                      if (selectedCountry?.name === item.name) {
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
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-xs text-sidebar-foreground/60">No country data available</p>
              <p className="text-[10px] text-sidebar-foreground/40">Geolocation data is being fetched...</p>
            </div>
          )}
        </div>
        )}
      </div>
      
      {/* Map View Dialog */}
      {console.log('Rendering Dialog, showMapView:', showMapView)}
      <Dialog.Root open={showMapView} onOpenChange={setShowMapView}>
        <Dialog.Portal container={typeof document !== 'undefined' ? document.body : undefined}>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden rounded-lg bg-slate-900/95 backdrop-blur-lg border-2 border-white/20 shadow-2xl animate-in fade-in zoom-in-95 relative">
            {/* Glass effect layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-lg pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent rounded-lg pointer-events-none" />
            {/* Header */}
            <div className="relative z-10 p-6 border-b border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
                    Global Node Distribution
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-sidebar-foreground/60 mt-1">
                    Geographic distribution of {allNodes.length} nodes across {Object.keys(data).length} countries
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-lg p-2 hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Dialog.Close>
              </div>
              
              {/* View Mode Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMapViewMode('storage')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mapViewMode === 'storage'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-sidebar-foreground/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  Storage
                </button>
                <button
                  onClick={() => setMapViewMode('health')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mapViewMode === 'health'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-sidebar-foreground/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Health
                </button>
                <button
                  onClick={() => setMapViewMode('credit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mapViewMode === 'credit'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-sidebar-foreground/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Credit
                </button>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                    disabled={zoom <= 1}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoom(Math.min(4, zoom + 0.5))}
                    disabled={zoom >= 4}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setZoom(1); setCenter([0, 20]) }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Map Content */}
            <div className="relative z-10 p-6 max-h-[calc(90vh-200px)] overflow-y-auto scrollbar-none">
              <div className="bg-sidebar/40 rounded-xl border border-white/10 p-4">
                <ComposableMap
                  projection="geoMercator"
                  className="w-full h-125"
                >
                  <ZoomableGroup
                    zoom={zoom}
                    center={center}
                    onMoveEnd={(position) => {
                      setCenter(position.coordinates)
                      setZoom(position.zoom)
                    }}
                    maxZoom={8}
                    minZoom={1}
                  >
                  <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                    {({ geographies }) => {
                      // Calculate max node count for color scaling
                      const maxNodeCount = Math.max(...Object.values(data), 1)
                      
                      return geographies.map((geo) => {
                        const countryName = geo.properties.name
                        const nodeCount = data[countryName] || 0
                        const hasNodes = nodeCount > 0
                        const intensity = nodeCount / maxNodeCount
                        
                        // Color gradient based on view mode
                        let fillColor = "rgba(255, 255, 255, 0.03)"
                        let hoverColor = "rgba(255, 255, 255, 0.08)"
                        
                        if (hasNodes) {
                          if (mapViewMode === 'storage') {
                            // Red → Yellow → Green gradient (heatmap)
                            if (intensity > 0.7) {
                              fillColor = `rgba(239, 68, 68, ${0.4 + intensity * 0.5})` // Red (high)
                              hoverColor = 'rgba(239, 68, 68, 0.95)'
                            } else if (intensity > 0.4) {
                              fillColor = `rgba(251, 191, 36, ${0.4 + intensity * 0.5})` // Yellow (medium)
                              hoverColor = 'rgba(251, 191, 36, 0.95)'
                            } else {
                              fillColor = `rgba(34, 197, 94, ${0.3 + intensity * 0.5})` // Green (low)
                              hoverColor = 'rgba(34, 197, 94, 0.85)'
                            }
                          } else if (mapViewMode === 'health') {
                            // Green → Yellow → Red gradient (health indicator)
                            if (intensity > 0.7) {
                              fillColor = `rgba(34, 197, 94, ${0.4 + intensity * 0.5})` // Green (healthy)
                              hoverColor = 'rgba(34, 197, 94, 0.95)'
                            } else if (intensity > 0.4) {
                              fillColor = `rgba(251, 191, 36, ${0.4 + intensity * 0.5})` // Yellow (degraded)
                              hoverColor = 'rgba(251, 191, 36, 0.95)'
                            } else {
                              fillColor = `rgba(239, 68, 68, ${0.3 + intensity * 0.5})` // Red (unhealthy)
                              hoverColor = 'rgba(239, 68, 68, 0.85)'
                            }
                          } else if (mapViewMode === 'credit') {
                            // Purple → Pink → Blue gradient
                            if (intensity > 0.7) {
                              fillColor = `rgba(147, 51, 234, ${0.4 + intensity * 0.5})` // Purple (high)
                              hoverColor = 'rgba(147, 51, 234, 0.95)'
                            } else if (intensity > 0.4) {
                              fillColor = `rgba(236, 72, 153, ${0.4 + intensity * 0.5})` // Pink (medium)
                              hoverColor = 'rgba(236, 72, 153, 0.95)'
                            } else {
                              fillColor = `rgba(59, 130, 246, ${0.3 + intensity * 0.5})` // Blue (low)
                              hoverColor = 'rgba(59, 130, 246, 0.85)'
                            }
                          }
                        }
                        
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={fillColor}
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none" },
                              hover: { 
                                fill: hasNodes ? hoverColor : "rgba(255, 255, 255, 0.08)",
                                outline: "none",
                                cursor: hasNodes ? "pointer" : "default"
                              },
                              pressed: { outline: "none" }
                            }}
                          />
                        )
                      })
                    }}
                  </Geographies>
                  
                  {/* Markers for countries with nodes */}
                  {allNodes
                    .filter(node => node.latitude && node.longitude)
                    .map((node, index) => {
                      // Get country node count for color intensity
                      const countryNodeCount = data[node.country] || 0
                      const maxNodeCount = Math.max(...Object.values(data), 1)
                      const intensity = countryNodeCount / maxNodeCount
                      
                      let markerColor = 'rgba(34, 197, 94, 0.8)' // Default green
                      
                      if (mapViewMode === 'storage') {
                        if (intensity > 0.7) {
                          markerColor = 'rgba(239, 68, 68, 0.9)' // Red
                        } else if (intensity > 0.4) {
                          markerColor = 'rgba(251, 191, 36, 0.9)' // Yellow
                        } else {
                          markerColor = 'rgba(34, 197, 94, 0.8)' // Green
                        }
                      } else if (mapViewMode === 'health') {
                        if (intensity > 0.7) {
                          markerColor = 'rgba(34, 197, 94, 0.9)' // Green
                        } else if (intensity > 0.4) {
                          markerColor = 'rgba(251, 191, 36, 0.9)' // Yellow
                        } else {
                          markerColor = 'rgba(239, 68, 68, 0.8)' // Red
                        }
                      } else if (mapViewMode === 'credit') {
                        if (intensity > 0.7) {
                          markerColor = 'rgba(147, 51, 234, 0.9)' // Purple
                        } else if (intensity > 0.4) {
                          markerColor = 'rgba(236, 72, 153, 0.9)' // Pink
                        } else {
                          markerColor = 'rgba(59, 130, 246, 0.8)' // Blue
                        }
                      }
                      
                      return (
                        <Marker key={index} coordinates={[node.longitude, node.latitude]}>
                          <g>
                            <title>
                              {node.city ? `${node.city}, ${node.country}` : node.country}
                              {node.storageUsed && `\nStorage: ${(node.storageUsed / 1024 / 1024 / 1024).toFixed(2)} GB`}
                              {node.healthScore && `\nHealth: ${node.healthScore.toFixed(0)}`}
                              {node.credits && `\nCredits: ${node.credits.toFixed(0)}`}
                            </title>
                            <circle
                              r={2 / zoom}
                              fill={markerColor}
                              stroke="rgba(255, 255, 255, 0.8)"
                              strokeWidth={0.5 / zoom}
                              className="animate-pulse hover:r-4 transition-all"
                              style={{ cursor: 'pointer' }}
                            />
                          </g>
                        </Marker>
                      )
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              </div>
              
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {(() => {
                  // Helper function to format bytes
                  const formatBytes = (bytes: number) => {
                    if (bytes === 0) return '0 B'
                    const k = 1024
                    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
                    const i = Math.floor(Math.log(bytes) / Math.log(k))
                    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
                  }
                  
                  // Get data based on mode
                  let modeData: Record<string, number> = {}
                  let label = 'Nodes'
                  let formatValue = (val: number) => val.toFixed(0)
                  
                  if (mapViewMode === 'storage') {
                    modeData = countryMetrics.storage
                    label = 'Storage Used'
                    formatValue = (val: number) => formatBytes(val)
                  } else if (mapViewMode === 'health') {
                    modeData = countryMetrics.health
                    label = 'Avg Health'
                    formatValue = (val: number) => val.toFixed(0)
                  } else if (mapViewMode === 'credit') {
                    modeData = countryMetrics.credit
                    label = 'Total Credits'
                    formatValue = (val: number) => val.toFixed(0)
                  }
                  
                  return Object.entries(modeData)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([country, metricValue], index) => {
                      const maxValue = Math.max(...Object.values(modeData), 1)
                      const intensity = metricValue / maxValue
                      
                      // For health mode, use absolute health score (0-100)
                      // For other modes, use relative intensity
                      const colorIntensity = mapViewMode === 'health' ? metricValue / 100 : intensity
                      
                      // Determine color based on mode and intensity
                      let bgColor = 'rgba(34, 197, 94, 0.15)'
                      let borderColor = 'rgba(34, 197, 94, 0.3)'
                      let dotColor = 'rgba(34, 197, 94, 0.8)'
                      
                      if (mapViewMode === 'storage') {
                        if (intensity > 0.7) {
                          bgColor = 'rgba(239, 68, 68, 0.15)'
                          borderColor = 'rgba(239, 68, 68, 0.3)'
                          dotColor = 'rgba(239, 68, 68, 0.8)'
                        } else if (intensity > 0.4) {
                          bgColor = 'rgba(251, 191, 36, 0.15)'
                          borderColor = 'rgba(251, 191, 36, 0.3)'
                          dotColor = 'rgba(251, 191, 36, 0.8)'
                        }
                      } else if (mapViewMode === 'health') {
                        // Use actual health score for coloring
                        if (colorIntensity >= 0.8) {
                          bgColor = 'rgba(34, 197, 94, 0.15)'
                          borderColor = 'rgba(34, 197, 94, 0.3)'
                          dotColor = 'rgba(34, 197, 94, 0.8)'
                        } else if (colorIntensity >= 0.5) {
                          bgColor = 'rgba(251, 191, 36, 0.15)'
                          borderColor = 'rgba(251, 191, 36, 0.3)'
                          dotColor = 'rgba(251, 191, 36, 0.8)'
                        } else {
                          bgColor = 'rgba(239, 68, 68, 0.15)'
                          borderColor = 'rgba(239, 68, 68, 0.3)'
                          dotColor = 'rgba(239, 68, 68, 0.8)'
                        }
                      } else if (mapViewMode === 'credit') {
                        if (intensity > 0.7) {
                          bgColor = 'rgba(147, 51, 234, 0.15)'
                          borderColor = 'rgba(147, 51, 234, 0.3)'
                          dotColor = 'rgba(147, 51, 234, 0.8)'
                        } else if (intensity > 0.4) {
                          bgColor = 'rgba(236, 72, 153, 0.15)'
                          borderColor = 'rgba(236, 72, 153, 0.3)'
                          dotColor = 'rgba(236, 72, 153, 0.8)'
                        } else {
                          bgColor = 'rgba(59, 130, 246, 0.15)'
                          borderColor = 'rgba(59, 130, 246, 0.3)'
                          dotColor = 'rgba(59, 130, 246, 0.8)'
                        }
                      }
                      
                      // Format value based on mode
                      const displayValue = formatValue(metricValue)
                      
                      return (
                        <div
                          key={country}
                          className="backdrop-blur-xl rounded-lg p-3 transition-all"
                          style={{
                            backgroundColor: bgColor,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: borderColor
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-2 h-2 rounded-full animate-pulse"
                              style={{ backgroundColor: dotColor }}
                            />
                            <span className="text-xs font-medium text-sidebar-foreground truncate">
                              {country}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-sidebar-foreground">
                            {displayValue}
                          </div>
                          <div className="text-[10px] text-sidebar-foreground/60">
                            {label}
                          </div>
                        </div>
                      )
                    })
                })()}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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
