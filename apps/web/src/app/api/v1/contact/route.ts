import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import {
  createRoleInAppNotifications,
  renderSikaBusinessEmail,
  sendEmail,
} from "@/lib/notifications";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(24),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(160)
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(5, "Please write a brief message (at least 5 characters).")
    .max(2000),
});

/**
 * POST /api/v1/contact
 * Receives customer inquiries from `/contact`, dispatches a branded business email
 * to the Sika Cuisine Sunyani hospitality inbox, optionally emails an acknowledgement
 * to the customer, and notifies active ADMIN accounts in-app.
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`contact-inquiry:${ip}`, {
      limit: 5,
      windowMs: 15 * 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many messages sent recently. Please wait a few minutes or call us directly.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsed.error.issues[0]?.message ||
            "Please complete all required inquiry fields.",
        },
        { status: 400 }
      );
    }

    const { name, phone, message } = parsed.data;
    const customerEmail = parsed.data.email?.trim() || null;
    const cleanSubject = parsed.data.subject?.trim() || "General Kitchen Inquiry";

    // Resolve restaurant inbox email (env inbox or active admin email fallback)
    let inboxEmail =
      process.env.CONTACT_INBOX_EMAIL?.trim() ||
      process.env.GMAIL_USER?.trim() ||
      process.env.SMTP_USER?.trim() ||
      null;

    if (!inboxEmail && process.env.DATABASE_URL?.trim()) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { email: true },
        orderBy: { createdAt: "asc" },
      });
      inboxEmail = adminUser?.email || null;
    }

    const inquiryEmailHtml = renderSikaBusinessEmail({
      preheader: `New website inquiry from ${name} (${phone}) — ${cleanSubject}`,
      badgeLabel: "New Customer Inquiry",
      tone: "brand",
      headline: cleanSubject,
      greeting: "Hello Sika Cuisine Hospitality Team,",
      paragraphs: [
        `${name} submitted a new inquiry through the Sika Cuisine Sunyani website.`,
      ],
      calloutTitle: "Customer Message",
      calloutBody: message,
      metaRows: [
        { label: "Customer Name", value: name },
        { label: "Phone Number", value: phone, mono: true },
        ...(customerEmail ? [{ label: "Email Address", value: customerEmail }] : []),
        { label: "Topic", value: cleanSubject },
      ],
      securityFootnote:
        "Submitted via the official Sika Cuisine Sunyani contact form.",
    });

    const inquiryPlainText = [
      `New Customer Inquiry — Sika Cuisine Sunyani`,
      `Topic: ${cleanSubject}`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      customerEmail ? `Email: ${customerEmail}` : null,
      ``,
      `Message:`,
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const tasks: Promise<unknown>[] = [];

    if (inboxEmail) {
      tasks.push(
        sendEmail({
          to: inboxEmail,
          subject: `[Sika Inquiry] ${cleanSubject} — ${name}`,
          html: inquiryEmailHtml,
          text: inquiryPlainText,
          eventType: "CONTACT_INQUIRY",
        })
      );
    }

    if (customerEmail) {
      const ackHtml = renderSikaBusinessEmail({
        preheader: "We've received your inquiry at Sika Cuisine Sunyani.",
        badgeLabel: "Inquiry Received",
        tone: "success",
        headline: "We Received Your Message",
        greeting: `Hello ${name.split(/\s+/)[0]},`,
        paragraphs: [
          "Thank you for reaching out to Sika Cuisine in Sunyani. Our hospitality desk has received your message and will respond shortly.",
          "For urgent order assistance or same-day group catering, you can also call us directly or message us on WhatsApp.",
        ],
        metaRows: [
          { label: "Topic", value: cleanSubject },
          { label: "Phone on File", value: phone, mono: true },
        ],
        calloutTitle: "Your Message Summary",
        calloutBody: message,
      });

      tasks.push(
        sendEmail({
          to: customerEmail,
          subject: `We received your inquiry — Sika Cuisine Sunyani`,
          html: ackHtml,
          text: `Hello ${name},\n\nThank you for contacting Sika Cuisine Sunyani regarding "${cleanSubject}". Our team has received your message and will reply shortly.\n\nMessage:\n${message}`,
          eventType: "CONTACT_INQUIRY_ACK",
        })
      );
    }

    tasks.push(
      createRoleInAppNotifications({
        roles: ["ADMIN"],
        type: "CONTACT_INQUIRY",
        title: `New Inquiry: ${cleanSubject}`,
        body: `${name} (${phone}): ${message.slice(0, 140)}`,
        actionUrl: "/admin",
      })
    );

    tasks.push(
      recordAuditLog({
        action: "CONTACT_INQUIRY_SUBMITTED",
        entityType: "ContactInquiry",
        entityId: phone,
        metadata: {
          name,
          phone,
          email: customerEmail,
          subject: cleanSubject,
        },
        req,
      })
    );

    await Promise.allSettled(tasks);

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been delivered to our Sunyani hospitality desk.",
        emailSent: Boolean(inboxEmail),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 Contact POST Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to send your message right now. Please try WhatsApp or phone.",
      },
      { status: 500 }
    );
  }
}
