import { NextResponse } from "next/server";
import { reconcilePaystackAttempt } from "@/lib/payments";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/v1/payments/verify?reference=...
 * Reconciles a customer's return from Paystack Hosted Checkout directly with Paystack's
 * verification API so orders reflect PAID state even if the async webhook arrives later.
 */
export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`pay-verify:${ip}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many verification requests. Please wait shortly." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference")?.trim() || "";

    if (!reference || reference.length < 6 || !/^[A-Za-z0-9_-]+$/.test(reference)) {
      return NextResponse.json(
        { success: false, error: "Valid payment reference is required." },
        { status: 400 }
      );
    }

    const result = await reconcilePaystackAttempt({
      reference,
      req,
      source: "callback",
    });

    if (!result.found) {
      return NextResponse.json(
        { success: false, error: "Payment reference not found." },
        { status: 404 }
      );
    }

    if (result.mismatch) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: result.error || "Payment currency or amount mismatch.",
        },
        { status: 400 }
      );
    }

    if (result.error) {
      return NextResponse.json(
        { success: false, verified: false, error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        verified: result.verified,
        orderNumber: result.orderNumber,
        paymentStatus: result.paymentStatus,
        gatewayStatus: result.gatewayStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 Payments Verify Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment status." },
      { status: 500 }
    );
  }
}
