import * as crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { recordAuditLog } from "@/lib/audit";
import { getAppUrl } from "@/lib/env";
import { sendStaffInviteNotification } from "@/lib/notifications";

const STAFF_ROLES: Role[] = [
  "ADMIN",
  "STAFF_CASHIER",
  "STAFF_KITCHEN",
  "DELIVERY_RIDER",
];

/**
 * POST /api/v1/admin/staff/[id]/invite
 * Issues a fresh 24-hour password-setup link for an active staff/rider account
 * and dispatches email/SMS notification plus one-time shareable URL for the admin.
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

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Administrator privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const member = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!member || !STAFF_ROLES.includes(member.role)) {
      return NextResponse.json(
        { success: false, error: "Staff or rider account not found." },
        { status: 404 }
      );
    }

    if (!member.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Reactivate this team account before sending an invite link.",
        },
        { status: 400 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: member.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.create({
        data: {
          userId: member.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    const setupLink = `${getAppUrl()}/reset-password?token=${encodeURIComponent(
      rawToken
    )}&invited=1`;

    const delivery = await sendStaffInviteNotification({
      email: member.email,
      phone: member.phone,
      fullName: member.fullName,
      role: member.role,
      setupUrl: setupLink,
      invitedByName: user.fullName,
    });

    await recordAuditLog({
      userId: user.id,
      action: "STAFF_INVITE_SENT",
      entityType: "User",
      entityId: member.id,
      metadata: {
        role: member.role,
        emailSent: delivery.emailSent,
        smsSent: delivery.smsSent,
      },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        setupLink,
        message: `24-hour setup link ready for ${member.fullName}.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API v1 Admin Staff Invite Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate invite link." },
      { status: 500 }
    );
  }
}
