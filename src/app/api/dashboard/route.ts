export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const landlordId = session.user.id;
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        units: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: { tenant: true, rentCharges: true },
            },
          },
        },
      },
    });

    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
    const occupiedUnits = properties.reduce(
      (sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length,
      0
    );
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const thisMonthPayments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        processedAt: { gte: thisMonthStart, lte: thisMonthEnd },
        tenant: {
          leases: {
            some: {
              unit: { property: { landlordId } },
            },
          },
        },
      },
    });

    const lastMonthPayments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        processedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        tenant: {
          leases: {
            some: {
              unit: { property: { landlordId } },
            },
          },
        },
      },
    });

    const thisMonthRevenue = thisMonthPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );
    const lastMonthRevenue = lastMonthPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );
    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    const thisMonthExpenses = await prisma.expense.findMany({
      where: {
        landlordId,
        date: { gte: thisMonthStart, lte: thisMonthEnd },
      },
    });

    const totalExpenses = thisMonthExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0
    );

    const overdueCharges = await prisma.rentCharge.findMany({
      where: {
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        dueDate: { lt: now },
        lease: {
          unit: { property: { landlordId } },
        },
      },
      include: {
        lease: {
          include: {
            tenant: { select: { firstName: true, lastName: true, email: true } },
            unit: {
              include: {
                property: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const totalOverdue = overdueCharges.reduce(
      (sum, c) => sum + parseFloat(c.amount.toString()) + parseFloat(c.lateFeeAmount.toString()) - parseFloat(c.paidAmount.toString()),
      0
    );

    const pendingMaintenance = await prisma.maintenanceRequest.count({
            where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "IN_PROGRESS"] },
      },
    });

    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringLeases = await prisma.lease.count({
      where: {
        status: "ACTIVE",
        endDate: { lte: thirtyDaysFromNow, gte: now },
        unit: { property: { landlordId } },
      },
    });

    const recentActivity = await prisma.activityLog.findMany({
      where: { userId: landlordId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        property: { select: { name: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    });

    const revenueChartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const monthPayments = await prisma.payment.findMany({
        where: {
          status: "COMPLETED",
          processedAt: { gte: monthStart, lte: monthEnd },
          tenant: {
            leases: {
              some: {
                unit: { property: { landlordId } },
              },
            },
          },
        },
      });

      const monthRevenue = monthPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      );

      revenueChartData.push({
        month: format(monthStart, "MMM yyyy"),
        revenue: monthRevenue,
      });
    }

    return NextResponse.json({
      stats: {
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueChange,
        totalExpenses,
        netIncome: thisMonthRevenue - totalExpenses,
        totalOverdue,
        pendingMaintenance,
        expiringLeases,
      },
      overdueCharges,
      recentActivity,
      revenueChartData,
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
