import { Prisma } from "@prisma/client";
import { getAppUrl } from "@/lib/env";
import { logError, logInfo, logWarn } from "@/lib/logger";
import {
  createRoleInAppNotifications,
  notifyOrderCreated,
  notifyPaymentConfirmed,
  notifyRefundInitiated,
  notifyRefundProcessed,
  renderSikaBusinessEmail,
  sendEmail,
} from "@/lib/notifications";
import {
  createPaystackRefund,
  fetchPaystackRefund,
  verifyPaystackTransaction,
} from "@/lib/paystack";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { isAllowedMobileReturnUrl } from "@sika/shared";

let lastAbandonedCleanupMs = 0;
const CLEANUP_THROTTLE_MS = 120_000;

export interface ReconcilePaystackResult {
  found: boolean;
  verified: boolean;
  newlyPaid: boolean;
  duplicateCharge: boolean;
  mismatch?: boolean;
  gatewayStatus?: string;
  orderNumber?: string;
  paymentStatus?: string;
  error?: string;
}

function isLoopbackOrigin(rawUrl: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(
    rawUrl.trim()
  );
}

function getIncomingRequestOrigin(req?: Request): string | null {
  if (!req) return null;

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  if (forwardedHost) {
    try {
      return new URL(`${forwardedProto}://${forwardedHost}`).origin;
    } catch {
    }
  }

  const host = req.headers.get("host")?.trim();
  if (host) {
    try {
      const proto = req.url.startsWith("https://") ? "https" : "http";
      return new URL(`${proto}://${host}`).origin;
    } catch {
    }
  }

  try {
    return new URL(req.url).origin;
  } catch {
    return null;
  }
}

/**
 * Resolves the safe HTTPS/HTTP callback origin for Paystack checkout.
 * In production, strictly prefers configured `NEXT_PUBLIC_APP_URL`.
 * In development, when `NEXT_PUBLIC_APP_URL` is localhost/unset and the request comes
 * from a LAN IP or tunnel (e.g. a phone testing on Wi-Fi), uses the reachable request origin.
 */
export function resolvePaystackBaseOrigin(req?: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    return configured || getAppUrl();
  }

  const reqOrigin = getIncomingRequestOrigin(req);
  if (reqOrigin && !isLoopbackOrigin(reqOrigin) && (!configured || isLoopbackOrigin(configured))) {
    return reqOrigin;
  }

  if (configured) return configured;
  if (reqOrigin) return reqOrigin;
  return getAppUrl();
}

/**
 * Builds the Paystack `callback_url` tailored to Web storefront or Mobile auth-session redirect.
 */
export function buildPaystackCallbackUrl(params: {
  baseOrigin: string;
  orderNumber: string;
  reference: string;
  clientPlatform: "web" | "mobile";
  mobileReturnUrl?: string;
}): string {
  if (params.clientPlatform === "mobile") {
    const query = new URLSearchParams({
      orderNumber: params.orderNumber,
      reference: params.reference,
    });
    const allowExpo = process.env.NODE_ENV !== "production";
    if (
      params.mobileReturnUrl &&
      isAllowedMobileReturnUrl(params.mobileReturnUrl, allowExpo)
    ) {
      query.set("returnTo", params.mobileReturnUrl.trim());
    }
    return `${params.baseOrigin}/api/v1/payments/mobile-callback?${query.toString()}`;
  }

  return `${params.baseOrigin}/orders/${encodeURIComponent(
    params.orderNumber
  )}?reference=${encodeURIComponent(params.reference)}`;
}

async function alertAdminsDuplicatePayment(params: {
  orderId: string;
  orderNumber: string;
  reference: string;
  amountPesewas: number;
  channel: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) return;
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true },
      take: 5,
    });
    await Promise.all([
      ...admins.map((admin) =>
        sendEmail({
          to: admin.email,
          eventType: "DUPLICATE_PAYMENT_ALERT",
          orderId: params.orderId,
          subject: `Sika Cuisine Operations Alert — Duplicate Paystack Charge on #${params.orderNumber}`,
          html: renderSikaBusinessEmail({
            preheader: `Action required: Order #${params.orderNumber} received a duplicate verified Paystack settlement (${params.reference}).`,
            badgeLabel: "Operations Alert",
            tone: "error",
            referenceCode: `#${params.orderNumber}`,
            headline: "Duplicate Online Payment Detected",
            paragraphs: [
              `Order #${params.orderNumber} received a second verified Paystack settlement on reference ${params.reference}.`,
              `Open the Super Admin Operations Console or your Paystack Dashboard to refund the duplicate charge.`,
            ],
            metaRows: [
              { label: "Order Reference", value: `#${params.orderNumber}`, mono: true },
              { label: "Duplicate Gateway Ref", value: params.reference, mono: true },
              { label: "Payment Channel", value: params.channel },
              {
                label: "Duplicate Amount",
                value: `GH₵ ${(params.amountPesewas / 100).toFixed(2)}`,
                highlight: true,
                mono: true,
              },
            ],
            ctaLabel: "Open Super Admin Console",
            ctaUrl: `${getAppUrl()}/admin`,
          }),
          text: `ACTION REQUIRED: Duplicate Paystack charge detected for Order #${params.orderNumber}. Reference: ${params.reference} (${params.amountPesewas} pesewas via ${params.channel}). Refund duplicate in Admin Console or Paystack Dashboard.`,
        })
      ),
      createRoleInAppNotifications({
        roles: ["ADMIN"],
        type: "DUPLICATE_PAYMENT_ALERT",
        title: `Duplicate Paystack Charge (#${params.orderNumber})`,
        body: `Second verified settlement (${params.reference}) detected. Review Paystack Dashboard to refund the duplicate.`,
        orderNumber: params.orderNumber,
        actionUrl: "/admin",
      }),
    ]);
  } catch (err) {
    console.warn("[Payments] Admin duplicate alert failed:", err);
  }
}

/**
 * Reconciles a Paystack transaction reference idempotently across callback, webhook,
 * and retry-guard flows. Prevents race conditions via atomic conditional update (`paymentStatus != 'PAID'`),
 * delays cashier/kitchen notifications until confirmed paid, and flags duplicate charges for refund.
 */
export async function reconcilePaystackAttempt(params: {
  reference: string;
  req?: Request;
  source: "callback" | "webhook" | "retry-guard" | "manual-verify";
  verifiedTxData?: Record<string, unknown>;
}): Promise<ReconcilePaystackResult> {
  const cleanRef = params.reference.trim();
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { reference: cleanRef },
    include: {
      order: {
        include: { items: true },
      },
    },
  });

  if (!attempt || !attempt.order) {
    return {
      found: false,
      verified: false,
      newlyPaid: false,
      duplicateCharge: false,
    };
  }

  // Fast path: this specific attempt was already reconciled as SUCCESS on a PAID order
  if (
    !params.verifiedTxData &&
    attempt.status === "SUCCESS" &&
    attempt.order.paymentStatus === "PAID"
  ) {
    return {
      found: true,
      verified: true,
      newlyPaid: false,
      duplicateCharge: false,
      gatewayStatus: "success",
      orderNumber: attempt.order.orderNumber,
      paymentStatus: "PAID",
    };
  }

  let txData = params.verifiedTxData;
  if (!txData) {
    const paystackRes = await verifyPaystackTransaction(cleanRef);
    txData = paystackRes?.data as unknown as Record<string, unknown> | undefined;
    if (!paystackRes?.status || !txData) {
      return {
        found: true,
        verified: false,
        newlyPaid: false,
        duplicateCharge: false,
        error: "Unable to verify payment with Paystack.",
      };
    }
  }

  const gatewayStatus = String(txData.status ?? "").toLowerCase();
  if (gatewayStatus !== "success") {
    if (
      (gatewayStatus === "failed" || gatewayStatus === "abandoned") &&
      attempt.status === "INITIALIZED"
    ) {
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: gatewayStatus === "failed" ? "FAILED" : "ABANDONED",
          providerMetadata: {
            ...(typeof attempt.providerMetadata === "object" &&
            attempt.providerMetadata !== null
              ? (attempt.providerMetadata as Record<string, unknown>)
              : {}),
            lastGatewayVerification: txData,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return {
      found: true,
      verified: false,
      newlyPaid: false,
      duplicateCharge: false,
      gatewayStatus,
      orderNumber: attempt.order.orderNumber,
      paymentStatus: attempt.order.paymentStatus,
    };
  }

  const currency = String(txData.currency ?? "").toUpperCase();
  const amountPesewas = Number(txData.amount ?? 0);

  if (currency !== "GHS" || amountPesewas < attempt.order.totalPesewas) {
    await recordAuditLog({
      action: "PAYMENT_VERIFY_MISMATCH",
      entityType: "Order",
      entityId: attempt.order.id,
      metadata: {
        reference: cleanRef,
        source: params.source,
        currency,
        expectedPesewas: attempt.order.totalPesewas,
        receivedPesewas: amountPesewas,
      },
      req: params.req,
    });
    return {
      found: true,
      verified: false,
      newlyPaid: false,
      duplicateCharge: false,
      mismatch: true,
      gatewayStatus,
      orderNumber: attempt.order.orderNumber,
      paymentStatus: attempt.order.paymentStatus,
      error: "Payment currency or amount mismatch.",
    };
  }

  const channel = txData.channel ? String(txData.channel) : "paystack";
  let newlyPaid = false;
  let duplicateCharge = false;

  await prisma.$transaction(async (tx) => {
    const existingOtherSuccess = await tx.paymentAttempt.findFirst({
      where: {
        orderId: attempt.order.id,
        status: "SUCCESS",
        id: { not: attempt.id },
      },
      select: { id: true, reference: true },
    });

    if (existingOtherSuccess) {
      duplicateCharge = true;
    }

    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUCCESS",
        channel,
        providerMetadata: {
          ...(typeof attempt.providerMetadata === "object" &&
          attempt.providerMetadata !== null
            ? (attempt.providerMetadata as Record<string, unknown>)
            : {}),
          verifiedTransaction: txData,
          ...(duplicateCharge
            ? {
                duplicateChargeDetected: true,
                priorSuccessReference: existingOtherSuccess?.reference,
              }
            : {}),
        } as Prisma.InputJsonValue,
      },
    });

    const conditionalUpdate = await tx.order.updateMany({
      where: {
        id: attempt.order.id,
        paymentStatus: { not: "PAID" },
      },
      data: {
        paymentStatus: "PAID",
      },
    });

    if (conditionalUpdate.count === 1) {
      newlyPaid = true;
      await tx.orderStatusHistory.create({
        data: {
          orderId: attempt.order.id,
          fromStatus: attempt.order.fulfilmentStatus,
          toStatus: attempt.order.fulfilmentStatus,
          note: `Paystack payment verified via ${params.source} (${cleanRef}, ${channel}). Order sent to Cashier queue.`,
        },
      });
    } else if (duplicateCharge) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: attempt.order.id,
          fromStatus: attempt.order.fulfilmentStatus,
          toStatus: attempt.order.fulfilmentStatus,
          note: `Alert: Duplicate Paystack charge detected (${cleanRef}). Escalated to Super Admin for refund.`,
        },
      });
    }
  });

  if (newlyPaid) {
    await recordAuditLog({
      action:
        params.source === "webhook"
          ? "PAYMENT_CONFIRMED_WEBHOOK"
          : "PAYMENT_CONFIRMED_CALLBACK",
      entityType: "Order",
      entityId: attempt.order.id,
      metadata: {
        reference: cleanRef,
        channel,
        amountPesewas,
        source: params.source,
      },
      req: params.req,
    });

    logInfo("paystack.payment_confirmed", {
      route: params.source,
      orderNumber: attempt.order.orderNumber,
      reference: cleanRef,
      amountPesewas,
      channel,
    });

    void notifyOrderCreated(attempt.order).catch(() => {});
    void notifyPaymentConfirmed(attempt.order).catch(() => {});
  }

  if (duplicateCharge) {
    await recordAuditLog({
      action: "DUPLICATE_PAYMENT_DETECTED",
      entityType: "Order",
      entityId: attempt.order.id,
      metadata: {
        orderNumber: attempt.order.orderNumber,
        duplicateReference: cleanRef,
        amountPesewas,
        channel,
        source: params.source,
      },
      req: params.req,
    });

    logError("paystack.duplicate_payment_detected", {
      orderNumber: attempt.order.orderNumber,
      reference: cleanRef,
      amountPesewas,
      channel,
      source: params.source,
    });

    void alertAdminsDuplicatePayment({
      orderId: attempt.order.id,
      orderNumber: attempt.order.orderNumber,
      reference: cleanRef,
      amountPesewas,
      channel,
    }).catch(() => {});
  }

  return {
    found: true,
    verified: true,
    newlyPaid,
    duplicateCharge,
    gatewayStatus: "success",
    orderNumber: attempt.order.orderNumber,
    paymentStatus: "PAID",
  };
}

/**
 * Throttled sweeper that checks and expires abandoned unpaid Paystack orders older than
 * `olderThanMinutes` (default 30 minutes). Verifies with Paystack first so a delayed
 * MoMo settlement is recovered rather than cancelled.
 */
export async function expireAbandonedPaystackOrders(
  olderThanMinutes = 30
): Promise<void> {
  const nowMs = Date.now();
  if (nowMs - lastAbandonedCleanupMs < CLEANUP_THROTTLE_MS) {
    return;
  }
  lastAbandonedCleanupMs = nowMs;

  if (!process.env.DATABASE_URL?.trim()) return;

  try {
    const cutoff = new Date(nowMs - olderThanMinutes * 60_000);
    const staleOrders = await prisma.order.findMany({
      where: {
        paymentMethod: "PAYSTACK",
        paymentStatus: { not: "PAID" },
        fulfilmentStatus: "PENDING",
        createdAt: { lt: cutoff },
      },
      include: {
        paymentAttempts: {
          orderBy: { createdAt: "desc" },
          take: 2,
        },
      },
      take: 15,
    });

    const hasPaystackKey = Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());

    for (const stale of staleOrders) {
      let skipExpiry = false;
      let recoveredPaid = false;

      if (hasPaystackKey && stale.paymentAttempts.length > 0) {
        for (const att of stale.paymentAttempts) {
          try {
            const verifyRes = await verifyPaystackTransaction(att.reference);
            const st = String(verifyRes?.data?.status ?? "").toLowerCase();
            if (st === "success") {
              await reconcilePaystackAttempt({
                reference: att.reference,
                source: "manual-verify",
                verifiedTxData: verifyRes.data as unknown as Record<string, unknown>,
              });
              recoveredPaid = true;
              break;
            }
            if (
              st === "pending" ||
              st === "ongoing" ||
              st === "processing" ||
              st === "queued"
            ) {
              skipExpiry = true;
            }
          } catch {
            // Uninitialized or network glitch — safe to evaluate next attempt / expiry
          }
        }
      }

      if (recoveredPaid || skipExpiry) continue;

      await prisma.$transaction(async (tx) => {
        const closed = await tx.order.updateMany({
          where: {
            id: stale.id,
            paymentStatus: { not: "PAID" },
            fulfilmentStatus: "PENDING",
          },
          data: {
            fulfilmentStatus: "CANCELLED",
            paymentStatus: "FAILED",
            cancellationReason: `Unpaid Paystack checkout expired automatically after ${olderThanMinutes} minutes.`,
          },
        });

        if (closed.count === 1) {
          await tx.paymentAttempt.updateMany({
            where: {
              orderId: stale.id,
              status: "INITIALIZED",
            },
            data: { status: "ABANDONED" },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: stale.id,
              fromStatus: "PENDING",
              toStatus: "CANCELLED",
              note: `Unpaid Paystack checkout expired after ${olderThanMinutes} minutes without payment.`,
            },
          });
        }
      });

      logWarn("order.unpaid_paystack_expired", {
        orderNumber: stale.orderNumber,
      });
    }
  } catch (err) {
    console.warn("[Payments] expireAbandonedPaystackOrders error:", err);
  }
}

export interface InitiateOrderRefundResult {
  initiated: boolean;
  alreadyRefunded?: boolean;
  refundId?: number | string;
  paymentStatus?: string;
  error?: string;
}

async function alertAdminsRefundFailure(params: {
  orderId: string;
  orderNumber: string;
  reference: string;
  error: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) return;
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true },
      take: 5,
    });
    await Promise.all([
      ...admins.map((admin) =>
        sendEmail({
          to: admin.email,
          eventType: "PAYMENT_REFUND_FAILED",
          orderId: params.orderId,
          subject: `Sika Cuisine Operations Alert — Paystack Refund Retry Needed on #${params.orderNumber}`,
          html: renderSikaBusinessEmail({
            preheader: `Action required: Automated Paystack refund on Order #${params.orderNumber} (${params.reference}) needs Super Admin retry.`,
            badgeLabel: "Refund Retry Needed",
            tone: "error",
            referenceCode: `#${params.orderNumber}`,
            headline: "Automated Paystack Refund Needs Attention",
            paragraphs: [
              `An automatic Paystack refund attempt for Order #${params.orderNumber} could not be completed by the gateway.`,
              `Sign in to the Super Admin Operations Console and click "Retry Paystack Refund" on this order card, or process the reversal in your Paystack Dashboard.`,
            ],
            calloutTitle: "Gateway Error Details",
            calloutBody: params.error,
            metaRows: [
              { label: "Order Reference", value: `#${params.orderNumber}`, mono: true },
              { label: "Gateway Reference", value: params.reference, mono: true },
            ],
            ctaLabel: "Open Super Admin Console",
            ctaUrl: `${getAppUrl()}/admin`,
          }),
          text: `ACTION REQUIRED: Paystack refund failed for #${params.orderNumber} (${params.reference}). Error: ${params.error}. Open /admin to retry the refund.`,
        })
      ),
      createRoleInAppNotifications({
        roles: ["ADMIN"],
        type: "PAYMENT_REFUND_FAILED",
        title: `Refund Retry Needed (#${params.orderNumber})`,
        body: `Paystack refund for ${params.reference} failed: ${params.error}. Open Admin Console to retry.`,
        orderNumber: params.orderNumber,
        actionUrl: "/admin",
      }),
    ]);
  } catch (err) {
    console.warn("[Payments] Admin refund-failure alert failed:", err);
  }
}

/**
 * Initiates an idempotent full or targeted Paystack refund for a verified payment attempt.
 * Claims `Order.paymentStatus` atomically from `PAID -> REFUND_PENDING` for full-order refunds,
 * calls `POST https://api.paystack.co/refund`, records audit/status history, and alerts
 * Super Admins if Paystack fails so it can be retried cleanly from `/admin`.
 */
export async function initiateOrderRefund(params: {
  orderId: string;
  reason: string;
  initiatedByUserId?: string;
  initiatedByName?: string;
  targetReference?: string;
  req?: Request;
}): Promise<InitiateOrderRefundResult> {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: params.orderId }, { orderNumber: params.orderId }] },
    include: {
      items: true,
      paymentAttempts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return { initiated: false, error: "Order not found." };
  }

  if (order.paymentMethod !== "PAYSTACK") {
    return {
      initiated: false,
      error: "Only online Paystack orders are refunded via Paystack.",
    };
  }

  if (!params.targetReference && order.paymentStatus === "REFUND_PENDING") {
    await syncPendingPaystackRefunds({ orderId: order.id }).catch(() => {});
    const refreshed = await prisma.order.findUnique({
      where: { id: order.id },
      select: { paymentStatus: true },
    });
    return {
      initiated: false,
      alreadyRefunded: true,
      paymentStatus: refreshed?.paymentStatus || order.paymentStatus,
    };
  }

  if (!params.targetReference && order.paymentStatus === "REFUNDED") {
    return {
      initiated: false,
      alreadyRefunded: true,
      paymentStatus: order.paymentStatus,
    };
  }

  const attempt = params.targetReference
    ? order.paymentAttempts.find(
        (a) => a.reference === params.targetReference && a.status === "SUCCESS"
      )
    : order.paymentAttempts.find((a) => a.status === "SUCCESS");

  if (!attempt) {
    return {
      initiated: false,
      error: "No verified Paystack settlement found to refund for this order.",
    };
  }

  const existingMeta =
    typeof attempt.providerMetadata === "object" && attempt.providerMetadata !== null
      ? (attempt.providerMetadata as Record<string, unknown>)
      : {};

  if (
    existingMeta.refundId &&
    existingMeta.refundStatus !== "failed"
  ) {
    return {
      initiated: false,
      alreadyRefunded: true,
      refundId: String(existingMeta.refundId),
      paymentStatus: order.paymentStatus,
    };
  }

  const isDuplicateOnly = Boolean(
    params.targetReference &&
      order.fulfilmentStatus !== "REJECTED" &&
      order.fulfilmentStatus !== "CANCELLED"
  );

  if (!isDuplicateOnly) {
    const claimed = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: "PAID",
      },
      data: {
        paymentStatus: "REFUND_PENDING",
      },
    });

    if (claimed.count === 0) {
      return {
        initiated: false,
        alreadyRefunded: true,
        paymentStatus: order.paymentStatus,
      };
    }
  }

  const cleanReason = params.reason.trim() || "Order declined/cancelled";
  const refundAmountPesewas = isDuplicateOnly
    ? attempt.amountPesewas
    : order.totalPesewas;

  try {
    const paystackRefund = await createPaystackRefund({
      transaction: attempt.reference,
      amountPesewas: refundAmountPesewas,
      customerNote: `Sika Cuisine refund for #${order.orderNumber}: ${cleanReason}`,
      merchantNote: `Initiated by ${params.initiatedByName || "System"}: ${cleanReason}`,
    });

    const gatewayRefundStatus = String(
      paystackRefund.data?.status ?? "pending"
    ).toLowerCase();
    const settledImmediately = gatewayRefundStatus === "processed";
    const nextOrderPaymentStatus = settledImmediately
      ? "REFUNDED"
      : "REFUND_PENDING";

    await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          providerMetadata: {
            ...existingMeta,
            refundId: paystackRefund.data?.id ?? null,
            refundStatus: gatewayRefundStatus,
            refundReference: paystackRefund.data?.reference ?? null,
            refundReason: cleanReason,
            refundAmountPesewas,
            refundInitiatedAt: new Date().toISOString(),
            refundInitiatedBy: params.initiatedByName || "System",
          } as Prisma.InputJsonValue,
        },
      });

      if (!isDuplicateOnly) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: nextOrderPaymentStatus,
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.fulfilmentStatus,
          toStatus: order.fulfilmentStatus,
          note: isDuplicateOnly
            ? `Duplicate Paystack charge (${attempt.reference}) refund ${gatewayRefundStatus} (ID: ${paystackRefund.data?.id ?? "n/a"}).`
            : `Paystack full refund ${gatewayRefundStatus} (${attempt.reference}). Reason: ${cleanReason}`,
          changedByUserId: params.initiatedByUserId ?? null,
        },
      });
    });

    await recordAuditLog({
      userId: params.initiatedByUserId,
      action: settledImmediately
        ? "PAYMENT_REFUND_PROCESSED"
        : "PAYMENT_REFUND_INITIATED",
      entityType: "Order",
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        reference: attempt.reference,
        refundId: paystackRefund.data?.id ?? null,
        gatewayRefundStatus,
        amountPesewas: refundAmountPesewas,
        isDuplicateOnly,
        reason: cleanReason,
      },
      req: params.req,
    });

    logInfo("paystack.refund_initiated", {
      orderNumber: order.orderNumber,
      reference: attempt.reference,
      refundId: paystackRefund.data?.id,
      gatewayRefundStatus,
    });

    if (!isDuplicateOnly) {
      if (settledImmediately) {
        void notifyRefundProcessed(order).catch(() => {});
      } else {
        void notifyRefundInitiated(order, cleanReason).catch(() => {});
      }
    }

    return {
      initiated: true,
      refundId: paystackRefund.data?.id,
      paymentStatus: isDuplicateOnly ? order.paymentStatus : nextOrderPaymentStatus,
    };
  } catch (err: any) {
    const errMsg = String(err?.message || err || "Unknown Paystack refund error");

    if (!isDuplicateOnly) {
      await prisma.order
        .updateMany({
          where: {
            id: order.id,
            paymentStatus: "REFUND_PENDING",
          },
          data: {
            paymentStatus: "PAID",
          },
        })
        .catch(() => {});
    }

    await prisma.paymentAttempt
      .update({
        where: { id: attempt.id },
        data: {
          providerMetadata: {
            ...existingMeta,
            refundStatus: "failed",
            refundError: errMsg.slice(0, 250),
            refundLastAttemptAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      })
      .catch(() => {});

    await prisma.orderStatusHistory
      .create({
        data: {
          orderId: order.id,
          fromStatus: order.fulfilmentStatus,
          toStatus: order.fulfilmentStatus,
          note: `Automatic Paystack refund attempt failed (${attempt.reference}): ${errMsg.slice(0, 140)}. Super Admin retry required.`,
          changedByUserId: params.initiatedByUserId ?? null,
        },
      })
      .catch(() => {});

    await recordAuditLog({
      userId: params.initiatedByUserId,
      action: "PAYMENT_REFUND_FAILED",
      entityType: "Order",
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        reference: attempt.reference,
        error: errMsg.slice(0, 300),
      },
      req: params.req,
    });

    logError("paystack.refund_failed", {
      orderNumber: order.orderNumber,
      reference: attempt.reference,
      error: errMsg,
    });

    void alertAdminsRefundFailure({
      orderId: order.id,
      orderNumber: order.orderNumber,
      reference: attempt.reference,
      error: errMsg,
    }).catch(() => {});

    return {
      initiated: false,
      paymentStatus: order.paymentStatus,
      error: errMsg,
    };
  }
}

/**
 * Reconciles asynchronous Paystack `refund.processed` and `refund.failed` webhook events.
 */
export async function reconcilePaystackRefundWebhook(params: {
  eventType: "refund.processed" | "refund.failed";
  data: Record<string, unknown>;
  req?: Request;
}): Promise<{ found: boolean; orderNumber?: string }> {
  const txObj =
    typeof params.data.transaction === "object" && params.data.transaction !== null
      ? (params.data.transaction as Record<string, unknown>)
      : null;

  const reference = String(
    params.data.transaction_reference ?? txObj?.reference ?? ""
  ).trim();

  if (!reference) {
    return { found: false };
  }

  const attempt = await prisma.paymentAttempt.findUnique({
    where: { reference },
    include: {
      order: {
        include: { items: true },
      },
    },
  });

  if (!attempt || !attempt.order) {
    return { found: false };
  }

  const existingMeta =
    typeof attempt.providerMetadata === "object" && attempt.providerMetadata !== null
      ? (attempt.providerMetadata as Record<string, unknown>)
      : {};

  const isDuplicateOnly =
    attempt.order.fulfilmentStatus !== "REJECTED" &&
    attempt.order.fulfilmentStatus !== "CANCELLED" &&
    Boolean(existingMeta.duplicateChargeDetected || attempt.order.paymentStatus === "PAID");

  if (params.eventType === "refund.processed") {
    let newlySettled = false;

    await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          providerMetadata: {
            ...existingMeta,
            refundStatus: "processed",
            refundProcessedWebhookAt: new Date().toISOString(),
            refundWebhookData: params.data,
          } as Prisma.InputJsonValue,
        },
      });

      if (!isDuplicateOnly) {
        const updated = await tx.order.updateMany({
          where: {
            id: attempt.order.id,
            paymentStatus: { in: ["PAID", "REFUND_PENDING"] },
          },
          data: {
            paymentStatus: "REFUNDED",
          },
        });
        newlySettled = updated.count > 0;
      } else {
        newlySettled = existingMeta.refundStatus !== "processed";
      }

      if (newlySettled) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: attempt.order.id,
            fromStatus: attempt.order.fulfilmentStatus,
            toStatus: attempt.order.fulfilmentStatus,
            note: `Paystack confirmed refund processed (${reference}).`,
          },
        });
      }
    });

    if (newlySettled) {
      await recordAuditLog({
        action: "PAYMENT_REFUND_PROCESSED_WEBHOOK",
        entityType: "Order",
        entityId: attempt.order.id,
        metadata: {
          orderNumber: attempt.order.orderNumber,
          reference,
          isDuplicateOnly,
        },
        req: params.req,
      });

      if (!isDuplicateOnly) {
        await notifyRefundProcessed(attempt.order).catch(() => {});
      }
    }
  } else {
    const gatewayMsg = String(
      params.data.gateway_response ?? params.data.status ?? "Refund failed on gateway"
    );

    await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          providerMetadata: {
            ...existingMeta,
            refundStatus: "failed",
            refundError: gatewayMsg,
            refundFailedWebhookAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await tx.order.updateMany({
        where: {
          id: attempt.order.id,
          paymentStatus: "REFUND_PENDING",
        },
        data: {
          paymentStatus: "PAID",
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: attempt.order.id,
          fromStatus: attempt.order.fulfilmentStatus,
          toStatus: attempt.order.fulfilmentStatus,
          note: `Paystack webhook reported refund failure (${reference}): ${gatewayMsg}. Admin intervention required.`,
        },
      });
    });

    await recordAuditLog({
      action: "PAYMENT_REFUND_FAILED_WEBHOOK",
      entityType: "Order",
      entityId: attempt.order.id,
      metadata: {
        orderNumber: attempt.order.orderNumber,
        reference,
        error: gatewayMsg,
      },
      req: params.req,
    });

    void alertAdminsRefundFailure({
      orderId: attempt.order.id,
      orderNumber: attempt.order.orderNumber,
      reference,
      error: gatewayMsg,
    }).catch(() => {});
  }

  return { found: true, orderNumber: attempt.order.orderNumber };
}

/**
 * Polls Paystack's `GET /refund/:id` endpoint for `REFUND_PENDING` orders so that local
 * development (`localhost:3000`, where Paystack webhooks cannot reach) and delayed webhooks
 * automatically transition settled refunds to `REFUNDED` and dispatch customer emails.
 */
export async function syncPendingPaystackRefunds(options?: {
  orderId?: string;
  orderNumber?: string;
}): Promise<{ checked: number; settled: number }> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { checked: 0, settled: 0 };
  }

  const where: Prisma.OrderWhereInput = {
    paymentStatus: "REFUND_PENDING",
  };
  if (options?.orderId) {
    where.id = options.orderId;
  }
  if (options?.orderNumber) {
    where.orderNumber = options.orderNumber.trim().toUpperCase();
  }

  const pendingOrders = await prisma.order.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      items: true,
      paymentAttempts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  let checked = 0;
  let settled = 0;

  for (const order of pendingOrders) {
    const attemptWithRefund = order.paymentAttempts.find((a) => {
      const meta =
        typeof a.providerMetadata === "object" && a.providerMetadata !== null
          ? (a.providerMetadata as Record<string, unknown>)
          : {};
      return Boolean(meta.refundId || meta.refundReference);
    });

    if (!attemptWithRefund) continue;

    const meta =
      typeof attemptWithRefund.providerMetadata === "object" &&
      attemptWithRefund.providerMetadata !== null
        ? (attemptWithRefund.providerMetadata as Record<string, unknown>)
        : {};

    const refundLookupKey = (meta.refundId ?? meta.refundReference) as
      | number
      | string
      | undefined;
    if (!refundLookupKey) continue;

    checked += 1;
    const refundRes = await fetchPaystackRefund(refundLookupKey);
    const gatewayStatus = String(refundRes?.data?.status ?? "").toLowerCase();

    if (gatewayStatus === "processed") {
      await reconcilePaystackRefundWebhook({
        eventType: "refund.processed",
        data: {
          ...(refundRes?.data as unknown as Record<string, unknown>),
          transaction_reference: attemptWithRefund.reference,
        },
      });
      settled += 1;
    } else if (gatewayStatus === "failed") {
      await reconcilePaystackRefundWebhook({
        eventType: "refund.failed",
        data: {
          ...(refundRes?.data as unknown as Record<string, unknown>),
          transaction_reference: attemptWithRefund.reference,
        },
      });
    } else if (gatewayStatus === "pending") {
      // Backfill REFUND_INITIATED email if it was previously SKIPPED before .env SMTP was configured
      const alreadySentInitiatedEmail = await prisma.notificationLog.findFirst({
        where: {
          orderId: order.id,
          channel: "EMAIL",
          eventType: "REFUND_INITIATED",
          status: "SENT",
        },
        select: { id: true },
      });

      if (!alreadySentInitiatedEmail) {
        const reason =
          typeof meta.refundReason === "string"
            ? meta.refundReason
            : order.rejectionReason || order.cancellationReason || undefined;
        await notifyRefundInitiated(order, reason).catch(() => {});
      }
    }
  }

  return { checked, settled };
}

