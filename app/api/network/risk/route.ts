import { NextResponse } from "next/server";
import { callPRPCWithFallback } from "@/app/lib/prpc/client";

type RiskLevel = "low" | "medium" | "high";

function classifyRisk(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);

    const podsResponse = await callPRPCWithFallback("get-pods");
    const pods = podsResponse?.pods ?? [];

    const totalNodes = pods.length;
    const nowTs = Math.floor(Date.now() / 1000);

    let active = 0;
    let inactive = 0;
    let outdated = 0;

    const versionCount: Record<string, number> = {};

    for (const pod of pods) {
      const lastSeen = pod.last_seen_timestamp ?? 0;
      const version = pod.version ?? "unknown";

      versionCount[version] = (versionCount[version] || 0) + 1;

      if (nowTs - lastSeen < 300) {
        active++;
      } else {
        inactive++;
      }
    }

    const versions = Object.entries(versionCount).sort(
      (a, b) => b[1] - a[1]
    );

    const majorityVersion = versions[0]?.[0] ?? "unknown";

    outdated = versions
      .filter(([v]) => v !== majorityVersion)
      .reduce((sum, [, count]) => sum + count, 0);

    const inactivePct =
      totalNodes > 0 ? (inactive / totalNodes) * 100 : 0;

    const outdatedPct =
      totalNodes > 0 ? (outdated / totalNodes) * 100 : 0;

    let riskScore = 100;

    if (inactivePct > 20) riskScore -= 25;
    else if (inactivePct > 10) riskScore -= 15;

    if (outdatedPct > 25) riskScore -= 25;
    else if (outdatedPct > 10) riskScore -= 15;

    riskScore = Math.max(0, riskScore);

    const riskLevel = classifyRisk(riskScore);

    const reasons: string[] = [];

    if (inactivePct > 10) {
      reasons.push(`${inactivePct.toFixed(1)}% of nodes are inactive`);
    }

    if (outdatedPct > 10) {
      reasons.push(
        `${outdatedPct.toFixed(1)}% of nodes are running non-majority versions`
      );
    }

    if (reasons.length === 0) {
      reasons.push("No significant risk factors detected");
    }

    const recommendations: string[] = [];

    if (inactivePct > 10) {
      recommendations.push(
        "Investigate nodes inactive for more than 5 minutes"
      );
    }

    if (outdatedPct > 10) {
      recommendations.push(
        `Encourage upgrade to majority version (${majorityVersion})`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("No immediate action required");
    }

    return NextResponse.json({
      scope: "network",
      risk: {
        level: riskLevel,
        score: riskScore,
      },
      metrics: {
        totalNodes,
        activeNodes: active,
        inactiveNodes: inactive,
        inactivePercentage: Math.round(inactivePct),
        outdatedNodes: outdated,
        outdatedPercentage: Math.round(outdatedPct),
        majorityVersion,
      },
      reasons,
      recommendations,
      timestamp: now,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to compute network risk" },
      { status: 500 }
    );
  }
}
