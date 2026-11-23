import { NextRequest, NextResponse } from "next/server";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { clearSession } from "@/lib/auth/session";

/**
 * Terminates the active HTTP-only session cookie for authenticated web customers and staff.
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API v1 Auth Logout Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to complete sign out." },
      { status: 500 }
    );
  }
}
