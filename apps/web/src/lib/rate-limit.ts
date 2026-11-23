/**
 * @file apps/web/src/lib/rate-limit.ts
 * @description Sliding-window IP rate limiter with optional Upstash Redis REST backend
 * and bounded in-memory fallback for single-instance/local environments.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
}

interface MemoryBucket {
  timestamps: number[];
  lastSeenMs: number;
}

const MAX_MEMORY_BUCKETS = 5_000;
const memoryStore = new Map<string, MemoryBucket>();

/**
 * Extracts a normalized client IP address from standard proxy headers.
 */
export function getClientIp(req?: Request): string {
  if (!req) return "unknown";

  const cfConnectingIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const firstIp = vercelForwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return "unknown";
}

function evictStaleMemoryBuckets(nowMs: number, windowMs: number) {
  if (memoryStore.size < MAX_MEMORY_BUCKETS) return;

  for (const [key, bucket] of memoryStore.entries()) {
    if (nowMs - bucket.lastSeenMs > windowMs) {
      memoryStore.delete(key);
    }
  }

  // If still above cap after removing expired entries, trim oldest entries FIFO.
  if (memoryStore.size >= MAX_MEMORY_BUCKETS) {
    const excess = memoryStore.size - Math.floor(MAX_MEMORY_BUCKETS * 0.8);
    let removed = 0;
    for (const key of memoryStore.keys()) {
      memoryStore.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }
}

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const nowMs = Date.now();
  const cutoffMs = nowMs - windowMs;

  evictStaleMemoryBuckets(nowMs, windowMs);

  const existing = memoryStore.get(key);
  const recent = existing
    ? existing.timestamps.filter((ts) => ts > cutoffMs)
    : [];

  if (recent.length >= limit) {
    const oldestActive = recent[0] ?? nowMs;
    memoryStore.set(key, { timestamps: recent, lastSeenMs: nowMs });
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAtMs: oldestActive + windowMs,
    };
  }

  recent.push(nowMs);
  memoryStore.set(key, { timestamps: recent, lastSeenMs: nowMs });

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - recent.length),
    resetAtMs: (recent[0] ?? nowMs) + windowMs,
  };
}

/**
 * Checks whether a caller identified by `key` is within `limit` requests per `windowMs`.
 * Uses Upstash Redis REST pipeline when configured, falling back safely to local memory.
 */
export async function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const { limit, windowMs } = options;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (redisUrl && redisToken) {
    try {
      const redisKey = `sika:ratelimit:${key}`;
      const nowMs = Date.now();
      const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

      const response = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSeconds, "NX"],
          ["PTTL", redisKey],
        ]),
        cache: "no-store",
      });

      if (response.ok) {
        const results = (await response.json()) as Array<{ result?: number }>;
        const count = Number(results?.[0]?.result ?? 1);
        const pttl = Number(results?.[2]?.result ?? windowMs);
        const ttlMs = pttl > 0 ? pttl : windowMs;

        return {
          allowed: count <= limit,
          limit,
          remaining: Math.max(0, limit - count),
          resetAtMs: nowMs + ttlMs,
        };
      }
    } catch (error) {
      console.warn("[RateLimit] Redis check failed, falling back to memory:", error);
    }
  }

  return checkMemoryRateLimit(key, limit, windowMs);
}
