import * as crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  invalidateUserSessionCache,
  setSessionCookie,
} from "@/lib/auth/session";
import { getDashboardForRole } from "@sika/shared";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(128),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
});

/**
 * POST /api/v1/auth/reset-password
 * Validates an unexpired hashed reset token, updates the user's password hash,
 * and marks all outstanding reset tokens for the account as consumed atomically.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`reset-pwd:${ip}`, {
      limit: 10,
      windowMs: 15 * 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many password reset attempts. Please wait 15 minutes.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsed.error.issues[0]?.message ||
            "Valid reset token and password (minimum 8 characters) are required.",
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(parsed.data.token)
      .digest("hex");

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    const now = new Date();
    if (
      !record ||
      record.usedAt !== null ||
      record.expiresAt <= now ||
      !record.user?.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, passwordChangedAt: now },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: now },
      });
    });

    invalidateUserSessionCache(record.userId);

    await recordAuditLog({
      userId: record.userId,
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "User",
      entityId: record.userId,
      req,
    });

    const sessionToken = await createSessionToken({
      id: record.user.id,
      email: record.user.email,
      fullName: record.user.fullName,
      phone: record.user.phone,
      role: record.user.role,
    });
    await setSessionCookie(sessionToken);
    const destination = getDashboardForRole(record.user.role);

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been saved and you are now signed in.",
        role: record.user.role,
        redirectPath: destination.path,
        dashboardLabel: destination.label,
        dashboardTitle: destination.title,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 Auth Reset Password Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password right now." },
      { status: 500 }
    );
  }
}
