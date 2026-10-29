import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@sika/shared";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, fullName, phone } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        phone,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    const sessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: sessionUser,
        token, // Included for native mobile client storage (expo-secure-store)
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API v1 Auth Register Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to complete registration. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
