import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/data/restore
 * Restore soft-deleted data within retention period
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { entityType, entityId, restoreAll = false } = body;

    if (restoreAll) {
      // Restore all user data
      await prisma.$transaction(async (tx) => {
        // Restore user
        await tx.user.update({
          where: { id: userId },
          data: { deletedAt: null, deletedBy: null, isDeleted: false },
        });

        // Restore properties
        await tx.property.updateMany({
          where: { landlordId: userId, deletedAt: { not: null } },
          data: { deletedAt: null, deletedBy: null, status: "ACTIVE" },
        });

        // Restore units
        await tx.unit.updateMany({
          where: { property: { landlordId: userId }, deletedAt: { not: null } },
          data: { deletedAt: null, deletedBy: null },
        });

        // Restore tenants
        await tx.tenant.updateMany({
          where: { deletedAt: { not: null }, isDeleted: true },
          data: { deletedAt: null, deletedBy: null, isDeleted: false },
        });

        // Restore leases
        await tx.lease.updateMany({
          where: { deletedAt: { not: null }, isDeleted: true },
          data: { deletedAt: null, deletedBy: null, isDeleted: false, status: "ACTIVE" },
        });

        // Restore payments
        await tx.payment.updateMany({
          where: { deletedAt: { not: null }, isDeleted: true },
          data: { deletedAt: null, deletedBy: null, isDeleted: false },
        });

        // Restore maintenance
        await tx.maintenanceRequest.updateMany({
          where: { deletedAt: { not: null }, isDeleted: true },
          data: { deletedAt: null, deletedBy: null, isDeleted: false },
        });

        // Restore expenses
        await tx.expense.updateMany({
          where: { landlordId: userId, deletedAt: { not: null }, isDeleted: true },
          data: { deletedAt: null, deletedBy: null, isDeleted: false },
        });

        // Restore documents
        await tx.document.updateMany({
          where: { landlordId: userId, deletedAt: { not: null }, isDeleted: true },
          data: { deletedAt: null, deletedBy: null, isDeleted: false },
        });

        // Restore vendors
        await tx.vendor.updateMany({
          where: { landlordId: userId, isActive: false },
          data: { isActive: true },
        });

        // Log restoration
        await tx.activityLog.create({
          data: {
            userId,
            action: "DATA_RESTORED",
            entityType: "User",
            entityId: userId,
            details: { restoreAll: true },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "All data restored successfully",
      });
    }

    // Restore specific entity
    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
    }

    const restoreMap: Record<string, any> = {
      property: prisma.property,
      unit: prisma.unit,
      tenant: prisma.tenant,
      lease: prisma.lease,
      payment: prisma.payment,
      maintenance: prisma.maintenanceRequest,
      expense: prisma.expense,
      document: prisma.document,
    };

    const model = restoreMap[entityType];
    if (!model) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    await model.update({
      where: { id: entityId },
      data: { deletedAt: null, deletedBy: null, isDeleted: false },
    });

    // Log restoration
    await prisma.activityLog.create({
      data: {
        userId,
        action: "ENTITY_RESTORED",
        entityType: entityType.toUpperCase(),
        entityId,
        details: { restoredAt: new Date().toISOString() },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${entityType} restored successfully`,
    });
  } catch (error) {
    console.error("Data restore error:", error);
    return NextResponse.json({ error: "Failed to restore data" }, { status: 500 });
  }
}
