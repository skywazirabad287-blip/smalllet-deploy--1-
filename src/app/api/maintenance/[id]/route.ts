import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ZodError, z } from "zod";

const updateSchema = z.object({
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "CANCELLED", "REOPENED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  vendorId: z.string().optional(),
  assignedTo: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  scheduledDate: z.string().datetime().optional(),
  resolution: z.string().optional(),
  completedAt: z.string().datetime().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const request = await prisma.maintenanceRequest.findFirst({
           where: {
        id: params.id,
      },
      include: {
        tenant: { select: { firstName: true, lastName: true, email: true, phone: true } },
        unit: {
          include: {
            property: { select: { id: true, name: true, address: true } },
          },
        },
        vendor: { select: { id: true, name: true, company: true, phone: true, email: true } },
               comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Maintenance GET error:", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
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

    // Verify ownership
    const existing = await prisma.maintenanceRequest.findFirst({
      where: { id: params.id, property: { landlordId: session.user.id } },
    });

    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const updateData: any = { ...validated };
    if (validated.scheduledDate) updateData.scheduledDate = new Date(validated.scheduledDate);
    if (validated.completedAt) updateData.completedAt = new Date(validated.completedAt);

    const request = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        vendor: { select: { name: true, company: true } },
        unit: { include: { property: { select: { name: true } } } },
      },
    });

    // Create notification if status changed
    if (validated.status && validated.status !== existing.status) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          propertyId: existing.propertyId,
          action: `MAINTENANCE_${validated.status}`,
          entityType: "MaintenanceRequest",
          entityId: params.id,
          details: { 
            oldStatus: existing.status, 
            newStatus: validated.status,
            vendorId: validated.vendorId,
          },
        },
      });

      // Notify tenant if assigned
      if (existing.tenantId && validated.status === "IN_PROGRESS") {
        await prisma.notification.create({
          data: {
            userId: existing.tenantId,
            type: "MAINTENANCE_UPDATE",
            title: "Maintenance Update",
            message: `Your request "${existing.title}" is now in progress${request.vendor ? ` with ${request.vendor.name}` : ""}.`,
          },
        });
      }
    }

    return NextResponse.json({ request });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Maintenance PATCH error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.maintenanceRequest.findFirst({
      where: { id: params.id, property: { landlordId: session.user.id } },
    });

    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    await prisma.maintenanceRequest.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Maintenance DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
