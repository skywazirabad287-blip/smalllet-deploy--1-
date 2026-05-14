import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

async function verifyAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "LANDLORD" && user?.role !== "OWNER") {
    return { error: "Admin access required", status: 403 };
  }

  return { userId: session.user.id };
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [
      totalUsers,
      activeUsers,
      deletedUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalProperties,
      totalUnits,
      totalTenants,
      totalPayments,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      totalMaintenance,
      pendingMaintenance,
      totalExpenses,
      subscriptionsByTier,
      subscriptionsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: true } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart, lte: thisMonthEnd } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.property.count({ where: { isDeleted: false } }),
      prisma.unit.count({ where: { isDeleted: false } }),
      prisma.tenant.count({ where: { isDeleted: false } }),
      prisma.payment.count({ where: { status: "COMPLETED", isDeleted: false } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", isDeleted: false, processedAt: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", isDeleted: false, processedAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.maintenanceRequest.count({ where: { isDeleted: false } }),
      prisma.maintenanceRequest.count({ where: { isDeleted: false, status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "IN_PROGRESS"] } } }),
      prisma.expense.aggregate({
        where: { isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.user.groupBy({
        by: ["subscriptionTier"],
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ["subscriptionStatus"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        deleted: deletedUsers,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        growthRate: newUsersLastMonth > 0
          ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
          : 0,
      },
      properties: {
        total: totalProperties,
        units: totalUnits,
        tenants: totalTenants,
      },
      financials: {
        totalRevenue: parseFloat(totalRevenue._sum.amount?.toString() || "0"),
        thisMonthRevenue: parseFloat(thisMonthRevenue._sum.amount?.toString() || "0"),
        lastMonthRevenue: parseFloat(lastMonthRevenue._sum.amount?.toString() || "0"),
        totalExpenses: parseFloat(totalExpenses._sum.amount?.toString() || "0"),
        netIncome: parseFloat(totalRevenue._sum.amount?.toString() || "0") - parseFloat(totalExpenses._sum.amount?.toString() || "0"),
      },
      maintenance: {
        total: totalMaintenance,
        pending: pendingMaintenance,
      },
      subscriptions: {
        byTier: subscriptionsByTier,
        byStatus: subscriptionsByStatus,
      },
    });
  } catch (error) {
    console.error("Admin stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
