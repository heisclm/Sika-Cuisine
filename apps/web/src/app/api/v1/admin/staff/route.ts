import * as crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { getAuthUser } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { recordAuditLog } from "@/lib/audit";
import { getAppUrl } from "@/lib/env";
import { sendStaffInviteNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const STAFF_ROLES: Role[] = [
  "ADMIN",
  "STAFF_CASHIER",
  "STAFF_KITCHEN",
  "DELIVERY_RIDER",
];

const createStaffSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").max(120),
    email: z.string().trim().email("Enter a valid email address."),
    phone: z
      .string()
      .trim()
      .min(9, "Enter a valid Ghana phone number.")
      .max(20),
    role: z.enum(["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN", "DELIVERY_RIDER"]),
    password: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || v.length >= 8, "Initial password must be at least 8 characters."),
    sendInvite: z.boolean().optional().default(true),
  })
  .refine((data) => data.sendInvite || (data.password && data.password.length >= 8), {
    message: "Provide an 8+ character password or send a private setup invite link.",
  });

const SAFE_STAFF_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  _count: {
    select: {
      deliveries: true,
    },
  },
} as const;

/**
 * GET /api/v1/admin/staff
 * Lists all Admin, Kitchen Staff, Cashier, and Delivery Rider accounts (strictly ADMIN-only).
 */
export async function GET(req: NextRequest) {
  try {
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

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({ success: true, staff: [] }, { status: 200 });
    }

    const staff = await prisma.user.findMany({
      where: { role: { in: STAFF_ROLES } },
      orderBy: { createdAt: "desc" },
      select: SAFE_STAFF_SELECT,
    });

    return NextResponse.json({ success: true, staff }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Admin Staff GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load team accounts." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/staff
 * Provisions a new staff or delivery rider account (strictly ADMIN-only).
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid team member payload.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `An account already exists with email ${normalizedEmail}.`,
        },
        { status: 409 }
      );
    }

    const rawPassword = parsed.data.password?.trim()
      ? parsed.data.password
      : crypto.randomBytes(32).toString("hex");
    const passwordHash = await hashPassword(rawPassword);

    const member = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone.replace(/\s+/g, ""),
        role: parsed.data.role,
        isActive: true,
        passwordHash,
      },
      select: SAFE_STAFF_SELECT,
    });

    let setupLink: string | undefined;
    let inviteDispatched = false;

    if (parsed.data.sendInvite) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);

      await prisma.passwordResetToken.create({
        data: {
          userId: member.id,
          tokenHash,
          expiresAt,
        },
      });

      setupLink = `${getAppUrl()}/reset-password?token=${encodeURIComponent(
        rawToken
      )}&invited=1`;

      await sendStaffInviteNotification({
        email: member.email,
        phone: member.phone,
        fullName: member.fullName,
        role: member.role,
        setupUrl: setupLink,
        invitedByName: user.fullName,
      }).catch(() => {});
      inviteDispatched = true;
    }

    await recordAuditLog({
      userId: user.id,
      action: "STAFF_ACCOUNT_CREATED",
      entityType: "User",
      entityId: member.id,
      metadata: {
        email: member.email,
        role: member.role,
        inviteDispatched,
      },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        member,
        inviteSent: inviteDispatched,
        ...(setupLink ? { setupLink } : {}),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API v1 Admin Staff POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create team account." },
      { status: 500 }
    );
  }
}
