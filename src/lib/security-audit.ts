import { NextRequest } from "next/server";

/**
 * Security audit helper
 * Run this to verify security configuration
 */
export function runSecurityAudit() {
  const checks = [
    {
      name: "NEXTAUTH_SECRET",
      check: () => process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
      critical: true,
    },
    {
      name: "NODE_ENV",
      check: () => process.env.NODE_ENV === "production",
      critical: false,
    },
    {
      name: "HTTPS (NEXTAUTH_URL)",
      check: () => process.env.NEXTAUTH_URL?.startsWith("https://"),
      critical: true,
    },
    {
      name: "Database URL (SSL)",
      check: () => process.env.DATABASE_URL?.includes("sslmode=require") || process.env.DATABASE_URL?.includes("ssl=true"),
      critical: false,
    },
    {
      name: "Stripe Secret Key",
      check: () => !!process.env.STRIPE_SECRET_KEY,
      critical: false,
    },
    {
      name: "Stripe Webhook Secret",
      check: () => !!process.env.STRIPE_WEBHOOK_SECRET,
      critical: false,
    },
  ];

  const results = checks.map((c) => ({
    ...c,
    passed: c.check(),
  }));

  const criticalFailures = results.filter((r) => r.critical && !r.passed);
  const warnings = results.filter((r) => !r.critical && !r.passed);

  return {
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    criticalFailures,
    warnings,
    all: results,
  };
}

/**
 * Validate request origin
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    "https://smalllet.app",
    "https://www.smalllet.app",
  ].filter(Boolean);

  if (!origin) return true; // Same-origin request
  return allowedOrigins.includes(origin);
}

/**
 * Check for suspicious request patterns
 */
export function detectSuspiciousActivity(req: NextRequest): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const userAgent = req.headers.get("user-agent") || "";

  // Check for common bot signatures
  const botPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /gobuster/i,
    /dirbuster/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Bot signature detected: ${pattern.source}`);
    }
  }

  // Check for missing user agent
  if (!userAgent || userAgent.length < 10) {
    reasons.push("Missing or suspicious User-Agent");
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}
