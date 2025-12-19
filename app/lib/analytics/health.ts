import { ACTIVE_THRESHOLD_SECONDS } from "@/app/lib/prpc/constants";

export function freshnessScore(secondsAgo: number): number {
  if (secondsAgo <= ACTIVE_THRESHOLD_SECONDS) return 1.0;
  if (secondsAgo <= ACTIVE_THRESHOLD_SECONDS * 2) return 0.7;
  if (secondsAgo <= ACTIVE_THRESHOLD_SECONDS * 5) return 0.4;
  return 0.1;
}

export function versionScore(
  nodeVersion: string,
  latestVersion?: string
): number {
  if (!latestVersion) return 1.0;
  return nodeVersion === latestVersion ? 1.0 : 0.6;
}

export function computeNodeHealth(
  secondsAgo: number,
  nodeVersion: string,
  latestVersion?: string
): number {
  const health =
    freshnessScore(secondsAgo) * 0.7 +
    versionScore(nodeVersion, latestVersion) * 0.3;

  return Math.round(health * 100);
}
