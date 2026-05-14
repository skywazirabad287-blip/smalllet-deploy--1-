import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.cancel(subscriptions.data[0].id);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { subscriptionStatus: "CANCELED" },
    });

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Stripe cancel error:", error);
    return NextResponse.json({ error: error.message || "Failed to cancel subscription" }, { status: 500 });
  }
}
