import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluatePaymentRetrySafety } from "@sika/shared";
import prisma from "@/lib/prisma";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { hasGuestReceiptAccess } from "@/lib/auth/guest-receipt";
import { getAuthUser } from "@/lib/auth/session";
import { initializePaystackTransaction, verifyPaystackTransaction } from "@/lib/paystack";
import {
  buildPaystackCallbackUrl,
  reconcilePaystackAttempt,
  resolvePaystackBaseOrigin,
} from "@/lib/payments";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";

const payOrderSchema = z.object({
  clientPlatform: z.enum(["web", "mobile"]).optional().default("web"),
  mobileReturnUrl: z.string().trim().max(300).optional(),
  verifyOnly: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/orders/[id]/pay
 * Accepts either the order ID or orderNumber (`SIKA-...`).
 *
 * Double-Debit Protection & Payment Recovery endpoint:
 * 1. Verifies all prior non-terminal Paystack attempts with Paystack's API BEFORE allowing
 *    any new payment initialization.
 * 2. If a prior attempt succeeded -> reconciles immediately and refuses a second debit (`alreadyPaid: true`).
 * 3. If a MoMo/card attempt is actively pending/ongoing -> returns HTTP 409 asking the user to approve
 *    or wait instead of charging twice.
 * 4. Only initializes a new Paystack checkout URL when all prior attempts failed/abandoned.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`order-pay:${ip}`, {
      limit: 12,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many payment verification requests. Please wait a minute.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = payOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payment verification payload." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const raw = decodeURIComponent(id).trim();
    const cleanOrderNumber = raw.toUpperCase();

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: raw }, { orderNumber: cleanOrderNumber }],
      },
      include: {
        paymentAttempts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (!parsed.data.verifyOnly) {
      const [session, hasGuestCookie] = await Promise.all([
        getAuthUser(req).catch(() => null),
        hasGuestReceiptAccess(order.orderNumber).catch(() => false),
      ]);
      const isOwnerOrStaff =
        Boolean(hasGuestCookie) ||
        (session &&
          (["ADMIN", "STAFF_CASHIER"].includes(session.role) ||
            (order.customerId && order.customerId === session.id))) ||
        (!order.customerId && parsed.data.clientPlatform === "mobile");

      if (!isOwnerOrStaff) {
        return NextResponse.json(
          {
            success: false,
            error: "Please sign in with the account that placed this order to complete payment.",
          },
          { status: 403 }
        );
      }
    }

    if (order.paymentMethod !== "PAYSTACK") {
      return NextResponse.json(
        {
          success: false,
          error: "This order uses cash at handover rather than online Paystack checkout.",
        },
        { status: 400 }
      );
    }

    if (
      order.fulfilmentStatus === "CANCELLED" ||
      order.fulfilmentStatus === "REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Order ${order.orderNumber} is ${order.fulfilmentStatus.toLowerCase()} and cannot accept payment.`,
        },
        { status: 409 }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: true,
          verified: true,
          alreadyPaid: true,
          orderNumber: order.orderNumber,
          paymentStatus: "PAID",
          message: "Payment is already confirmed for this order.",
        },
        { status: 200 }
      );
    }

    const { verifyOnly, clientPlatform, mobileReturnUrl } = parsed.data;
    const candidateLimit = verifyOnly ? 2 : 5;
    const attemptsToCheck = order.paymentAttempts
      .filter((a) => a.status !== "FAILED" && a.status !== "ABANDONED")
      .slice(0, candidateLimit);

    // Fallback: if all local records were marked abandoned/failed but user says they were debited, check latest 2 anyway
    const checkList =
      attemptsToCheck.length > 0
        ? attemptsToCheck
        : order.paymentAttempts.slice(0, 2);

    const gatewayResults: Array<{
      reference: string;
      status: string;
      txData?: Record<string, unknown>;
    }> = [];

    for (const attempt of checkList) {
      try {
        const res = await verifyPaystackTransaction(attempt.reference);
        const st = String(res?.data?.status ?? "abandoned").toLowerCase();
        gatewayResults.push({
          reference: attempt.reference,
          status: st,
          txData: res?.data as unknown as Record<string, unknown>,
        });
        if (st === "success") {
          break;
        }
      } catch {
        gatewayResults.push({
          reference: attempt.reference,
          status: "abandoned",
        });
      }
    }

    const safety = evaluatePaymentRetrySafety(gatewayResults.map((r) => r.status));

    if (safety.action === "ALREADY_PAID") {
      const winner = gatewayResults.find((r) => r.status === "success");
      if (winner) {
        await reconcilePaystackAttempt({
          reference: winner.reference,
          req,
          source: "retry-guard",
          verifiedTxData: winner.txData,
        });
      }
      return NextResponse.json(
        {
          success: true,
          verified: true,
          alreadyPaid: true,
          orderNumber: order.orderNumber,
          paymentStatus: "PAID",
          message: safety.message,
        },
        { status: 200 }
      );
    }

    if (safety.action === "WAIT_PENDING") {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          code: "PAYMENT_IN_PROGRESS",
          orderNumber: order.orderNumber,
          paymentStatus: "PENDING",
          error: safety.message,
        },
        { status: 409 }
      );
    }

    if (verifyOnly) {
      return NextResponse.json(
        {
          success: true,
          verified: false,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          message:
            "No confirmed Paystack debit was found yet. You can safely complete payment below.",
        },
        { status: 200 }
      );
    }

    const customerEmail = order.guestEmail?.trim();
    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer email missing on order record; contact support.",
        },
        { status: 400 }
      );
    }

    // Safely supersede prior abandoned attempts and initialize a single fresh reference
    const newReference = `SIKA_${order.orderNumber}_${Date.now()}`;
    const baseOrigin = resolvePaystackBaseOrigin(req);
    const callbackUrl = buildPaystackCallbackUrl({
      baseOrigin,
      orderNumber: order.orderNumber,
      reference: newReference,
      clientPlatform,
      mobileReturnUrl,
    });

    await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.updateMany({
        where: { orderId: order.id, status: "INITIALIZED" },
        data: { status: "ABANDONED" },
      });

      await tx.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: "PAYSTACK",
          reference: newReference,
          amountPesewas: order.totalPesewas,
          currency: "GHS",
          status: "INITIALIZED",
          providerMetadata: { clientPlatform },
        },
      });
    });

    const paystackInit = await initializePaystackTransaction({
      email: customerEmail,
      amountPesewas: order.totalPesewas,
      reference: newReference,
      callbackUrl,
      metadata: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        fulfilmentType: order.fulfilmentType,
        clientPlatform,
        isRetry: true,
      },
    });

    const authorizationUrl = paystackInit.data.authorization_url;
    await prisma.paymentAttempt.update({
      where: { reference: newReference },
      data: {
        providerMetadata: {
          clientPlatform,
          authorizationUrl,
          accessCode: paystackInit.data.access_code,
        },
      },
    });

    await recordAuditLog({
      action: "PAYMENT_RETRY_INITIALIZED",
      entityType: "Order",
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        reference: newReference,
        clientPlatform,
      },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        verified: false,
        alreadyPaid: false,
        orderNumber: order.orderNumber,
        paymentReference: newReference,
        authorizationUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API v1 Order Pay Retry Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || "Unable to verify or initialize Paystack payment.",
      },
      { status: 500 }
    );
  }
}
