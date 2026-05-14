import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unitSchema } from "@/lib/zod";
import { ZodError } from "zod";

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
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");

    const units = await prisma.unit.findMany({
      where: {
        ...(propertyId && { propertyId }),
        ...(status && { status: status as any }),
        property: { landlordId: session.user.id },
        deletedAt: null,
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        leases: {
          where: { status: "ACTIVE" },
          include: { tenant: true },
        },
        _count: { select: { maintenanceRequests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Units GET error:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

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
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = unitSchema.parse(body);

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { id: validated.propertyId, landlordId: session.user.id },
    });
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    const unit = await prisma.unit.create({
      data: validated,
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        propertyId: validated.propertyId,
        action: "UNIT_CREATED",
        entityType: "Unit",
        entityId: unit.id,
        details: { unitNumber: unit.unitNumber, rentAmount: unit.rentAmount },
      },
    });

    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Units POST error:", error);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
