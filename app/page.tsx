"use client"

import { OverviewCards } from "@/components/overview-cards"
import { NetworkTrendsChart } from "@/components/network-trends-chart"
import { VersionDistributionChart, CountryDistributionChart } from "@/components/distribution-charts"
import { StorageOverviewCard } from "@/components/storage-overview-card"
import { TopNodesTable } from "@/components/top-nodes-table"
import { useSidebar } from "@/components/ui/sidebar"

export default function Home() { 
  const { state } = useSidebar()
  
  return (
    <div 
      className="p-6 space-y-6"
      style={{
        marginLeft: state === "expanded" ? "14rem" : "6rem",
        transition: "margin-left 300ms ease-in-out"
      }}
    >
      <div>
      </div>
      
      {/* Row 1: Overview Cards (Currently 5) Showing current Health status along with version */}
      <OverviewCards />

      {/* Row 2: Network Trends and Version Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkTrendsChart />
        </div>
        <div className="lg:col-span-1">
          <VersionDistributionChart />
        </div>
      </div>

      {/* Row 3: Country Distribution and Storage Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <CountryDistributionChart />
        </div>
        <div className="lg:col-span-1">
          <StorageOverviewCard />
        </div>
      </div>

      {/* Row 4: Top Nodes Table */}
      <TopNodesTable />
    </div>
  )
}