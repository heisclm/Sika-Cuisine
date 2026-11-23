import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import {
  reconcilePaystackAttempt,
  reconcilePaystackRefundWebhook,
} from "@/lib/payments";
import { recordAuditLog } from "@/lib/audit";
import { logError, logWarn } from "@/lib/logger";

/**
 * POST /api/webhooks/paystack
 * Authoritative asynchronous Paystack webhook receiver.
 * Enforces HMAC-SHA512 signature verification, replay protection, strict GHS currency
 * and exact pesewas amount validation, duplicate-charge alerting, and `charge.failed` handling.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      logWarn("paystack.webhook.invalid_signature", {
        route: "/api/webhooks/paystack",
      });
      return NextResponse.json(
        { success: false, error: "Invalid signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const eventType: string | undefined = payload?.event;
    const data = payload?.data;

    if (!eventType || !data) {
      return NextResponse.json(
        { success: false, error: "Malformed webhook payload." },
        { status: 400 }
      );
    }

    const eventId = `${eventType}:${data.id ?? data.reference ?? Date.now()}`;

    const existingEvent = await prisma.paystackWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.status === "PROCESSED") {
      return NextResponse.json(
        { success: true, message: "Duplicate event already processed." },
        { status: 200 }
      );
    }

    await prisma.paystackWebhookEvent.upsert({
      where: { eventId },
      update: { eventType, payload, status: "RECEIVED" },
      create: {
        eventId,
        eventType,
        payload,
        status: "RECEIVED",
      },
    });

    if (eventType === "charge.success") {
      const reference: string | undefined = data.reference;
      if (!reference) {
        return NextResponse.json(
          { success: false, error: "Missing transaction reference." },
          { status: 400 }
        );
      }

      const result = await reconcilePaystackAttempt({
        reference,
        req,
        source: "webhook",
        verifiedTxData: data,
      });

      if (!result.found) {
        await prisma.paystackWebhookEvent.update({
          where: { eventId },
          data: { status: "IGNORED_UNKNOWN_REF" },
        });
        return NextResponse.json(
          { success: true, message: "Reference not found in local payment attempts." },
          { status: 200 }
        );
      }

      if (result.mismatch) {
        const currency = String(data.currency ?? "").toUpperCase();
        await prisma.paystackWebhookEvent.update({
          where: { eventId },
          data: { status: currency !== "GHS" ? "IGNORED_CURRENCY" : "REJECTED_UNDERPAID" },
        });
        return NextResponse.json(
          { success: false, error: result.error || "Payment mismatch." },
          { status: 400 }
        );
      }

      await prisma.paystackWebhookEvent.update({
        where: { eventId },
        data: { status: "PROCESSED" },
      });
    } else if (eventType === "charge.failed") {
      const reference: string | undefined = data.reference;
      if (reference) {
        const attempt = await prisma.paymentAttempt.findUnique({
          where: { reference },
          include: { order: true },
        });

        if (attempt && attempt.order) {
          await prisma.$transaction(async (tx) => {
            if (attempt.status === "INITIALIZED") {
              await tx.paymentAttempt.update({
                where: { id: attempt.id },
                data: {
                  status: "FAILED",
                  channel: data.channel ? String(data.channel) : attempt.channel,
                  providerMetadata: data,
                },
              });
            }

            await tx.order.updateMany({
              where: {
                id: attempt.order.id,
                paymentStatus: { not: "PAID" },
              },
              data: {
                paymentStatus: "FAILED",
              },
            });
          });

          await recordAuditLog({
            action: "PAYMENT_FAILED_WEBHOOK",
            entityType: "Order",
            entityId: attempt.order.id,
            metadata: {
              reference,
              gatewayResponse: data.gateway_response ?? null,
            },
            req,
          });
        }
      }

      await prisma.paystackWebhookEvent.update({
        where: { eventId },
        data: { status: "PROCESSED" },
      });
    } else if (eventType === "refund.processed" || eventType === "refund.failed") {
      const refundOutcome = await reconcilePaystackRefundWebhook({
        eventType,
        data: data as Record<string, unknown>,
        req,
      });

      await prisma.paystackWebhookEvent.update({
        where: { eventId },
        data: {
          status: refundOutcome.found ? "PROCESSED" : "IGNORED_UNKNOWN_REF",
        },
      });
    } else {
      await prisma.paystackWebhookEvent.update({
        where: { eventId },
        data: { status: "IGNORED_EVENT" },
      });
    }

    return NextResponse.json(
      { success: true, received: true },
      { status: 200 }
    );
  } catch (error: any) {
    logError("paystack.webhook.error", {
      route: "/api/webhooks/paystack",
      error: error?.message || String(error),
    });
    return NextResponse.json(
      { success: false, error: "Webhook processing failure." },
      { status: 500 }
    );
  }
}
