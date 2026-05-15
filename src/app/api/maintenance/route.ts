import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceRequestSchema } from "@/lib/zod";
import { ZodError } from "zod";
import { applyRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

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
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const propertyId = searchParams.get("propertyId");
    const unitId = searchParams.get("unitId");

       const requests = await prisma.maintenanceRequest.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(propertyId && { propertyId }),
        ...(unitId && { unitId }),
      },
      include: {
        tenant: true,
        unit: true,
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Maintenance GET error:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance requests" }, { status: 500 });
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
    const validated = maintenanceRequestSchema.parse(body);
    // Sanitize text inputs
    if (validated.title) validated.title = sanitizeString(validated.title);
    if (validated.description) validated.description = sanitizeString(validated.description);

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { id: validated.propertyId, landlordId: session.user.id },
    });
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    const request = await prisma.maintenanceRequest.create({
      data: {
        ...validated,
               ...((validated as any).vendorId && { vendorId: (validated as any).vendorId }),
                ...((validated as any).assignedTo && { assignedTo: (validated as any).assignedTo }),
      },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        unit: { select: { unitNumber: true } },
      },
    });

    // Create notification for landlord
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "MAINTENANCE_UPDATE",
        title: "New Maintenance Request",
        message: `${request.title} - ${request.unit.unitNumber}`,
        actionUrl: `/maintenance/${request.id}`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        propertyId: validated.propertyId,
        action: "MAINTENANCE_CREATED",
        entityType: "MaintenanceRequest",
        entityId: request.id,
        details: { title: request.title, category: request.category, priority: request.priority },
      },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Maintenance POST error:", error);
    return NextResponse.json({ error: "Failed to create maintenance request" }, { status: 500 });
  }
}
