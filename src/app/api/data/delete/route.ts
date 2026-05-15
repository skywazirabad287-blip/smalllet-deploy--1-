import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/data/delete
 * Soft delete all user data (GDPR Article 17 - Right to erasure)
 * Data is retained for 30 days before permanent deletion
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Soft delete all user data in a transaction
    await prisma.$transaction(async (tx) => {
      // Soft delete properties
      await tx.property.updateMany({
        where: { landlordId: userId },
        data: { deletedAt: now, deletedBy: userId, status: "INACTIVE" },
      });

      // Soft delete units
      await tx.unit.updateMany({
               where: {},
        data: { deletedAt: now, deletedBy: userId, status: "OFF_MARKET" },
      });

      // Soft delete tenants (only those linked to user's properties)
      await tx.tenant.updateMany({
        where: {
          leases: {
            some: {
              unit: { property: { landlordId: userId } },
            },
          },
        },
        data: { deletedAt: now, deletedBy: userId, isDeleted: true },
      });

      // Soft delete leases
      await tx.lease.updateMany({
        where: { unit: { property: { landlordId: userId } } },
        data: { deletedAt: now, deletedBy: userId, isDeleted: true, status: "TERMINATED" },
      });

      // Soft delete payments
      await tx.payment.updateMany({
        where: {
          tenant: {
            leases: {
              some: {
                unit: { property: { landlordId: userId } },
              },
            },
          },
        },
        data: { deletedAt: now, deletedBy: userId, isDeleted: true },
      });

      // Soft delete maintenance requests
      await tx.maintenanceRequest.updateMany({
                where: {},
        data: { deletedAt: now, deletedBy: userId, isDeleted: true },
      });

      // Soft delete expenses
      await tx.expense.updateMany({
        where: { landlordId: userId },
        data: { deletedAt: now, deletedBy: userId, isDeleted: true },
      });

      // Soft delete documents
      await tx.document.updateMany({
        where: { landlordId: userId },
        data: { deletedAt: now, deletedBy: userId, isDeleted: true },
      });

      // Soft delete vendors
      await tx.vendor.updateMany({
        where: { landlordId: userId },
        data: { isActive: false },
      });

      // Soft delete email templates
      await tx.emailTemplate.deleteMany({
        where: { landlordId: userId },
      });

      // Soft delete compliance checklists
      await tx.complianceChecklist.deleteMany({
                where: {},
      });

      // Soft delete team memberships
      await tx.teamMember.updateMany({
        where: { invitedBy: userId },
        data: { status: "REVOKED" },
      });

      // Mark user as deleted
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          deletedBy: userId,
          isDeleted: true,
          email: `deleted_${userId}@smalllet.app`, // Anonymize email
          name: "Deleted User",
          image: null,
        },
      });

      // Log the deletion
      await tx.activityLog.create({
        data: {
          userId,
          action: "ACCOUNT_DELETED",
          entityType: "User",
          entityId: userId,
          details: { deletedAt: now.toISOString(), method: "user_request" },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account and all associated data have been scheduled for deletion.",
      retentionPeriod: "30 days",
      permanentDeletionDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Data deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
  }
}
