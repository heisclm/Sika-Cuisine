import { NextRequest, NextResponse } from "next/server";
import { clearSession, verifyAuthUserStatus } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const verification = await verifyAuthUserStatus(req);

    if (verification.state === "revoked") {
      await clearSession().catch(() => {});
      return NextResponse.json(
        { success: false, error: "Account has been deactivated or removed." },
        { status: 401 }
      );
    }

    if (verification.state === "db_unavailable") {
      return NextResponse.json(
        {
          success: false,
          error: "Database temporarily unreachable. Please retry in a moment.",
        },
        { status: 503 }
      );
    }

    if (verification.state !== "authenticated") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: verification.user,
    });
  } catch (error: any) {
    console.error("[API v1 Auth Me Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
