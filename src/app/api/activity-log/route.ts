export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const tenantId = searchParams.get("tenantId");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: session.user.id,
        ...(propertyId && { propertyId }),
        ...(tenantId && { tenantId }),
        ...(action && { action }),
      },
      include: {
        property: { select: { name: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Activity log GET error:", error);
    return NextResponse.json({ error: "Failed to fetch activity log" }, { status: 500 });
  }
}
