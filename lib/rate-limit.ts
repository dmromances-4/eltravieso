type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, RateLimitEntry>();

export type RateLimitOptions = {
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

function cleanupExpired(store: Map<string, RateLimitEntry>, now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function checkMemoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpired(memoryStore, now);

  const existing = memoryStore.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1, retryAfterSec: 0 };
  }

  if (existing.count >= options.max) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  existing.count += 1;
  memoryStore.set(key, existing);
  return {
    allowed: true,
    remaining: options.max - existing.count,
    retryAfterSec: 0,
  };
}

let redisClientPromise: Promise<import("ioredis").default | null> | null = null;

async function getRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClientPromise) {
    redisClientPromise = import("ioredis").then(({ default: IORedis }) => {
      try {
        return new IORedis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
      } catch {
        return null;
      }
    });
  }

  return redisClientPromise;
}

async function checkRedisRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const redisKey = `ratelimit:${key}`;
  const windowSec = Math.ceil(options.windowMs / 1000);

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (count > options.max) {
      const ttl = await redis.ttl(redisKey);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: Math.max(1, ttl),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, options.max - count),
      retryAfterSec: 0,
    };
  } catch {
    return null;
  }
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  return checkMemoryRateLimit(key, options);
}

export async function checkRateLimitAsync(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const redisResult = await checkRedisRateLimit(key, options);
  if (redisResult) return redisResult;
  return checkMemoryRateLimit(key, options);
}

export function rateLimitResponse(retryAfterSec: number, message = "Demasiadas solicitudes. Inténtalo más tarde.") {
  return {
    message,
    status: 429 as const,
    headers: { "Retry-After": String(retryAfterSec) },
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function enforceRateLimit(request: Request, scope: string, options: RateLimitOptions) {
  const ip = getClientIp(request);
  const result = await checkRateLimitAsync(`${scope}:${ip}`, options);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}

export async function enforceUserRateLimit(userId: string, scope: string, options: RateLimitOptions) {
  const result = await checkRateLimitAsync(`${scope}:user:${userId}`, options);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}

export const RATE_LIMITS = {
  register: { max: 5, windowMs: 60 * 60 * 1000 },
  checkout: { max: 10, windowMs: 60 * 1000 },
  recipeSearch: { max: 60, windowMs: 60 * 1000 },
  upload: { max: 10, windowMs: 60 * 60 * 1000 },
  campaignSend: { max: 5, windowMs: 60 * 60 * 1000 },
} as const;

export function getAiAgentRateLimits(isAuthenticated: boolean): RateLimitOptions {
  const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(
    isAuthenticated
      ? (process.env.AI_RATE_LIMIT_AUTH_MAX ?? 30)
      : (process.env.AI_RATE_LIMIT_ANON_MAX ?? 10),
  );
  return { max, windowMs };
}
