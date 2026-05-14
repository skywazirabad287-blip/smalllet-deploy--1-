import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantSchema } from "@/lib/zod";
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
    const search = searchParams.get("search");
    const hasActiveLease = searchParams.get("hasActiveLease");

    const tenants = await prisma.tenant.findMany({
      where: {
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(hasActiveLease === "true" && {
          leases: { some: { status: "ACTIVE" } },
        }),
        leases: {
          some: {
            unit: {
              property: { landlordId: session.user.id },
            },
          },
        },
      },
      include: {
        leases: {
          where: { status: "ACTIVE" },
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true, address: true } },
              },
            },
          },
        },
        _count: {
          select: { payments: true, maintenanceRequests: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Tenants GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
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
    const validated = tenantSchema.parse(body);
    // Sanitize text inputs
    if (validated.firstName) validated.firstName = sanitizeString(validated.firstName);
    if (validated.lastName) validated.lastName = sanitizeString(validated.lastName);
    if (validated.notes) validated.notes = sanitizeString(validated.notes);
    if (validated.emergencyName) validated.emergencyName = sanitizeString(validated.emergencyName);
    if (validated.emergencyRelation) validated.emergencyRelation = sanitizeString(validated.emergencyRelation);

    const tenant = await prisma.tenant.create({
      data: validated,
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "TENANT_CREATED",
        entityType: "Tenant",
        entityId: tenant.id,
        details: { name: `${tenant.firstName} ${tenant.lastName}`, email: tenant.email },
      },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Tenants POST error:", error);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
