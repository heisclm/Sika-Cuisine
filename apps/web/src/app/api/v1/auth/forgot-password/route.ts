import * as crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";
import { resolvePaystackBaseOrigin } from "@/lib/payments";
import { sendPasswordResetNotification } from "@/lib/notifications";

const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your registered email or phone number.")
    .max(160),
});

const ANTI_ENUMERATION_MESSAGE =
  "If an active account matches those details, password reset instructions have been sent.";

/**
 * Generates normalized Ghanaian phone lookup variants (`0244...`, `+233244...`, `233244...`)
 * so password recovery finds the account regardless of local vs international format.
 */
function buildGhanaPhoneVariants(raw: string): string[] {
  const compact = raw.replace(/[\s\-()]/g, "").trim();
  if (!compact) return [];
  const digits = compact.replace(/[^\d]/g, "");
  const variants = new Set<string>([compact]);

  if (digits.startsWith("233") && digits.length >= 12) {
    const subscriber = digits.slice(3);
    variants.add(`+233${subscriber}`);
    variants.add(`233${subscriber}`);
    variants.add(`0${subscriber}`);
  } else if (digits.startsWith("0") && digits.length === 10) {
    const subscriber = digits.slice(1);
    variants.add(`0${subscriber}`);
    variants.add(`+233${subscriber}`);
    variants.add(`233${subscriber}`);
  }

  return Array.from(variants);
}

/**
 * POST /api/v1/auth/forgot-password
 * Generates a short-lived (30m), SHA-256 hashed password reset token in PostgreSQL
 * and dispatches email/SMS instructions without disclosing account existence.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`forgot-pwd:${ip}`, {
      limit: 5,
      windowMs: 15 * 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many recovery attempts. Please wait 15 minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Please enter an email or phone number.",
        },
        { status: 400 }
      );
    }

    const rawIdentifier = parsed.data.identifier.trim();
    const normalizedEmail = rawIdentifier.toLowerCase();
    const phoneVariants = buildGhanaPhoneVariants(rawIdentifier);

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          { email: normalizedEmail },
          ...(phoneVariants.length > 0 ? [{ phone: { in: phoneVariants } }] : []),
        ],
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
      },
    });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60_000);

      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });
      });

      const baseOrigin = resolvePaystackBaseOrigin(req);
      const resetUrl = `${baseOrigin}/reset-password?token=${encodeURIComponent(
        rawToken
      )}`;

      await sendPasswordResetNotification({
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        resetUrl,
      });

      await recordAuditLog({
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
        req,
      });
    }

    return NextResponse.json(
      { success: true, message: ANTI_ENUMERATION_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 Auth Forgot Password Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to process password recovery right now." },
      { status: 500 }
    );
  }
}
