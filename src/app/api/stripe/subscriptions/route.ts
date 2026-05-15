export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// GET /api/stripe/subscriptions - Get current subscription
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, subscriptionStatus: true, subscriptionTier: true, subscriptionEndsAt: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ subscription: null });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    return NextResponse.json({
      subscription: subscriptions.data[0] || null,
      user: {
        status: user.subscriptionStatus,
        tier: user.subscriptionTier,
        endsAt: user.subscriptionEndsAt,
      },
    });
  } catch (error) {
    console.error("Stripe subscriptions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
