import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/cleanup
 * Permanently delete data past retention period (30 days)
 * Should be called by a cron job (e.g., Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const cronSecret = req.headers.get("x-cron-secret");
    const session = await getServerSession(authOptions);

    const isAuthorized = 
      cronSecret === process.env.CRON_SECRET ||
      (session?.user?.role === "LANDLORD" || session?.user?.role === "OWNER");

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retentionDays = 30;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const results: Record<string, number> = {};

    // Permanently delete soft-deleted users past retention
    const deletedUsers = await prisma.user.deleteMany({
      where: { deletedAt: { lt: cutoffDate }, isDeleted: true },
    });
    results.users = deletedUsers.count;

    // Permanently delete soft-deleted properties
    const deletedProperties = await prisma.property.deleteMany({
      where: { deletedAt: { lt: cutoffDate } },
    });
    results.properties = deletedProperties.count;

    // Permanently delete soft-deleted units
    const deletedUnits = await prisma.unit.deleteMany({
      where: { deletedAt: { lt: cutoffDate } },
    });
    results.units = deletedUnits.count;

    // Permanently delete soft-deleted tenants
    const deletedTenants = await prisma.tenant.deleteMany({
      where: { deletedAt: { lt: cutoffDate }, isDeleted: true },
    });
    results.tenants = deletedTenants.count;

    // Permanently delete soft-deleted leases
    const deletedLeases = await prisma.lease.deleteMany({
      where: { deletedAt: { lt: cutoffDate }, isDeleted: true },
    });
    results.leases = deletedLeases.count;

    // Permanently delete soft-deleted payments
    const deletedPayments = await prisma.payment.deleteMany({
      where: { deletedAt: { lt: cutoffDate }, isDeleted: true },
    });
    results.payments = deletedPayments.count;

    // Permanently delete soft-deleted maintenance
    const deletedMaintenance = await prisma.maintenanceRequest.deleteMany({
      where: { deletedAt: { lt: cutoffDate }, isDeleted: true },
    });
    results.maintenance = deletedMaintenance.count;

    // Permanently delete soft-deleted expenses
    const deletedExpenses = await prisma.expense.deleteMany({
      where: { deletedAt: { lt: cutoffDate }, isDeleted: true },
    });
    results.expenses = deletedExpenses.count;

    // Permanently delete soft-deleted documents
    const deletedDocuments = await prisma.document.deleteMany({
      where: { deletedAt: { lt: cutoffDate }, isDeleted: true },
    });
    results.documents = deletedDocuments.count;

    // Clean up old notifications (older than 90 days)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    });
    results.notifications = deletedNotifications.count;

    // Clean up old activity logs (older than 1 year)
    const deletedLogs = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
    });
    results.activityLogs = deletedLogs.count;

    const totalDeleted = Object.values(results).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      results,
      totalDeleted,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
