import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const US_CHECKLIST = [
  { id: "smoke_detectors", label: "Smoke detectors installed and tested", required: true },
  { id: "co_detectors", label: "Carbon monoxide detectors installed", required: true },
  { id: "lead_paint", label: "Lead paint disclosure (pre-1978)", required: true },
  { id: "fair_housing", label: "Fair housing compliance posted", required: true },
  { id: "security_deposit", label: "Security deposit within legal limit", required: true },
  { id: "lease_compliance", label: "Lease complies with state laws", required: true },
  { id: "habitability", label: "Property meets habitability standards", required: true },
  { id: "insurance", label: "Liability insurance current", required: true },
  { id: "business_license", label: "Rental business license (if required)", required: false },
  { id: "inspection", label: "Annual safety inspection completed", required: false },
];

const PK_CHECKLIST = [
  { id: "rent_agreement", label: "Registered rent agreement", required: true },
  { id: "cnic_verification", label: "Tenant CNIC verified", required: true },
  { id: "police_verification", label: "Police verification completed", required: true },
  { id: "utility_bills", label: "Utility bills transferred", required: true },
  { id: "property_tax", label: "Property tax paid and current", required: true },
  { id: "society_approval", label: "Housing society NOC (if applicable)", required: false },
  { id: "fire_safety", label: "Fire safety equipment installed", required: false },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    // Verify property ownership
    if (propertyId) {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, landlordId: session.user.id },
      });
      if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

        const checklists = await prisma.complianceChecklist.findMany({
      where: { propertyId: propertyId || undefined },
    });

    return NextResponse.json({ checklists });
  } catch (error) {
    console.error("Compliance GET error:", error);
    return NextResponse.json({ error: "Failed to fetch compliance" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { propertyId, country = "US", state } = await req.json();

    // Verify property ownership
    const property = await prisma.property.findFirst({
      where: { id: propertyId, landlordId: session.user.id },
    });
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    const items = country === "US" ? US_CHECKLIST : country === "PK" ? PK_CHECKLIST : US_CHECKLIST;

    const checklist = await prisma.complianceChecklist.create({
      data: {
        propertyId,
        country,
        state,
        items: items.map((item) => ({
          ...item,
          completed: false,
          completedAt: null,
          evidenceUrl: null,
        })),
      },
    });

    return NextResponse.json({ checklist }, { status: 201 });
  } catch (error) {
    console.error("Compliance POST error:", error);
    return NextResponse.json({ error: "Failed to create checklist" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, itemId, completed, evidenceUrl } = await req.json();

    const checklist = await prisma.complianceChecklist.findFirst({
      where: { id, property: { landlordId: session.user.id } },
    });
    if (!checklist) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = checklist.items as any[];
    const itemIndex = items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    items[itemIndex] = {
      ...items[itemIndex],
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      evidenceUrl: evidenceUrl || items[itemIndex].evidenceUrl,
    };

    const updated = await prisma.complianceChecklist.update({
      where: { id },
      data: { items },
    });

    return NextResponse.json({ checklist: updated });
  } catch (error) {
    console.error("Compliance PATCH error:", error);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
