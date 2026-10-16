import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const isValid = verifyPaystackWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid cryptographic signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event + "_" + (event.data?.reference || event.data?.id || Date.now());

    try {
      const existingEvent = await prisma.paystackWebhookEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent) {
        return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
      }

      await prisma.paystackWebhookEvent.create({
        data: {
          eventId,
          eventType: event.event,
          payload: event,
          status: "PROCESSING",
        },
      });
    } catch {
    }

    if (event.event === "charge.success") {
      const { reference, amount, currency, channel } = event.data;

      if (currency !== "GHS") {
        console.warn(`Unexpected currency in Paystack webhook: ${currency}`);
      }

      try {
        const paymentAttempt = await prisma.paymentAttempt.findUnique({
          where: { reference },
          include: { order: true },
        });

        if (paymentAttempt) {
          if (amount < paymentAttempt.order.totalPesewas) {
            console.error(
              `Payment amount mismatch. Expected ${paymentAttempt.order.totalPesewas} pesewas, received ${amount} pesewas.`
            );
          } else {
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
          }
        }
      } catch (dbErr) {
        console.error("Database update error in webhook handler:", dbErr);
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
