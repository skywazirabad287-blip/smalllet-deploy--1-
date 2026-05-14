import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leaseSchema } from "@/lib/zod";
import { ZodError } from "zod";
import { applyRateLimit } from "@/lib/rate-limit";
import { addDays, addMonths, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 50 });
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
    const expiringSoon = searchParams.get("expiringSoon") === "true";

    const where: any = {
      unit: { property: { landlordId: session.user.id } },
        isDeleted: false,
      ...(status && { status: status as any }),
    };

    if (expiringSoon) {
      const thirtyDaysFromNow = addDays(new Date(), 30);
      where.endDate = { lte: thirtyDaysFromNow, gte: new Date() };
      where.status = "ACTIVE";
    }

    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: true,
        unit: {
          include: {
            property: { select: { id: true, name: true, address: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        rentCharges: {
          orderBy: { dueDate: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leases });
  } catch (error) {
    console.error("Leases GET error:", error);
    return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 50 });
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
    const validated = leaseSchema.parse(body);

    // Verify unit ownership
    const unit = await prisma.unit.findFirst({
      where: { id: validated.unitId, property: { landlordId: session.user.id } },
    });
    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    // Check unit is vacant
    if (unit.status !== "VACANT") {
      return NextResponse.json({ error: "Unit is not vacant" }, { status: 400 });
    }

    const lease = await prisma.$transaction(async (tx) => {
      const newLease = await tx.lease.create({
        data: {
          ...validated,
          startDate: new Date(validated.startDate),
          endDate: new Date(validated.endDate),
        },
      });

      // Update unit status
      await tx.unit.update({
        where: { id: validated.unitId },
        data: { status: "OCCUPIED" },
      });

      // Generate rent charges
      const charges = [];
      let currentDate = startOfDay(new Date(validated.startDate));
      const endDate = startOfDay(new Date(validated.endDate));

      while (currentDate <= endDate) {
        charges.push({
          leaseId: newLease.id,
          amount: validated.rentAmount,
          dueDate: addDays(currentDate, validated.gracePeriodDays),
          description: `Rent for ${currentDate.toLocaleString("default", { month: "long", year: "numeric" })}`,
        });
        currentDate = addMonths(currentDate, 1);
      }

      if (charges.length > 0) {
        await tx.rentCharge.createMany({ data: charges });
      }

      return newLease;
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        propertyId: validated.propertyId,
        action: "LEASE_CREATED",
        entityType: "Lease",
        entityId: lease.id,
        details: { tenantId: validated.tenantId, unitId: validated.unitId, rentAmount: validated.rentAmount },
      },
    });

    return NextResponse.json({ lease }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Leases POST error:", error);
    return NextResponse.json({ error: "Failed to create lease" }, { status: 500 });
  }
}
