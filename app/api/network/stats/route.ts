import { NextResponse } from "next/server";
import { getAllNodeStats } from "@/app/lib/node-stats-sync";

export async function GET() {
  try {
    const allNodeStats = getAllNodeStats();
    
    if (allNodeStats.length === 0) {
      return NextResponse.json({
        summary: {
          totalNodes: 0,
          avgCpuPercent: 0,
          avgRamPercent: 0,
          totalPacketsPerSecond: 0,
          totalActiveStreams: 0,
        },
        nodes: []
      });
    }
    
    // Calculate aggregated metrics
    let totalCpu = 0;
    let totalRamPercent = 0;
    let totalPackets = 0;
    let totalStreams = 0;
    let cpuCount = 0;
    let ramCount = 0;
    
    const nodeStats = allNodeStats.map(node => {
      const ramPercent = node.ramTotal && node.ramUsed 
        ? (node.ramUsed / node.ramTotal) * 100 
        : 0;
      
      if (node.cpuPercent !== undefined) {
        totalCpu += node.cpuPercent;
        cpuCount++;
      }
      
      if (ramPercent > 0) {
        totalRamPercent += ramPercent;
        ramCount++;
      }
      
      if (node.packetsReceived !== undefined && node.packetsSent !== undefined) {
        totalPackets += (node.packetsReceived + node.packetsSent);
      }
      
      if (node.activeStreams !== undefined) {
        totalStreams += node.activeStreams;
      }
      
      return {
        address: node.address,
        cpuPercent: node.cpuPercent || 0,
        ramPercent: ramPercent,
        packetsReceived: node.packetsReceived || 0,
        packetsSent: node.packetsSent || 0,
        activeStreams: node.activeStreams || 0,
      };
    });
    
    const avgCpu = cpuCount > 0 ? totalCpu / cpuCount : 0;
    const avgRam = ramCount > 0 ? totalRamPercent / ramCount : 0;
    
    return NextResponse.json({
      summary: {
        totalNodes: allNodeStats.length,
        avgCpuPercent: parseFloat(avgCpu.toFixed(2)),
        avgRamPercent: parseFloat(avgRam.toFixed(2)),
        totalPacketsPerSecond: totalPackets,
        totalActiveStreams: totalStreams,
      },
      nodes: nodeStats.sort((a, b) => b.cpuPercent - a.cpuPercent), // Sort by CPU usage
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch network stats" },
      { status: 500 }
    );
  }
}
