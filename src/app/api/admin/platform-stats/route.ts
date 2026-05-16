import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "OWNER") {
      return new NextResponse("Forbidden - Owner access only", { status: 403 });
    }

    // Get all counts
    const [
      totalUsers,
      totalLandlords,
      totalTenants,
      totalProperties,
      totalUnits,
      totalLeases,
      totalPayments,
      totalMaintenanceRequests,
      pendingMaintenance,
      activeSubscriptions,
      freeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "LANDLORD" } }),
      prisma.user.count({ where: { role: "TENANT" } }),
      prisma.property.count(),
      prisma.unit.count(),
      prisma.lease.count(),
      prisma.payment.count(),
      prisma.maintenanceRequest.count(),
      prisma.maintenanceRequest.count({ where: { status: { not: "COMPLETED" } } }),
      prisma.user.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.user.count({ where: { subscriptionTier: "FREE" } }),
    ]);

    // Get total revenue
    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    });

    const stats = {
      totalUsers,
      totalLandlords,
      totalTenants,
      totalProperties,
      totalUnits,
      totalLeases,
      totalPayments,
      totalRevenue: revenueResult._sum?.amount || 0,
      totalMaintenanceRequests,
      pendingMaintenance,
      activeSubscriptions,
      freeUsers,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Platform stats error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}