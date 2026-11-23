import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { getAuthUser, invalidateUserSessionCache } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { recordAuditLog } from "@/lib/audit";

const updateStaffSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().min(9).max(20).optional(),
    role: z
      .enum(["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN", "DELIVERY_RIDER"])
      .optional(),
    isActive: z.boolean().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters.").max(128).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one updatable field is required.",
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
 * PATCH /api/v1/admin/staff/[id]
 * Updates staff/rider profile, role, active state, or resets password cleanly (ADMIN-only).
 * Enforces self-lockout protection so an administrator cannot deactivate or demote themselves.
 */
export async function PATCH(
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
    const body = await req.json();
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid team update payload.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Staff account not found." },
        { status: 404 }
      );
    }

    if (
      target.id === user.id &&
      (parsed.data.isActive === false ||
        (parsed.data.role && parsed.data.role !== "ADMIN"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot deactivate or demote your own administrator account.",
        },
        { status: 400 }
      );
    }

    const updateData: {
      fullName?: string;
      phone?: string;
      role?: "ADMIN" | "STAFF_CASHIER" | "STAFF_KITCHEN" | "DELIVERY_RIDER";
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (parsed.data.fullName !== undefined) {
      updateData.fullName = parsed.data.fullName;
    }
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone.replace(/\s+/g, "");
    }
    if (parsed.data.role !== undefined) {
      updateData.role = parsed.data.role;
    }
    if (parsed.data.isActive !== undefined) {
      updateData.isActive = parsed.data.isActive;
    }
    if (parsed.data.newPassword) {
      updateData.passwordHash = await hashPassword(parsed.data.newPassword);
    }

    const member = await prisma.user.update({
      where: { id: target.id },
      data: updateData,
      select: SAFE_STAFF_SELECT,
    });

    invalidateUserSessionCache(member.id);

    await recordAuditLog({
      userId: user.id,
      action: parsed.data.newPassword ? "STAFF_PASSWORD_RESET" : "STAFF_ACCOUNT_UPDATED",
      entityType: "User",
      entityId: member.id,
      metadata: {
        role: member.role,
        isActive: member.isActive,
        passwordReset: Boolean(parsed.data.newPassword),
      },
      req,
    });

    return NextResponse.json({ success: true, member }, { status: 200 });
  } catch (error: any) {
    console.error("[API v1 Admin Staff PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update team account." },
      { status: 500 }
    );
  }
}
