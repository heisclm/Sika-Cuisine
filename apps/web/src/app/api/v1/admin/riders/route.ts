import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/riders
 * Lists registered delivery riders so cashier and admin staff can dispatch delivery orders.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (!["ADMIN", "STAFF_CASHIER"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions." }, { status: 403 });
    }

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({ success: true, riders: [] }, { status: 200 });
    }

    const riders = await prisma.user.findMany({
      where: { role: "DELIVERY_RIDER", isActive: true },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ success: true, riders }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Admin Riders Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load delivery riders." },
      { status: 500 }
    );
  }
}
