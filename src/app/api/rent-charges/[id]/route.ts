import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ZodError, z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PARTIAL", "OVERDUE", "WAIVED"]).optional(),
  paidAmount: z.number().min(0).optional(),
  lateFeeAmount: z.number().min(0).optional(),
  lateFeeApplied: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const charge = await prisma.rentCharge.findFirst({
      where: {
        id: params.id,
        lease: { unit: { property: { landlordId: session.user.id } } },
      },
      include: {
        lease: {
          include: {
            tenant: { select: { firstName: true, lastName: true } },
            unit: { include: { property: { select: { name: true } } } },
          },
        },
        payments: true,
      },
    });

    if (!charge) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ charge });
  } catch (error) {
    console.error("Rent charge GET error:", error);
    return NextResponse.json({ error: "Failed to fetch rent charge" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const charge = await prisma.rentCharge.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json({ charge });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Rent charge PATCH error:", error);
    return NextResponse.json({ error: "Failed to update rent charge" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.rentCharge.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rent charge DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete rent charge" }, { status: 500 });
  }
}
