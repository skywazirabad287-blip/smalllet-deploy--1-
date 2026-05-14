import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/zod";
import { ZodError } from "zod";
import { applyRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

// GET /api/properties - List all properties for the landlord
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 100 });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Limit": String(rateLimitResult.limit), "X-RateLimit-Remaining": String(rateLimitResult.remaining), "X-RateLimit-Reset": String(rateLimitResult.reset) } }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const includeUnits = searchParams.get("includeUnits") === "true";

    const properties = await prisma.property.findMany({
      where: {
        landlordId: session.user.id,
        deletedAt: null,
        ...(status && { status: status as any }),
      },
      include: {
        units: includeUnits,
        _count: {
          select: { units: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Properties GET error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

// POST /api/properties - Create a new property
export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 100 });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Limit": String(rateLimitResult.limit), "X-RateLimit-Remaining": String(rateLimitResult.remaining), "X-RateLimit-Reset": String(rateLimitResult.reset) } }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = propertySchema.parse(body);
    // Sanitize text inputs
    if (validated.name) validated.name = sanitizeString(validated.name);
    if (validated.description) validated.description = sanitizeString(validated.description);
    if (validated.address) validated.address = sanitizeString(validated.address);
    if (validated.city) validated.city = sanitizeString(validated.city);
    if (validated.state) validated.state = sanitizeString(validated.state);

    const property = await prisma.property.create({
      data: {
        ...validated,
        landlordId: session.user.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        propertyId: property.id,
        action: "PROPERTY_CREATED",
        entityType: "Property",
        entityId: property.id,
        details: { name: property.name, address: property.address },
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Properties POST error:", error);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
