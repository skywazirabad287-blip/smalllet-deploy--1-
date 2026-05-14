import { NextRequest, NextResponse } from "next/server";

/**
 * Security headers for all responses
 */
export const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // XSS Protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions Policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  // Strict Transport Security (HTTPS only)
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.googleusercontent.com https://utfs.io",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://uploadthing.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

/**
 * CORS configuration
 */
export const corsConfig = {
  allowedOrigins: [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
    "https://smalllet.app",
    "https://www.smalllet.app",
  ],
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Stripe-Signature",
  ],
  maxAge: 86400, // 24 hours
};

/**
 * Apply CORS headers to response
 */
export function applyCORS(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");

  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  res.headers.set("Access-Control-Allow-Methods", corsConfig.allowedMethods.join(", "));
  res.headers.set("Access-Control-Allow-Headers", corsConfig.allowedHeaders.join(", "));
  res.headers.set("Access-Control-Max-Age", corsConfig.maxAge.toString());
  res.headers.set("Access-Control-Allow-Credentials", "true");

  return res;
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(res: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

/**
 * Handle CORS preflight
 */
export function handleCORS(req: NextRequest): NextResponse | null {
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    return applyCORS(req, res);
  }
  return null;
}
