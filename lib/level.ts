import type { Tier } from "@/lib/data/types";

// A viewer's tier from their reputation with a streamer. $1 donated = 1 reputation
// (front.md I §4); tiers are thresholds on that same number, named and colored by the streamer.
export function tierInfo(reputation: number, tiers: Tier[]) {
  // Tolerate a profile with no tiers (e.g. saved before tiers existed) instead of throwing.
  if (!Array.isArray(tiers) || tiers.length === 0) return { current: null, next: null };
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  let current: Tier | null = null;
  for (const t of sorted) if (reputation >= t.threshold) current = t;
  const next = sorted.find((t) => t.threshold > reputation) ?? null;
  return { current, next };
}
