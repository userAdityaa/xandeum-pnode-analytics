import { NextResponse } from "next/server";
import { callPRPCWithFallback } from "@/app/lib/prpc/client";

/**
 * Compute health score (0–100) based on system metrics
 */
function computeLocalNodeHealth(system: any): number {
  const cpu = system.cpu_percent ?? 0;
  const ramUsed = system.ram_used ?? 0;
  const ramTotal = system.ram_total ?? 0;
  const uptime = system.uptime ?? 0;

  const cpuScore =
    cpu < 50 ? 1 :
    cpu < 75 ? 0.7 : 0.4;

  const ramPct =
    ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;

  const ramScore =
    ramPct < 70 ? 1 :
    ramPct < 85 ? 0.7 : 0.4;

  const uptimeScore =
    uptime > 86400 ? 1 :
    uptime > 3600 ? 0.7 : 0.4;

  const health =
    cpuScore * 0.3 +
    ramScore * 0.3 +
    uptimeScore * 0.4;

  return Math.round(health * 100);
}

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const stats = await callPRPCWithFallback("get-stats");
    
    const system = stats ?? {};

    const ramUsed = system.ram_used ?? 0;
    const ramTotal = system.ram_total ?? 0;

    const ramUsagePercent =
      ramTotal > 0
        ? Math.round((ramUsed / ramTotal) * 100)
        : 0;

    const healthScore = computeLocalNodeHealth(system);

    return NextResponse.json({
      scope: "local-pnode",

      storage: {
        fileSizeBytes: system.file_size ?? 0,
        totalBytesProcessed: system.total_bytes ?? 0,
        totalPages: system.total_pages ?? 0,
        lastUpdated: system.last_updated ?? null,
      },

      system: {
        cpuPercent: system.cpu_percent ?? null,
        ramUsedBytes: ramUsed,
        ramTotalBytes: ramTotal,
        ramUsagePercent,
        uptimeSeconds: system.uptime ?? null,
        activeStreams: system.active_streams ?? null,
        packetsReceived: system.packets_received ?? null,
        packetsSent: system.packets_sent ?? null,
      },

      health: {
        score: healthScore,
        status:
          healthScore >= 80
            ? "healthy"
            : healthScore >= 50
            ? "degraded"
            : "unhealthy",
      },

      timestamp: now,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
