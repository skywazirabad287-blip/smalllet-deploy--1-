import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/data/export
 * Export all user data (GDPR Article 20 - Right to data portability)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user data in parallel
    const [
      user,
      properties,
      units,
      tenants,
      leases,
      payments,
      maintenanceRequests,
      expenses,
      documents,
      messages,
      notifications,
      activityLogs,
      teamMembers,
      settings,
      emailTemplates,
      vendors,
      complianceChecklists,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionEndsAt: true,
          onboardingCompleted: true,
        },
      }),
      prisma.property.findMany({
               where: { landlordId: userId },
        include: {
                   units: true,
                   expenses: true,
          documents: { where: { isDeleted: false } },
        },
      }),
      prisma.unit.findMany({
        where: { property: { landlordId: userId }, isDeleted: false },
        include: {
          leases: { where: { isDeleted: false } },
          maintenanceRequests: { where: { isDeleted: false } },
          expenses: { where: { isDeleted: false } },
        },
      }),
      prisma.tenant.findMany({
        where: {
          leases: {
            some: {
              unit: { property: { landlordId: userId } },
            },
          },
          isDeleted: false,
        },
        include: {
          leases: { where: { isDeleted: false } },
          payments: { where: { isDeleted: false } },
          maintenanceRequests: { where: { isDeleted: false } },
          documents: { where: { isDeleted: false } },
        },
      }),
      prisma.lease.findMany({
        where: {
          unit: { property: { landlordId: userId } },
          isDeleted: false,
        },
        include: {
          tenant: true,
          unit: { include: { property: { select: { name: true } } } },
          payments: { where: { isDeleted: false } },
          rentCharges: true,
        },
      }),
      prisma.payment.findMany({
        where: {
          tenant: {
            leases: {
              some: {
                unit: { property: { landlordId: userId } },
              },
            },
          },
          isDeleted: false,
        },
        include: {
          tenant: { select: { firstName: true, lastName: true } },
          lease: { include: { unit: { include: { property: { select: { name: true } } } } } },
        },
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          property: { landlordId: userId },
          isDeleted: false,
        },
        include: {
          tenant: { select: { firstName: true, lastName: true } },
          unit: { include: { property: { select: { name: true } } } },
          vendor: { select: { name: true, company: true } },
          comments: true,
        },
      }),
      prisma.expense.findMany({
        where: { landlordId: userId, isDeleted: false },
        include: {
          property: { select: { name: true } },
          unit: { select: { unitNumber: true } },
        },
      }),
      prisma.document.findMany({
        where: { landlordId: userId, isDeleted: false },
        include: {
          property: { select: { name: true } },
          tenant: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { recipientId: userId }],
        },
        include: {
          sender: { select: { name: true, email: true } },
          recipient: { select: { name: true, email: true } },
        },
      }),
      prisma.notification.findMany({
        where: { userId },
      }),
      prisma.activityLog.findMany({
        where: { userId },
        include: {
          property: { select: { name: true } },
          tenant: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.teamMember.findMany({
        where: {
          OR: [{ invitedBy: userId }, { userId }],
        },
        include: {
          user: { select: { name: true, email: true } },
          property: { select: { name: true } },
        },
      }),
      prisma.landlordSettings.findUnique({
        where: { landlordId: userId },
      }),
      prisma.emailTemplate.findMany({
        where: { landlordId: userId },
      }),
      prisma.vendor.findMany({
        where: { landlordId: userId, isActive: true },
      }),
      prisma.complianceChecklist.findMany({
        where: {
          property: { landlordId: userId },
        },
        include: {
          property: { select: { name: true } },
        },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      user,
      properties,
      units,
      tenants,
      leases,
      payments,
      maintenanceRequests,
      expenses,
      documents,
      messages,
      notifications,
      activityLogs,
      teamMembers,
      settings,
      emailTemplates,
      vendors,
      complianceChecklists,
    };

    // Log the export
    await prisma.activityLog.create({
      data: {
        userId,
        action: "DATA_EXPORTED",
        entityType: "User",
        entityId: userId,
        details: { 
          recordCount: Object.values(exportData).filter(Array.isArray).reduce((sum, arr) => sum + arr.length, 0),
        },
      },
    });

    return NextResponse.json({ 
      data: exportData,
      format: "json",
      recordCount: Object.values(exportData).filter(Array.isArray).reduce((sum, arr) => sum + arr.length, 0),
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
