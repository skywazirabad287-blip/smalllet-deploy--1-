import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { applySecurityHeaders, handleCORS } from "@/lib/security";

// Public paths that don't require auth
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/error",
  "/api/auth",
  "/api/webhooks/stripe",
  "/api/uploadthing",
];

// Rate limited paths
const rateLimitedPaths = [
  "/api/auth/signup",
  "/api/auth/callback/credentials",
];

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Handle CORS preflight
    const corsResponse = handleCORS(req);
    if (corsResponse) return corsResponse;

    // Apply rate limiting to auth endpoints
    if (rateLimitedPaths.some((path) => pathname.startsWith(path))) {
      const rateLimitResponse = await applyRateLimit(req, {
        windowMs: 15 * 60 * 1000,  // 15 minutes
        maxRequests: 5,             // 5 attempts
        keyPrefix: "auth",
      });
      if (rateLimitResponse) return rateLimitResponse;
    }

    // Apply general API rate limiting
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks/")) {
      const rateLimitResponse = await applyRateLimit(req, {
        windowMs: 60 * 1000,   // 1 minute
        maxRequests: 60,       // 60 requests per minute
        keyPrefix: "api",
      });
      if (rateLimitResponse) return rateLimitResponse;
    }

    // Continue with auth check
    const response = NextResponse.next();

    // Apply security headers
    applySecurityHeaders(response);

    return response;
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;

        // Allow public paths
        if (publicPaths.some((path) => pathname.startsWith(path))) {
          return true;
        }

        // Allow webhook endpoints
        if (pathname.startsWith("/api/webhooks/")) {
          return true;
        }

        // Allow uploadthing
        if (pathname.startsWith("/api/uploadthing")) {
          return true;
        }

        // Require auth for everything else
        return token !== null;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.png$|.*\.jpg$|.*\.svg$).*)",
  ],
};
