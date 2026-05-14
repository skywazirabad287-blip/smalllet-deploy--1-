import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.toLowerCase();
    const landlordId = session.user.id;

    const [properties, tenants, units, maintenance, documents] = await Promise.all([
      prisma.property.findMany({
        where: {
          landlordId,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { address: { contains: searchTerm, mode: "insensitive" } },
            { city: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, address: true, type: true },
        take: 5,
      }),
      prisma.tenant.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm, mode: "insensitive" } },
          ],
          leases: { some: { unit: { property: { landlordId } } } },
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        take: 5,
      }),
      prisma.unit.findMany({
        where: {
          property: { landlordId },
          OR: [
            { unitNumber: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, unitNumber: true, status: true, property: { select: { name: true } } },
        take: 5,
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          property: { landlordId },
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, status: true, unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          landlordId,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { tags: { has: searchTerm } },
          ],
        },
        select: { id: true, name: true, type: true, property: { select: { name: true } } },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      results: {
        properties: properties.map((p) => ({ ...p, type: "property" })),
        tenants: tenants.map((t) => ({ ...t, type: "tenant" })),
        units: units.map((u) => ({ ...u, type: "unit" })),
        maintenance: maintenance.map((m) => ({ ...m, type: "maintenance" })),
        documents: documents.map((d) => ({ ...d, type: "document" })),
      },
      total: properties.length + tenants.length + units.length + maintenance.length + documents.length,
    });
  } catch (error) {
    console.error("Search GET error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
