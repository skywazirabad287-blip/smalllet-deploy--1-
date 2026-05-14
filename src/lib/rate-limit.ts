import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs?: number;     // Time window in milliseconds
  maxRequests?: number;  // Max requests per window
  keyPrefix?: string;    // Prefix for the key
}

const DEFAULT_OPTIONS: Required<RateLimitOptions> = {
  windowMs: 60 * 1000,   // 1 minute
  maxRequests: 100,      // 100 requests per minute
  keyPrefix: "rl",
};

/**
 * Rate limiter middleware
 * Usage: await rateLimit(req, { windowMs: 60000, maxRequests: 10 })
 */
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get client IP (handle proxies)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip || "unknown";

  const key = `${opts.keyPrefix}:${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + opts.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      success: true,
      limit: opts.maxRequests,
      remaining: opts.maxRequests - 1,
      reset: newEntry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;

  const remaining = Math.max(0, opts.maxRequests - entry.count);
  const success = entry.count <= opts.maxRequests;

  return {
    success,
    limit: opts.maxRequests,
    remaining,
    reset: entry.resetTime,
  };
}

/**
 * Strict rate limiter for auth endpoints
 */
export async function authRateLimit(req: NextRequest): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,             // 5 attempts per 15 min
    keyPrefix: "auth",
  });
}

/**
 * API rate limiter for general endpoints
 */
export async function apiRateLimit(req: NextRequest): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  return rateLimit(req, {
    windowMs: 60 * 1000,   // 1 minute
    maxRequests: 60,       // 60 requests per minute
    keyPrefix: "api",
  });
}

/**
 * Stripe webhook rate limiter
 */
export async function webhookRateLimit(req: NextRequest): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  return rateLimit(req, {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: "wh",
  });
}

/**
 * Helper to apply rate limit and return 429 if exceeded
 */
export async function applyRateLimit(
  req: NextRequest,
  options?: RateLimitOptions
): Promise<NextResponse | null> {
  const result = await rateLimit(req, options);

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}
