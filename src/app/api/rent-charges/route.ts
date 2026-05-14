import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ZodError, z } from "zod";

const rentChargeUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PARTIAL", "OVERDUE", "WAIVED"]).optional(),
  paidAmount: z.number().min(0).optional(),
  lateFeeAmount: z.number().min(0).optional(),
  lateFeeApplied: z.boolean().optional(),
});

// GET /api/rent-charges - List rent charges with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const leaseId = searchParams.get("leaseId");
    const status = searchParams.get("status");
    const overdue = searchParams.get("overdue") === "true";
    const upcoming = searchParams.get("upcoming") === "true";

    const now = new Date();

    const charges = await prisma.rentCharge.findMany({
      where: {
        lease: {
          unit: { property: { landlordId: session.user.id } },
        },
        ...(leaseId && { leaseId }),
        ...(status && { status: status as any }),
        ...(overdue && { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] }, dueDate: { lt: now } }),
        ...(upcoming && { dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }),
      },
      include: {
        lease: {
          include: {
            tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
        },
        payments: {
          where: { status: "COMPLETED" },
          select: { id: true, amount: true, processedAt: true },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    return NextResponse.json({ charges });
  } catch (error) {
    console.error("Rent charges GET error:", error);
    return NextResponse.json({ error: "Failed to fetch rent charges" }, { status: 500 });
  }
}

// POST /api/rent-charges - Create manual rent charge
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Verify lease ownership
    const lease = await prisma.lease.findFirst({
      where: {
        id: body.leaseId,
        unit: { property: { landlordId: session.user.id } },
      },
    });

    if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });

    const charge = await prisma.rentCharge.create({
      data: {
        leaseId: body.leaseId,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        description: body.description || "Manual charge",
        status: "PENDING",
      },
    });

    return NextResponse.json({ charge }, { status: 201 });
  } catch (error) {
    console.error("Rent charges POST error:", error);
    return NextResponse.json({ error: "Failed to create rent charge" }, { status: 500 });
  }
}
