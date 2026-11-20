import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

/**
 * Terminates the active HTTP-only session cookie for authenticated web customers and staff.
 */
export async function POST() {
  try {
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
