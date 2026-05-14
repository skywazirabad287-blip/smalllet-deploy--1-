import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        OR: [
          { invitedBy: session.user.id },
          { userId: session.user.id },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        property: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error("Team GET error:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { email, propertyId, role } = body;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          role: role === "VIEWER" ? "VIEWER" : "MANAGER",
        },
      });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: user.id,
        propertyId: propertyId || null,
        role: role || "MANAGER",
        invitedBy: session.user.id,
        status: "PENDING",
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "TEAM_INVITE",
        title: "Team Invitation",
        message: `You have been invited to join a team on SmallLet`,
      },
    });

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error) {
    console.error("Team POST error:", error);
    return NextResponse.json({ error: "Failed to invite team member" }, { status: 500 });
  }
}
