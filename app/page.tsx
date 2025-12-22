"use client"

import { OverviewCards } from "@/components/overview-cards"
import { NetworkTrendsChart } from "@/components/network-trends-chart"
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
      
      <OverviewCards />

      {/* Network Trends */}
      <NetworkTrendsChart />
    </div>
  )
}