import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/zod";
import { ZodError } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
      include: {
        units: {
          include: {
            leases: {
              where: { status: "ACTIVE" },
              include: { tenant: true },
            },
          },
        },
        teamMembers: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        expenses: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error("Property GET error:", error);
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.property.findFirst({
      where: { id: params.id, landlordId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = propertySchema.partial().parse(body);

    const property = await prisma.property.update({
      where: { id: params.id },
      data: validated,
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        propertyId: property.id,
        action: "PROPERTY_UPDATED",
        entityType: "Property",
        entityId: property.id,
        details: { updatedFields: Object.keys(validated) },
      },
    });

    return NextResponse.json({ property });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Property PUT error:", error);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.property.findFirst({
      where: { id: params.id, landlordId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await prisma.property.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PROPERTY_DELETED",
        entityType: "Property",
        entityId: params.id,
        details: { name: existing.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Property DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
