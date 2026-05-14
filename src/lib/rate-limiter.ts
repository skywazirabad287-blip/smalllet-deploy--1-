import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter
// For production, replace with Redis (e.g., @upstash/ratelimit)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs?: number;    // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  keyPrefix?: string;   // Prefix for the key
}

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const {
    windowMs = 60 * 1000,      // 1 minute default
    maxRequests = 100,          // 100 requests per minute default
    keyPrefix = "api",
  } = config;

  // Get client IP
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const key = `${keyPrefix}:${ip}:${req.nextUrl.pathname}`;

  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  entry.count++;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

// Stricter rate limits for auth endpoints
export async function authRateLimit(req: NextRequest) {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,           // 10 attempts per 15 min
    keyPrefix: "auth",
  });
}

// Rate limit for Stripe webhooks (should be generous)
export async function webhookRateLimit(req: NextRequest) {
  return rateLimit(req, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,    // Stripe can send many webhooks
    keyPrefix: "webhook",
  });
}
