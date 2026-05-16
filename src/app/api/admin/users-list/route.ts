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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
                _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get payment totals per user
    const usersWithPayments = await Promise.all(
      users.map(async (user) => {
        const paymentAgg = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: { tenantId: user.id, status: "COMPLETED" },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          stripeCustomerId: user.stripeCustomerId,
          propertiesCount: user._count.properties,
          tenantsCount: user._count.tenants,
          paymentsTotal: paymentAgg._sum?.amount || 0,
                   tenantsCount: 0,
        };
      })
    );

    return NextResponse.json({ users: usersWithPayments });
  } catch (error) {
    console.error("Users list error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}