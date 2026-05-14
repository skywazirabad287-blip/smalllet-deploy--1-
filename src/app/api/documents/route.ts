import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentSchema } from "@/lib/zod";
import { ZodError } from "zod";
import { applyRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 50 });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Limit": String(rateLimitResult.limit), "X-RateLimit-Remaining": String(rateLimitResult.remaining), "X-RateLimit-Reset": String(rateLimitResult.reset) } }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const tenantId = searchParams.get("tenantId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const documents = await prisma.document.findMany({
      where: {
        landlordId: session.user.id,
        isDeleted: false,
        ...(propertyId && { propertyId }),
        ...(tenantId && { tenantId }),
        ...(type && { type: type as any }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        }),
      },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 50 });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Limit": String(rateLimitResult.limit), "X-RateLimit-Remaining": String(rateLimitResult.remaining), "X-RateLimit-Reset": String(rateLimitResult.reset) } }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = documentSchema.parse(body);
    // Sanitize text inputs
    if (validated.name) validated.name = sanitizeString(validated.name);
    if (validated.tags) validated.tags = validated.tags.map((tag: string) => sanitizeString(tag));

    const document = await prisma.document.create({
      data: {
        ...validated,
        landlordId: session.user.id,
        isDeleted: false,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Documents POST error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
