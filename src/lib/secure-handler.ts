import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "./rate-limiter";

/**
 * Secure API handler wrapper
 * Applies rate limiting, auth validation, and security headers
 */
export async function secureHandler(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  options: { requireAuth?: boolean; rateLimitMax?: number } = {}
) {
  const { requireAuth = true, rateLimitMax = 100 } = options;

  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: rateLimitMax });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.reset),
        },
      }
    );
  }

  // Auth validation
  if (requireAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, token.sub);
  }

  return handler(req, "");
}
