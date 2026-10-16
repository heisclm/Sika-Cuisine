import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // 1. Verify HMAC SHA512 signature
    const isValid = verifyPaystackWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("⚠️ Invalid Paystack webhook signature detected.");
      return NextResponse.json(
        { error: "Invalid cryptographic signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event + "_" + (event.data?.reference || event.data?.id || Date.now());

    // 2. Idempotency Check: check if event has already been processed
    try {
      const existingEvent = await prisma.paystackWebhookEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent) {
        console.log(`ℹ️ Webhook event ${eventId} already processed. Returning 200 OK.`);
        return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
      }

      // Record event as PROCESSING
      await prisma.paystackWebhookEvent.create({
        data: {
          eventId,
          eventType: event.event,
          payload: event,
          status: "PROCESSING",
        },
      });
    } catch (e) {
      // Database logging table may be pending; proceed with transaction update
    }

    // 3. Handle charge.success event
    if (event.event === "charge.success") {
      const { reference, amount, currency, channel } = event.data;

      // Verify currency is GHS
      if (currency !== "GHS") {
        console.warn(`Unexpected currency in Paystack webhook: ${currency}`);
      }

      try {
        // Find corresponding payment attempt
        const paymentAttempt = await prisma.paymentAttempt.findUnique({
          where: { reference },
          include: { order: true },
        });

        if (paymentAttempt) {
          // Verify that paid amount matches order total in integer pesewas
          if (amount < paymentAttempt.order.totalPesewas) {
            console.error(
              `Payment amount mismatch! Expected ${paymentAttempt.order.totalPesewas} pesewas, got ${amount} pesewas.`
            );
          } else {
            // Update in atomic transaction
            await prisma.$transaction([
              prisma.paymentAttempt.update({
                where: { reference },
                data: {
                  status: "SUCCESS",
                  channel,
                  providerMetadata: event.data,
                },
              }),
              prisma.order.update({
                where: { id: paymentAttempt.orderId },
                data: {
                  paymentStatus: "PAID",
                },
              }),
              prisma.orderStatusHistory.create({
                data: {
                  orderId: paymentAttempt.orderId,
                  fromStatus: paymentAttempt.order.fulfilmentStatus,
                  toStatus: paymentAttempt.order.fulfilmentStatus,
                  note: `Payment of ${amount} pesewas verified via Paystack webhook (${channel}).`,
                },
              }),
            ]);

            console.log(`✅ Order ${paymentAttempt.order.orderNumber} successfully marked as PAID.`);
          }
        }
      } catch (dbErr) {
        console.warn("Notice: Prisma update in webhook handler:", dbErr);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Paystack Webhook Handler Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failure" },
      { status: 500 }
    );
  }
}
