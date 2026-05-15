import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Admin middleware - verify admin role
 */
async function verifyAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "LANDLORD" && user?.role !== "MANAGER") {
    return { error: "Admin access required", status: 403 };
  }

  return { userId: session.user.id };
}

/**
 * GET /api/admin/users
 * List all users with stats (admin only)
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // active, deleted, all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status === "active" && { isDeleted: false }),
      ...(status === "deleted" && { isDeleted: true }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionEndsAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          isDeleted: true,
          onboardingCompleted: true,
          _count: {
            select: {
              properties: true,
              teamMembers: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Update user status (suspend, restore, change role)
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { userId, action, role } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    let updateData: any = {};

    switch (action) {
      case "suspend":
        updateData = { subscriptionStatus: "INACTIVE" };
        break;
      case "restore":
        updateData = { 
          isDeleted: false, 
          deletedAt: null, 
          deletedBy: null,
          subscriptionStatus: "ACTIVE",
        };
        break;
      case "change_role":
        if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });
        updateData = { role };
        break;
      case "force_delete":
        // Permanent deletion (admin only)
        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true, message: "User permanently deleted" });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        isDeleted: true,
      },
    });

    // Log admin action
    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: `ADMIN_USER_${action.toUpperCase()}`,
        entityType: "User",
        entityId: userId,
        details: { adminId: auth.userId, action, newRole: role },
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
