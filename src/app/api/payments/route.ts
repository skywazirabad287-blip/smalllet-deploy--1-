import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { paymentSchema } from "@/lib/zod";
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
    const tenantId = searchParams.get("tenantId");
    const leaseId = searchParams.get("leaseId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const payments = await prisma.payment.findMany({
      where: {
        ...(tenantId && { tenantId }),
        ...(leaseId && { leaseId }),
        ...(status && { status: status as any }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        tenant: {
          leases: {
            some: {
              unit: { property: { landlordId: session.user.id } },
            },
          },
        },
        isDeleted: false,
      },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        lease: {
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
        },
        rentCharge: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
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
    const validated = paymentSchema.parse(body);
    if (validated.description) validated.description = sanitizeString(validated.description);

    // Verify tenant belongs to landlord
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: validated.tenantId,
        leases: {
          some: {
            unit: { property: { landlordId: session.user.id } },
          },
        },
      },
    });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    // Create Stripe PaymentIntent for card payments
    let stripePaymentIntentId = null;
    if (validated.method === "CARD") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(validated.amount * 100), // Convert to cents
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          tenantId: validated.tenantId,
          leaseId: validated.leaseId || "",
          rentChargeId: validated.rentChargeId || "",
          landlordId: session.user.id,
        },
      });
      stripePaymentIntentId = paymentIntent.id;
    }

    const payment = await prisma.payment.create({
      data: {
        ...validated,
        stripePaymentIntentId,
        status: validated.method === "CARD" ? "PENDING" : "COMPLETED",
        processedAt: validated.method !== "CARD" ? new Date() : null,
      },
      include: {
        tenant: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // If linked to rent charge, update charge status
    if (validated.rentChargeId) {
      const charge = await prisma.rentCharge.findUnique({
        where: { id: validated.rentChargeId },
      });

      if (charge) {
        const newPaidAmount = parseFloat(charge.paidAmount.toString()) + validated.amount;
        const totalAmount = parseFloat(charge.amount.toString()) + parseFloat(charge.lateFeeAmount.toString());

        await prisma.rentCharge.update({
          where: { id: validated.rentChargeId },
          data: {
            paidAmount: newPaidAmount,
            status: newPaidAmount >= totalAmount ? "PAID" : "PARTIAL",
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT_CREATED",
        entityType: "Payment",
        entityId: payment.id,
        details: { amount: validated.amount, method: validated.method, tenantId: validated.tenantId },
      },
    });

    return NextResponse.json({ payment, clientSecret: stripePaymentIntentId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.errors }, { status: 400 });
    }
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
