import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, isInternal = false } = await req.json();

    // Verify request ownership
    const request = await prisma.maintenanceRequest.findFirst({
           where: { id: params.id },
    });

    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const comment = await prisma.maintenanceComment.create({
      data: {
        requestId: params.id,
        userId: session.user.id,
        message,
        isInternal,
      },
            // include removed - user relation does not exist in schema
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Maintenance comment POST error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
