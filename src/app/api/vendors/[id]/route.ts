import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vendor = await prisma.vendor.findFirst({
      where: { id: params.id, landlordId: session.user.id },
      include: {
        requests: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            unit: { include: { property: { select: { name: true } } } },
          },
        },
      },
    });

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Vendor GET error:", error);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const vendor = await prisma.vendor.update({
      where: { id: params.id, landlordId: session.user.id },
      data: body,
    });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Vendor PUT error:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.vendor.update({
      where: { id: params.id, landlordId: session.user.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vendor DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
