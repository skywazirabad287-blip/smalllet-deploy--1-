import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/zod";
import { ZodError } from "zod";
import { applyRateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 100 });
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
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const taxDeductible = searchParams.get("taxDeductible");

    const expenses = await prisma.expense.findMany({
      where: {
        landlordId: session.user.id,
        isDeleted: false,
        ...(propertyId && { propertyId }),
        ...(category && { category: category as any }),
        ...(startDate && endDate && {
          date: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
        ...(taxDeductible !== null && { taxDeductible: taxDeductible === "true" }),
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
      },
      orderBy: { date: "desc" },
    });

    const categoryTotals = expenses.reduce((acc, expense) => {
      const cat = expense.category;
      const amount = parseFloat(expense.amount.toString());
      acc[cat] = (acc[cat] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ expenses, categoryTotals });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, { maxRequests: 100 });
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
    const validated = expenseSchema.parse(body);
    // Sanitize text inputs
    if (validated.description) validated.description = sanitizeString(validated.description);
    if (validated.vendor) validated.vendor = sanitizeString(validated.vendor);

    if (validated.propertyId) {
      const property = await prisma.property.findFirst({
        where: { id: validated.propertyId, landlordId: session.user.id },
      });
      if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const expense = await prisma.expense.create({
      data: {
        ...validated,
        landlordId: session.user.id,
        isDeleted: false,
        date: new Date(validated.date),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        propertyId: validated.propertyId || undefined,
        action: "EXPENSE_CREATED",
        entityType: "Expense",
        entityId: expense.id,
        details: { amount: validated.amount, category: validated.category, description: validated.description },
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Expenses POST error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
