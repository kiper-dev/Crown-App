import type { NextRequest } from "next/server";

// In-memory token bucket per (client IP, bucket name). Right-sized for the
// single-process deployment this app targets — with several instances move
// the counters into the DB or a shared cache, the call sites won't change.

interface Bucket {
  tokens: number;
  last: number;
}

const buckets = new Map<string, Bucket>();
const MAX_ENTRIES = 10_000; // hard cap so a spray of IPs can't balloon memory

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/**
 * true → allowed. `ratePerMin` refills continuously up to `burst`.
 * Mutating routes get tight budgets; reads get loose ones.
 */
export function allow(req: NextRequest, name: string, ratePerMin: number, burst = ratePerMin): boolean {
  if (buckets.size > MAX_ENTRIES) buckets.clear();
  const key = `${name}:${clientIp(req)}`;
  const nowMs = Date.now();
  const b = buckets.get(key) ?? { tokens: burst, last: nowMs };
  b.tokens = Math.min(burst, b.tokens + ((nowMs - b.last) / 60_000) * ratePerMin);
  b.last = nowMs;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}
