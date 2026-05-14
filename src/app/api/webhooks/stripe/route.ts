import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { webhookRateLimit } from "@/lib/rate-limiter";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  // Rate limit webhooks (generous limit for Stripe)
  const rateLimitResult = await webhookRateLimit(req);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const payload = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const { tenantId, leaseId, rentChargeId, landlordId } = paymentIntent.metadata;

        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            stripeChargeId: paymentIntent.latest_charge as string,
          },
        });

        // Update rent charge if applicable
        if (rentChargeId) {
          const payment = await prisma.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
          });

          if (payment) {
            const charge = await prisma.rentCharge.findUnique({
              where: { id: rentChargeId },
            });

            if (charge) {
              const newPaidAmount = parseFloat(charge.paidAmount.toString()) + parseFloat(payment.amount.toString());
              const totalAmount = parseFloat(charge.amount.toString()) + parseFloat(charge.lateFeeAmount.toString());

              await prisma.rentCharge.update({
                where: { id: rentChargeId },
                data: {
                  paidAmount: newPaidAmount,
                  status: newPaidAmount >= totalAmount ? "PAID" : "PARTIAL",
                },
              });
            }
          }
        }

        // Create notification
        if (landlordId) {
          await prisma.notification.create({
            data: {
              userId: landlordId,
              type: "RENT_PAID",
              title: "Rent Payment Received",
              message: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} has been received.`,
            },
          });
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: "FAILED" },
        });

        const { landlordId } = paymentIntent.metadata;
        if (landlordId) {
          await prisma.notification.create({
            data: {
              userId: landlordId,
              type: "PAYMENT_FAILED",
              title: "Payment Failed",
              message: `A payment of $${(paymentIntent.amount / 100).toFixed(2)} has failed.`,
            },
          });
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = subscription.metadata.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "CANCELED",
              subscriptionTier: "FREE",
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
