import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/zod";
import { applyRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    // Apply strict rate limiting for signup
    const rateLimitResponse = await applyRateLimit(req, {
      windowMs: 60 * 60 * 1000,  // 1 hour
      maxRequests: 3,             // 3 signups per hour per IP
      keyPrefix: "signup",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();

    // Sanitize inputs
    if (body.name) body.name = sanitizeString(body.name);
    if (body.email) body.email = body.email.toLowerCase().trim();

    const validated = signUpSchema.parse(body);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      // Return generic error to prevent user enumeration
      return NextResponse.json(
        { error: "Unable to create account. Please try again." },
        { status: 400 }
      );
    }

    // Strong password hashing
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: "LANDLORD",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Create default settings
    await prisma.landlordSettings.create({
      data: {
        landlordId: user.id,
      },
    });

    // Log signup (without sensitive data)
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        entityType: "User",
        entityId: user.id,
        details: { method: "credentials" },
      },
    });

    return NextResponse.json(
      { user, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);

    // Don't expose internal errors
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
