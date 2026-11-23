import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { initiateOrderRefund } from "@/lib/payments";

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

    const session = await getAuthUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only Super Administrators can manually trigger Paystack refunds.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 200)
        : "Manual refund initiated by Super Admin";
    const targetReference =
      typeof body?.reference === "string" && body.reference.trim()
        ? body.reference.trim()
        : undefined;

    const refund = await initiateOrderRefund({
      orderId: id,
      reason,
      initiatedByUserId: session.id,
      initiatedByName: session.fullName,
      targetReference,
      req,
    });

    if (!refund.initiated && !refund.alreadyRefunded) {
      return NextResponse.json(
        {
          success: false,
          error: refund.error || "Unable to initiate Paystack refund.",
          refund,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      refund,
    });
  } catch (error) {
    console.error("[API v1 Admin Refund Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error while initiating refund." },
      { status: 500 }
    );
  }
}
