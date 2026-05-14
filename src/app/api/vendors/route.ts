import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ZodError, z } from "zod";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  licenseNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const specialty = searchParams.get("specialty");

    const vendors = await prisma.vendor.findMany({
      where: {
        landlordId: session.user.id,
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(specialty && { specialties: { has: specialty } }),
      },
      include: {
        _count: { select: { requests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Vendors GET error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = vendorSchema.parse(body);

    const vendor = await prisma.vendor.create({
      data: {
        ...validated,
        landlordId: session.user.id,
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Vendors POST error:", error);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}
