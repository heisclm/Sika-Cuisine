/**
 * @file apps/web/src/lib/notifications.ts
 * @description Non-blocking multi-channel notification service for Sika Cuisine:
 * - Email receipts, milestone updates & password reset links via Resend
 * - Ghanaian SMS alerts via Arkesel v2 or Hubtel fallback
 * - Native Expo Push notifications with DeviceNotRegistered cleanup
 * - Audit trail persistence in PostgreSQL (`NotificationLog`)
 */

import fs from "fs";
import path from "path";
import nodemailer, { type Transporter } from "nodemailer";
import { Role } from "@prisma/client";
import {
  formatFulfilmentTypeLabel,
  formatPaymentMethodLabel,
  formatPesewasToGhs,
  RESTAURANT_INFO,
} from "@sika/shared";
import { getAppUrl } from "./env";
import { prisma } from "./prisma";

interface CachedSmtpTransport {
  key: string;
  provider: string;
  defaultFrom: string;
  transporter: Transporter;
}

let cachedSmtp: CachedSmtpTransport | null = null;

/**
 * In Next.js 16 Turbopack monorepos, `next.config.ts` runs in an isolated config worker,
 * so App Route workers launched inside `apps/web` may not inherit newly added root `../../.env`
 * variables without a full restart. This hydrates missing notification env keys from the root `.env` on demand.
 */
function hydrateRootEnvIfMissing(): void {
  if (
    (process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim()) ||
    process.env.RESEND_API_KEY?.trim() ||
    (process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim())
  ) {
    return;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  for (const envPath of candidatePaths) {
    try {
      if (!fs.existsSync(envPath)) continue;
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx <= 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1).trim();
        }
        if (key && val && !process.env[key]?.trim()) {
          process.env[key] = val;
        }
      }
    } catch {
      // Ignore filesystem read errors in restricted runtimes
    }
  }
}

function resolveSmtpTransport(): CachedSmtpTransport | null {
  hydrateRootEnvIfMissing();

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || "587");

  if (smtpHost && smtpUser && smtpPass) {
    const key = `smtp:${smtpHost}:${smtpPort}:${smtpUser}:${smtpPass.length}`;
    if (!cachedSmtp || cachedSmtp.key !== key) {
      cachedSmtp = {
        key,
        provider: "smtp",
        defaultFrom:
          process.env.EMAIL_FROM?.trim() || `Sika Cuisine <${smtpUser}>`,
        transporter: nodemailer.createTransport({
          host: smtpHost,
          port: Number.isFinite(smtpPort) ? smtpPort : 587,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        }),
      };
    }
    return cachedSmtp;
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPassRaw = process.env.GMAIL_APP_PASSWORD?.trim();
  const gmailPass = gmailPassRaw ? gmailPassRaw.replace(/\s+/g, "") : "";

  if (gmailUser && gmailPass) {
    const key = `gmail:${gmailUser}:${gmailPass.length}`;
    if (!cachedSmtp || cachedSmtp.key !== key) {
      cachedSmtp = {
        key,
        provider: "gmail-smtp",
        defaultFrom:
          process.env.EMAIL_FROM?.trim() || `Sika Cuisine <${gmailUser}>`,
        transporter: nodemailer.createTransport({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailPass },
        }),
      };
    }
    return cachedSmtp;
  }

  return null;
}

function isLiveEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || resolveSmtpTransport());
}

/**
 * Persists an in-app notification for a single signed-in user without ever
 * blocking order checkout or status transitions if a transient DB hiccup occurs.
 */
export async function createInAppNotification(params: {
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  orderNumber?: string | null;
  actionUrl?: string | null;
}): Promise<void> {
  if (!params.userId || !process.env.DATABASE_URL?.trim()) return;
  try {
    await prisma.inAppNotification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        orderNumber: params.orderNumber ?? null,
        actionUrl: params.actionUrl ?? null,
      },
    });
  } catch (err) {
    console.warn("[InAppNotification] Write failed:", err);
  }
}

/**
 * Broadcasts an in-app notification to all active users matching `roles`
 * (e.g. Cashier & Admin for new incoming orders, Kitchen for confirmed tickets).
 */
export async function createRoleInAppNotifications(params: {
  roles: Role[];
  type: string;
  title: string;
  body: string;
  orderNumber?: string | null;
  actionUrl?: string | null;
}): Promise<void> {
  if (params.roles.length === 0 || !process.env.DATABASE_URL?.trim()) return;
  try {
    const recipients = await prisma.user.findMany({
      where: { role: { in: params.roles }, isActive: true },
      select: { id: true },
      take: 40,
    });
    if (recipients.length === 0) return;

    await prisma.inAppNotification.createMany({
      data: recipients.map((u) => ({
        userId: u.id,
        type: params.type,
        title: params.title,
        body: params.body,
        orderNumber: params.orderNumber ?? null,
        actionUrl: params.actionUrl ?? null,
      })),
    });
  } catch (err) {
    console.warn("[InAppNotification] Role broadcast failed:", err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type SikaEmailTone = "brand" | "success" | "warning" | "error";

export interface SikaEmailMetaRow {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}

export interface SikaEmailLineItem {
  name: string;
  quantity: number;
  subtotalFormatted: string;
}

export interface SikaBusinessEmailOptions {
  preheader: string;
  badgeLabel: string;
  tone?: SikaEmailTone;
  headline: string;
  greeting?: string;
  paragraphs: string[];
  calloutTitle?: string;
  calloutBody?: string;
  metaRows?: SikaEmailMetaRow[];
  items?: SikaEmailLineItem[];
  totalLabel?: string;
  totalFormatted?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  referenceCode?: string;
  securityFootnote?: string;
}

const EMAIL_TONE_PALETTE: Record<
  SikaEmailTone,
  {
    accentBar: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    calloutBg: string;
    calloutBorder: string;
    calloutTitle: string;
  }
> = {
  brand: {
    accentBar: "#D71920",
    badgeBg: "rgba(215, 25, 32, 0.14)",
    badgeBorder: "#7F1D1D",
    badgeText: "#F0444A",
    calloutBg: "#1F1617",
    calloutBorder: "#5C1D20",
    calloutTitle: "#F0444A",
  },
  success: {
    accentBar: "#22C55E",
    badgeBg: "rgba(34, 197, 94, 0.14)",
    badgeBorder: "#14532D",
    badgeText: "#4ADE80",
    calloutBg: "#132219",
    calloutBorder: "#1E462D",
    calloutTitle: "#4ADE80",
  },
  warning: {
    accentBar: "#EAB308",
    badgeBg: "rgba(234, 179, 8, 0.14)",
    badgeBorder: "#713F12",
    badgeText: "#FACC15",
    calloutBg: "#231E12",
    calloutBorder: "#5C4813",
    calloutTitle: "#FACC15",
  },
  error: {
    accentBar: "#F43F5E",
    badgeBg: "rgba(244, 63, 94, 0.14)",
    badgeBorder: "#881337",
    badgeText: "#FDA4AF",
    calloutBg: "#251419",
    calloutBorder: "#691B2C",
    calloutTitle: "#FDA4AF",
  },
};

function formatEmailTimestampGmt(date: Date = new Date()): string {
  try {
    return (
      date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "GMT",
      }) + " GMT"
    );
  } catch {
    return date.toUTCString();
  }
}

/**
 * Renders a table-based, email-client-compatible (Gmail, Apple Mail, Outlook)
 * branded HTML business email for Sika Cuisine Sunyani with inbox preheader,
 * official masthead, structured metadata table, itemized receipt, CTA button, and verified footer.
 */
export function renderSikaBusinessEmail(options: SikaBusinessEmailOptions): string {
  const tone = options.tone ?? "brand";
  const palette = EMAIL_TONE_PALETTE[tone];
  const issuedAt = formatEmailTimestampGmt();

  const paragraphsHtml = options.paragraphs
    .filter((p) => Boolean(p && p.trim()))
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:24px;color:#D4D0C8;">${p}</p>`
    )
    .join("");

  const calloutHtml =
    options.calloutTitle || options.calloutBody
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background-color:${palette.calloutBg};border:1px solid ${palette.calloutBorder};border-radius:12px;">
          <tr>
            <td style="padding:16px 18px;">
              ${
                options.calloutTitle
                  ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${palette.calloutTitle};margin-bottom:6px;">${escapeHtml(
                      options.calloutTitle
                    )}</div>`
                  : ""
              }
              ${
                options.calloutBody
                  ? `<div style="font-size:13.5px;line-height:21px;color:#F5F1EA;">${escapeHtml(
                      options.calloutBody
                    )}</div>`
                  : ""
              }
            </td>
          </tr>
        </table>
      `
      : "";

  const metaRowsHtml =
    options.metaRows && options.metaRows.length > 0
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#1E1E1E;border:1px solid #2E2E2E;border-radius:12px;overflow:hidden;">
          ${options.metaRows
            .map((row, idx) => {
              const isLast = idx === (options.metaRows?.length ?? 0) - 1;
              const borderBottom = isLast ? "none" : "1px solid #2A2A2A";
              const valueColor = row.highlight ? palette.badgeText : "#F5F1EA";
              const fontFamily = row.mono
                ? "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
                : "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
              return `
                <tr>
                  <td style="padding:12px 16px;font-size:13px;color:#A3A3A3;border-bottom:${borderBottom};width:44%;">
                    ${escapeHtml(row.label)}
                  </td>
                  <td align="right" style="padding:12px 16px;font-size:13.5px;font-weight:700;color:${valueColor};font-family:${fontFamily};border-bottom:${borderBottom};">
                    ${escapeHtml(row.value)}
                  </td>
                </tr>
              `;
            })
            .join("")}
        </table>
      `
      : "";

  const itemsTableHtml =
    options.items && options.items.length > 0
      ? `
        <div style="margin:22px 0 8px 0;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#A3A3A3;">
          Itemized Order Summary
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background-color:#1E1E1E;border:1px solid #2E2E2E;border-radius:12px;overflow:hidden;">
          ${options.items
            .map(
              (item) => `
                <tr>
                  <td style="padding:12px 16px;font-size:13.5px;color:#F5F1EA;border-bottom:1px solid #2A2A2A;">
                    <span style="display:inline-block;min-width:26px;font-weight:800;color:#F0444A;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">${
                      item.quantity
                    }x</span>
                    <span style="font-weight:600;">${escapeHtml(item.name)}</span>
                  </td>
                  <td align="right" style="padding:12px 16px;font-size:13.5px;font-weight:700;color:#F5F1EA;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;border-bottom:1px solid #2A2A2A;white-space:nowrap;">
                    ${escapeHtml(item.subtotalFormatted)}
                  </td>
                </tr>
              `
            )
            .join("")}
          ${
            options.totalFormatted
              ? `
                <tr style="background-color:#252020;">
                  <td style="padding:14px 16px;font-size:14px;font-weight:800;color:#FFFFFF;">
                    ${escapeHtml(options.totalLabel || "Order Total")}
                  </td>
                  <td align="right" style="padding:14px 16px;font-size:16px;font-weight:900;color:#F0444A;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;">
                    ${escapeHtml(options.totalFormatted)}
                  </td>
                </tr>
              `
              : ""
          }
        </table>
      `
      : "";

  const ctaHtml =
    options.ctaLabel && options.ctaUrl
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 18px 0;">
          <tr>
            <td align="center">
              <a href="${escapeHtml(
                options.ctaUrl
              )}" style="display:inline-block;background-color:#D71920;color:#FFFFFF;font-size:14.5px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;border:1px solid #F0444A;">
                ${escapeHtml(options.ctaLabel)} &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:10px;font-size:11.5px;color:#737373;word-break:break-all;">
              Or copy direct link: <a href="${escapeHtml(
                options.ctaUrl
              )}" style="color:#A3A3A3;text-decoration:underline;">${escapeHtml(
          options.ctaUrl
        )}</a>
            </td>
          </tr>
        </table>
      `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <title>${escapeHtml(options.headline)} — Sika Cuisine</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0B0B;color:#F5F1EA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Inbox Preview Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0B0B0B;">
    ${escapeHtml(options.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0B0B;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#161616;border:1px solid #2A2A2A;border-radius:18px;overflow:hidden;">
          <!-- Top Brand Accent Bar -->
          <tr>
            <td style="height:4px;background-color:${palette.accentBar};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Official Brand Masthead -->
          <tr>
            <td style="padding:24px 28px 20px 28px;border-bottom:1px solid #262626;background-color:#1B1B1B;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right:12px;">
                          <div style="width:40px;height:40px;border-radius:20px;background-color:#101010;border:1.5px solid #D71920;text-align:center;line-height:40px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:900;color:#FFFFFF;letter-spacing:0.5px;">
                            SC
                          </div>
                        </td>
                        <td valign="middle">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:900;color:#FFFFFF;letter-spacing:0.4px;">
                            SIKA CUISINE<span style="color:#D71920;">.</span>
                          </div>
                          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.4px;color:#A3A3A3;margin-top:2px;">
                            Commercial Street &middot; Sunyani
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:5px 11px;border-radius:999px;background-color:${palette.badgeBg};border:1px solid ${palette.badgeBorder};color:${palette.badgeText};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;">
                      ${escapeHtml(options.badgeLabel)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding:28px 28px 22px 28px;">
              ${
                options.referenceCode
                  ? `<div style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;font-weight:700;color:#A3A3A3;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                      Reference ${escapeHtml(options.referenceCode)}
                    </div>`
                  : ""
              }
              <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:31px;font-weight:800;color:#FFFFFF;">
                ${escapeHtml(options.headline)}
              </h1>

              ${
                options.greeting
                  ? `<p style="margin:0 0 12px 0;font-size:15px;font-weight:700;color:#F5F1EA;">${escapeHtml(
                      options.greeting
                    )}</p>`
                  : ""
              }

              ${paragraphsHtml}
              ${calloutHtml}
              ${metaRowsHtml}
              ${itemsTableHtml}
              ${ctaHtml}
            </td>
          </tr>

          <!-- Customer Care & Direct Contact Strip -->
          <tr>
            <td style="padding:18px 28px;background-color:#121212;border-top:1px solid #262626;border-bottom:1px solid #262626;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12.5px;line-height:19px;color:#A3A3A3;">
                    <strong style="color:#F5F1EA;">Need help with your order?</strong><br />
                    Call our Sunyani front desk directly at <a href="tel:${escapeHtml(
                      RESTAURANT_INFO.primaryPhoneIntl
                    )}" style="color:#F0444A;text-decoration:none;font-weight:700;">${escapeHtml(
    RESTAURANT_INFO.primaryPhone
  )}</a> or <a href="tel:${escapeHtml(
    RESTAURANT_INFO.secondaryPhoneIntl
  )}" style="color:#F0444A;text-decoration:none;font-weight:700;">${escapeHtml(
    RESTAURANT_INFO.secondaryPhone
  )}</a>, or message us on <a href="${escapeHtml(
    RESTAURANT_INFO.whatsappBaseUrl
  )}" style="color:#4ADE80;text-decoration:none;font-weight:700;">WhatsApp</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Official Business Footer -->
          <tr>
            <td style="padding:20px 28px;background-color:#101010;font-size:11.5px;line-height:18px;color:#737373;">
              <div style="font-weight:700;color:#A3A3A3;margin-bottom:3px;">
                ${escapeHtml(RESTAURANT_INFO.brandName)} &middot; ${escapeHtml(
    RESTAURANT_INFO.address
  )}
              </div>
              <div style="margin-bottom:8px;">
                Service Hours: ${escapeHtml(
                  RESTAURANT_INFO.hoursWeekday
                )} &bull; ${escapeHtml(RESTAURANT_INFO.hoursSunday)}
              </div>
              ${
                options.securityFootnote
                  ? `<div style="margin-bottom:8px;color:#A3A3A3;">${escapeHtml(
                      options.securityFootnote
                    )}</div>`
                  : ""
              }
              <div style="color:#525252;">
                Issued ${escapeHtml(
                  issuedAt
                )} &bull; Official transactional message from Sika Cuisine Sunyani.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Normalizes Ghanaian mobile numbers to international format without leading `+` (`233XXXXXXXXX`)
 * expected by Arkesel and Hubtel SMS gateways.
 */
export function normalizeGhanaSmsPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("233") && digits.length >= 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }
  return digits;
}

async function logNotification(entry: {
  channel: string;
  provider: string;
  recipient: string;
  eventType: string;
  orderId?: string | null;
  status: string;
  errorMessage?: string | null;
}): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) return;
  try {
    await prisma.notificationLog.create({
      data: {
        channel: entry.channel,
        provider: entry.provider,
        recipient: entry.recipient,
        eventType: entry.eventType,
        orderId: entry.orderId ?? null,
        status: entry.status,
        errorMessage: entry.errorMessage ?? null,
      },
    });
  } catch (err) {
    console.warn("[NotificationLog] Write failed:", err);
  }
}

export async function sendEmail(params: {
  to?: string | null;
  subject: string;
  html: string;
  text: string;
  eventType: string;
  orderId?: string | null;
}): Promise<boolean> {
  const recipient = params.to?.trim();
  if (!recipient || !recipient.includes("@")) return false;

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "Sika Cuisine <orders@sikacuisine.com>";

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => res.statusText);
        await logNotification({
          channel: "EMAIL",
          provider: "resend",
          recipient,
          eventType: params.eventType,
          orderId: params.orderId,
          status: "FAILED",
          errorMessage: `HTTP ${res.status}: ${errBody.slice(0, 200)}`,
        });
        return false;
      }

      await logNotification({
        channel: "EMAIL",
        provider: "resend",
        recipient,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "SENT",
      });
      return true;
    } catch (err: any) {
      await logNotification({
        channel: "EMAIL",
        provider: "resend",
        recipient,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "FAILED",
        errorMessage: String(err?.message || err).slice(0, 200),
      });
      return false;
    }
  }

  const smtp = resolveSmtpTransport();
  if (smtp) {
    try {
      await smtp.transporter.sendMail({
        from: smtp.defaultFrom,
        to: recipient,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      await logNotification({
        channel: "EMAIL",
        provider: smtp.provider,
        recipient,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "SENT",
      });
      return true;
    } catch (err: any) {
      await logNotification({
        channel: "EMAIL",
        provider: smtp.provider,
        recipient,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "FAILED",
        errorMessage: String(err?.message || err).slice(0, 200),
      });
      return false;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[Notifications:Email:SKIPPED] to=${recipient} subject="${params.subject}"`
    );
  }
  await logNotification({
    channel: "EMAIL",
    provider: "console",
    recipient,
    eventType: params.eventType,
    orderId: params.orderId,
    status: "SKIPPED",
    errorMessage: "No email provider (RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD) configured",
  });
  return false;
}

export async function sendSms(params: {
  to?: string | null;
  message: string;
  eventType: string;
  orderId?: string | null;
}): Promise<boolean> {
  const normalized = params.to ? normalizeGhanaSmsPhone(params.to) : "";
  if (!normalized || normalized.length < 10) return false;

  const sender = (process.env.SMS_SENDER_ID?.trim() || "SikaCuisine").slice(0, 11);
  const arkeselKey = process.env.ARKESEL_API_KEY?.trim();
  const hubtelId = process.env.HUBTEL_CLIENT_ID?.trim();
  const hubtelSecret = process.env.HUBTEL_CLIENT_SECRET?.trim();

  if (arkeselKey) {
    try {
      const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
        method: "POST",
        headers: {
          "api-key": arkeselKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender,
          message: params.message,
          recipients: [normalized],
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => res.statusText);
        await logNotification({
          channel: "SMS",
          provider: "arkesel",
          recipient: normalized,
          eventType: params.eventType,
          orderId: params.orderId,
          status: "FAILED",
          errorMessage: `HTTP ${res.status}: ${errBody.slice(0, 200)}`,
        });
        return false;
      }

      await logNotification({
        channel: "SMS",
        provider: "arkesel",
        recipient: normalized,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "SENT",
      });
      return true;
    } catch (err: any) {
      await logNotification({
        channel: "SMS",
        provider: "arkesel",
        recipient: normalized,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "FAILED",
        errorMessage: String(err?.message || err).slice(0, 200),
      });
      return false;
    }
  }

  if (hubtelId && hubtelSecret) {
    try {
      const basicAuth = Buffer.from(`${hubtelId}:${hubtelSecret}`).toString("base64");
      const res = await fetch("https://smsc.hubtel.com/v1/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: sender,
          To: normalized,
          Content: params.message,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => res.statusText);
        await logNotification({
          channel: "SMS",
          provider: "hubtel",
          recipient: normalized,
          eventType: params.eventType,
          orderId: params.orderId,
          status: "FAILED",
          errorMessage: `HTTP ${res.status}: ${errBody.slice(0, 200)}`,
        });
        return false;
      }

      await logNotification({
        channel: "SMS",
        provider: "hubtel",
        recipient: normalized,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "SENT",
      });
      return true;
    } catch (err: any) {
      await logNotification({
        channel: "SMS",
        provider: "hubtel",
        recipient: normalized,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "FAILED",
        errorMessage: String(err?.message || err).slice(0, 200),
      });
      return false;
    }
  }

  await logNotification({
    channel: "SMS",
    provider: "console",
    recipient: normalized,
    eventType: params.eventType,
    orderId: params.orderId,
    status: "SKIPPED",
    errorMessage: "No SMS gateway credentials configured",
  });
  return false;
}

export async function sendExpoPush(params: {
  userId?: string | null;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  eventType: string;
  orderId?: string | null;
}): Promise<boolean> {
  if (!params.userId || !process.env.DATABASE_URL?.trim()) return false;

  try {
    const devices = await prisma.pushDeviceToken.findMany({
      where: { userId: params.userId, isActive: true },
      select: { id: true, expoPushToken: true },
    });

    if (devices.length === 0) return false;

    const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const messages = devices.map((d) => ({
      to: d.expoPushToken,
      sound: "default",
      title: params.title,
      body: params.body,
      data: params.data ?? {},
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      await logNotification({
        channel: "PUSH",
        provider: "expo",
        recipient: params.userId,
        eventType: params.eventType,
        orderId: params.orderId,
        status: "FAILED",
        errorMessage: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
      });
      return false;
    }

    const payload = await res.json().catch(() => null);
    const tickets: Array<{ status?: string; details?: { error?: string } }> =
      Array.isArray(payload?.data) ? payload.data : [];

    for (let i = 0; i < tickets.length; i += 1) {
      const ticket = tickets[i];
      const device = devices[i];
      if (
        device &&
        ticket?.status === "error" &&
        ticket?.details?.error === "DeviceNotRegistered"
      ) {
        await prisma.pushDeviceToken
          .update({ where: { id: device.id }, data: { isActive: false } })
          .catch(() => {});
      }
    }

    await logNotification({
      channel: "PUSH",
      provider: "expo",
      recipient: params.userId,
      eventType: params.eventType,
      orderId: params.orderId,
      status: "SENT",
    });
    return true;
  } catch (err: any) {
    await logNotification({
      channel: "PUSH",
      provider: "expo",
      recipient: params.userId,
      eventType: params.eventType,
      orderId: params.orderId,
      status: "FAILED",
      errorMessage: String(err?.message || err).slice(0, 200),
    });
    return false;
  }
}

export async function sendPasswordResetNotification(params: {
  email: string;
  phone?: string | null;
  fullName: string;
  resetUrl: string;
}): Promise<void> {
  if (process.env.NODE_ENV !== "production" && !isLiveEmailConfigured()) {
    console.info(
      `[PasswordReset Dev Link] ${params.email} -> ${params.resetUrl}`
    );
  }

  await sendEmail({
    to: params.email,
    subject: "Sika Cuisine — Password Reset Instructions",
    eventType: "PASSWORD_RESET",
    html: renderSikaBusinessEmail({
      preheader: `Reset your Sika Cuisine account password. This secure link expires in 30 minutes.`,
      badgeLabel: "Account Security",
      tone: "brand",
      headline: "Password Reset Request",
      greeting: `Dear ${params.fullName},`,
      paragraphs: [
        "We received a request to reset the password associated with your Sika Cuisine account.",
        "Click the secure button below within the next 30 minutes to choose a new password. For your protection, this link can only be used once.",
      ],
      metaRows: [
        { label: "Account Holder", value: params.fullName },
        { label: "Registered Email", value: params.email, mono: true },
        { label: "Link Validity", value: "30 Minutes (Single-Use)", highlight: true },
      ],
      ctaLabel: "Reset My Password",
      ctaUrl: params.resetUrl,
      securityFootnote:
        "If you did not request a password reset, no changes have been made to your account and you can safely disregard this message. Sika Cuisine staff will never ask for your password or reset link.",
    }),
    text: `Dear ${params.fullName},\n\nWe received a request to reset your Sika Cuisine account password.\nUse this secure link within 30 minutes to choose a new password:\n${params.resetUrl}\n\nIf you did not request this reset, no changes have been made to your account and you may safely ignore this email.\n\nSika Cuisine Sunyani · ${RESTAURANT_INFO.address} · ${RESTAURANT_INFO.primaryPhone}`,
  });

  if (
    params.phone &&
    (process.env.ARKESEL_API_KEY?.trim() ||
      (process.env.HUBTEL_CLIENT_ID?.trim() && process.env.HUBTEL_CLIENT_SECRET?.trim()))
  ) {
    await sendSms({
      to: params.phone,
      eventType: "PASSWORD_RESET",
      message: `Sika Cuisine: A password reset link was sent to your registered email (${params.email}). Expires in 30 mins.`,
    });
  }
}

export async function sendStaffInviteNotification(params: {
  email: string;
  phone?: string | null;
  fullName: string;
  role: string;
  setupUrl: string;
  invitedByName: string;
}): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const humanRole = params.role.replace(/_/g, " ");

  if (process.env.NODE_ENV !== "production" && !isLiveEmailConfigured()) {
    console.info(
      `[StaffInvite Dev Link] ${params.email} (${params.role}) -> ${params.setupUrl}`
    );
  }

  const [emailSent, smsSent] = await Promise.all([
    sendEmail({
      to: params.email,
      subject: `Sika Cuisine — Activate Your ${humanRole} Account`,
      eventType: "STAFF_INVITE",
      html: renderSikaBusinessEmail({
        preheader: `${params.invitedByName} invited you to Sika Cuisine Sunyani as ${humanRole}. Activate your workspace within 24 hours.`,
        badgeLabel: "Team Onboarding",
        tone: "brand",
        headline: "Activate Your Staff Account",
        greeting: `Welcome to the team, ${params.fullName},`,
        paragraphs: [
          `${params.invitedByName} has provisioned your official staff credentials for Sika Cuisine Sunyani.`,
          "Use the activation button below within 24 hours to set your private password and sign in to your assigned operations console.",
        ],
        metaRows: [
          { label: "Team Member", value: params.fullName },
          { label: "Assigned Role", value: humanRole, highlight: true },
          { label: "Sign-In Email", value: params.email, mono: true },
          { label: "Authorized By", value: params.invitedByName },
          { label: "Invitation Expiry", value: "24 Hours" },
        ],
        ctaLabel: "Activate Account & Set Password",
        ctaUrl: params.setupUrl,
        securityFootnote:
          "This onboarding link is confidential and intended solely for the recipient named above.",
      }),
      text: `Hello ${params.fullName},\n\n${params.invitedByName} provisioned your ${humanRole} account at Sika Cuisine Sunyani.\nActivate your account and set your private password within 24 hours:\n${params.setupUrl}\n\nSika Cuisine Sunyani · ${RESTAURANT_INFO.address}`,
    }),
    params.phone &&
    (process.env.ARKESEL_API_KEY?.trim() ||
      (process.env.HUBTEL_CLIENT_ID?.trim() && process.env.HUBTEL_CLIENT_SECRET?.trim()))
      ? sendSms({
          to: params.phone,
          eventType: "STAFF_INVITE",
          message: `Sika Cuisine: ${params.invitedByName} invited you as ${humanRole}. Activate & set your password via ${params.setupUrl}`,
        })
      : Promise.resolve(false),
  ]);

  return { emailSent, smsSent };
}

export async function notifyRiderAssigned(params: {
  riderId: string;
  riderName: string;
  riderPhone?: string | null;
  orderId: string;
  orderNumber: string;
  recipientName?: string | null;
  areaLocality?: string | null;
  landmark?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  totalPesewas: number;
}): Promise<void> {
  const locality = params.areaLocality?.trim() || "Sunyani";
  const landmarkPart = params.landmark?.trim() ? ` near ${params.landmark.trim()}` : "";
  const isCodPending =
    params.paymentMethod === "CASH_ON_DELIVERY" && params.paymentStatus !== "PAID";
  const paymentNote = isCodPending
    ? `Collect ${formatPesewasToGhs(params.totalPesewas)} COD`
    : "Prepaid (Collect GH₵ 0.00)";
  const recipient = params.recipientName?.trim() || "Customer";

  await Promise.all([
    createInAppNotification({
      userId: params.riderId,
      type: "RIDER_ASSIGNED",
      title: `New Drop Assigned: #${params.orderNumber}`,
      body: `${recipient} · ${locality}${landmarkPart} (${paymentNote})`,
      orderNumber: params.orderNumber,
      actionUrl: "/rider",
    }),
    sendExpoPush({
      userId: params.riderId,
      eventType: "RIDER_ORDER_ASSIGNED",
      orderId: params.orderId,
      title: `New Drop Assigned: #${params.orderNumber}`,
      body: `${recipient} · ${locality}${landmarkPart} (${paymentNote})`,
      data: {
        type: "RIDER_ASSIGNMENT",
        orderNumber: params.orderNumber,
        orderId: params.orderId,
      },
    }),
    sendSms({
      to: params.riderPhone,
      eventType: "RIDER_ORDER_ASSIGNED",
      orderId: params.orderId,
      message: `Sika Dispatch ${params.riderName}: Drop #${params.orderNumber} assigned for ${recipient} (${locality}${landmarkPart}). ${paymentNote}.`,
    }),
  ]);
}

export interface NotifiableOrder {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  assignedRiderId?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestName?: string | null;
  fulfilmentType: string;
  paymentMethod?: string;
  totalPesewas: number;
  items?: Array<{
    itemNameSnapshot: string;
    quantity: number;
    subtotalPesewas: number;
  }>;
}

async function resolveOrderContacts(order: NotifiableOrder): Promise<{
  email: string | null;
  phone: string | null;
  name: string;
}> {
  let email = order.guestEmail?.trim() || null;
  let phone = order.guestPhone?.trim() || null;
  let name = order.guestName?.trim() || "Valued Guest";

  if ((!email || !phone) && order.customerId && process.env.DATABASE_URL?.trim()) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: order.customerId },
        select: { email: true, phone: true, fullName: true },
      });
      if (user) {
        email = email || user.email;
        phone = phone || user.phone;
        name = order.guestName?.trim() || user.fullName;
      }
    } catch {
    }
  }

  return { email, phone, name };
}

function mapOrderItemsForEmail(
  order: NotifiableOrder
): SikaEmailLineItem[] | undefined {
  if (!order.items || order.items.length === 0) return undefined;
  return order.items.map((item) => ({
    name: item.itemNameSnapshot,
    quantity: item.quantity,
    subtotalFormatted: formatPesewasToGhs(item.subtotalPesewas),
  }));
}

export async function notifyOrderCreated(order: NotifiableOrder): Promise<void> {
  const { email, phone, name } = await resolveOrderContacts(order);
  const totalFormatted = formatPesewasToGhs(order.totalPesewas);
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/orders/${encodeURIComponent(order.orderNumber)}`;
  const fulfilmentLabel = formatFulfilmentTypeLabel(order.fulfilmentType);
  const paymentLabel = order.paymentMethod
    ? formatPaymentMethodLabel(order.paymentMethod)
    : "Cash / Online";

  const itemsText = (order.items ?? [])
    .map(
      (i) => `${i.quantity}x ${i.itemNameSnapshot} (${formatPesewasToGhs(i.subtotalPesewas)})`
    )
    .join(", ");

  await Promise.all([
    createInAppNotification({
      userId: order.customerId,
      type: "ORDER_SUBMITTED",
      title: `Order Submitted (#${order.orderNumber})`,
      body: `Your ${order.fulfilmentType.toLowerCase()} order (${totalFormatted}) was sent to our front desk and is awaiting cashier confirmation.`,
      orderNumber: order.orderNumber,
      actionUrl: `/orders/${encodeURIComponent(order.orderNumber)}`,
    }),
    createRoleInAppNotifications({
      roles: ["ADMIN", "STAFF_CASHIER"],
      type: "NEW_CASHIER_ORDER",
      title: `New Order #${order.orderNumber} Waiting`,
      body: `${name} submitted a ${order.fulfilmentType.toLowerCase()} order (${totalFormatted}). Confirm to send to kitchen.`,
      orderNumber: order.orderNumber,
      actionUrl: "/cashier",
    }),
    sendEmail({
      to: email,
      eventType: "ORDER_CREATED",
      orderId: order.id,
      subject: `Sika Cuisine — Order #${order.orderNumber} Received`,
      html: renderSikaBusinessEmail({
        preheader: `We have received your Sika Cuisine order #${order.orderNumber} (${totalFormatted}). Our Sunyani front desk is reviewing it now.`,
        badgeLabel: "Awaiting Confirmation",
        tone: "warning",
        referenceCode: `#${order.orderNumber}`,
        headline: "We Have Received Your Order",
        greeting: `Dear ${name},`,
        paragraphs: [
          `Thank you for dining with Sika Cuisine Sunyani. Your order has been sent to our Commercial Street front desk and is currently awaiting cashier confirmation.`,
          `As soon as our cashier verifies your order and sends it to the kitchen, you will receive an immediate confirmation alert.`,
        ],
        metaRows: [
          { label: "Order Reference", value: `#${order.orderNumber}`, mono: true },
          { label: "Fulfilment Method", value: fulfilmentLabel },
          { label: "Payment Method", value: paymentLabel },
          {
            label: "Current Status",
            value: "Awaiting Cashier Confirmation",
            highlight: true,
          },
        ],
        items: mapOrderItemsForEmail(order),
        totalLabel: "Order Total",
        totalFormatted,
        ctaLabel: "Track Live Order & View Receipt",
        ctaUrl: trackUrl,
      }),
      text: `Thank you ${name}! Your Sika Cuisine order #${order.orderNumber} (${totalFormatted}) has been received and is awaiting cashier confirmation. ${itemsText ? `Items: ${itemsText}. ` : ""}Track live: ${trackUrl}`,
    }),
    sendSms({
      to: phone,
      eventType: "ORDER_CREATED",
      orderId: order.id,
      message: `Sika Cuisine: Order #${order.orderNumber} submitted (${totalFormatted}) and awaiting cashier confirmation. Track: ${trackUrl}`,
    }),
    sendExpoPush({
      userId: order.customerId,
      eventType: "ORDER_CREATED",
      orderId: order.id,
      title: `Order #${order.orderNumber} Submitted`,
      body: `Sent to front desk (${totalFormatted}) — awaiting cashier confirmation.`,
      data: { orderNumber: order.orderNumber },
    }),
  ]);
}

export async function notifyPaymentConfirmed(order: NotifiableOrder): Promise<void> {
  const { email, phone, name } = await resolveOrderContacts(order);
  const totalFormatted = formatPesewasToGhs(order.totalPesewas);
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/orders/${encodeURIComponent(order.orderNumber)}`;
  const fulfilmentLabel = formatFulfilmentTypeLabel(order.fulfilmentType);

  await Promise.all([
    createInAppNotification({
      userId: order.customerId,
      type: "PAYMENT_CONFIRMED",
      title: `Payment Verified (#${order.orderNumber})`,
      body: `Your ${totalFormatted} Paystack payment is verified. Our cashier can now confirm and queue your meal.`,
      orderNumber: order.orderNumber,
      actionUrl: `/orders/${encodeURIComponent(order.orderNumber)}`,
    }),
    sendEmail({
      to: email,
      eventType: "PAYMENT_CONFIRMED",
      orderId: order.id,
      subject: `Sika Cuisine — Payment Receipt (${totalFormatted}) for #${order.orderNumber}`,
      html: renderSikaBusinessEmail({
        preheader: `Official payment receipt: ${totalFormatted} verified via Paystack for Sika Cuisine Order #${order.orderNumber}.`,
        badgeLabel: "Payment Verified",
        tone: "success",
        referenceCode: `#${order.orderNumber}`,
        headline: "Online Payment Confirmed",
        greeting: `Dear ${name},`,
        paragraphs: [
          `We have verified your Paystack payment of ${totalFormatted} for Order #${order.orderNumber}.`,
          `Your order is now queued at our Sunyani front desk so our cashier and kitchen team can begin preparing your meal fresh.`,
        ],
        metaRows: [
          { label: "Order Reference", value: `#${order.orderNumber}`, mono: true },
          { label: "Payment Gateway", value: "Paystack (MoMo & Card)" },
          { label: "Settlement Status", value: "Paid in Full", highlight: true },
          { label: "Fulfilment Method", value: fulfilmentLabel },
          { label: "Amount Settled", value: totalFormatted, highlight: true, mono: true },
        ],
        items: mapOrderItemsForEmail(order),
        totalLabel: "Total Paid",
        totalFormatted,
        ctaLabel: "View Official Receipt & Live Tracker",
        ctaUrl: trackUrl,
      }),
      text: `Dear ${name},\n\nYour Paystack payment of ${totalFormatted} for Sika Cuisine Order #${order.orderNumber} has been verified. Track your order and view your receipt here:\n${trackUrl}`,
    }),
    sendSms({
      to: phone,
      eventType: "PAYMENT_CONFIRMED",
      orderId: order.id,
      message: `Sika Cuisine: Payment of ${totalFormatted} verified for Order #${order.orderNumber}. Queuing at our front desk.`,
    }),
    sendExpoPush({
      userId: order.customerId,
      eventType: "PAYMENT_CONFIRMED",
      orderId: order.id,
      title: `Payment Verified (#${order.orderNumber})`,
      body: `Your ${totalFormatted} payment is confirmed.`,
      data: { orderNumber: order.orderNumber },
    }),
  ]);
}

const STATUS_MESSAGES: Record<
  string,
  {
    title: string;
    badge: string;
    tone: SikaEmailTone;
    message: string;
    detail: string;
  }
> = {
  CONFIRMED: {
    title: "Order Confirmed by Front Desk",
    badge: "Confirmed",
    tone: "brand",
    message: "Your order has been confirmed by our Sunyani front desk and sent to the kitchen.",
    detail: "Our chefs have received your ticket and will begin preparing your dishes shortly.",
  },
  PREPARING: {
    title: "Your Meal Is on the Fire",
    badge: "In the Kitchen",
    tone: "brand",
    message: "Our chefs are actively preparing your order fresh.",
    detail: "Every dish at Sika Cuisine is cooked fresh to order. We will notify you as soon as your meal is packed.",
  },
  READY_FOR_DISPATCH: {
    title: "Packed & Ready for Courier Dispatch",
    badge: "Packed for Rider",
    tone: "warning",
    message: "Your food is packed warm and waiting at our dispatch counter for rider handover.",
    detail: "Your assigned delivery rider will depart for your Sunyani address moments from now.",
  },
  OUT_FOR_DELIVERY: {
    title: "Your Delivery Rider Is on the Way",
    badge: "Out for Delivery",
    tone: "brand",
    message: "Your Sika Cuisine delivery rider has departed our Commercial Street kitchen and is heading to you now.",
    detail: "Please keep your phone nearby so our courier can reach you on arrival.",
  },
  READY_FOR_PICKUP: {
    title: "Ready for Counter Collection",
    badge: "Ready for Pickup",
    tone: "success",
    message: "Your order is packed warm and ready for collection at our Commercial Street counter.",
    detail: `Visit our front desk at ${RESTAURANT_INFO.address} and quote your order reference to collect.`,
  },
  DELIVERED: {
    title: "Order Delivered — Enjoy Your Meal",
    badge: "Delivered",
    tone: "success",
    message: "Your order has been marked as delivered. Thank you for dining with Sika Cuisine Sunyani!",
    detail: "We hope you enjoy every bite. You can view or download your itemized receipt anytime from your order link below.",
  },
  COLLECTED: {
    title: "Order Collected — Thank You",
    badge: "Collected",
    tone: "success",
    message: "Thank you for picking up your order from Sika Cuisine Sunyani!",
    detail: "We appreciate your visit to our Commercial Street counter and look forward to serving you again soon.",
  },
  CANCELLED: {
    title: "Order Cancelled",
    badge: "Cancelled",
    tone: "error",
    message: "Your order has been cancelled.",
    detail: `If you paid online via Paystack, an automatic full refund is processed back to your payment method. Call ${RESTAURANT_INFO.primaryPhone} with any questions.`,
  },
  REJECTED: {
    title: "Order Could Not Be Fulfilled",
    badge: "Order Declined",
    tone: "error",
    message: "We sincerely apologize — our kitchen could not fulfil your order at this time.",
    detail: `If you already settled online via Paystack, your full refund is initiated automatically. Please call ${RESTAURANT_INFO.primaryPhone} if you would like help placing an alternative order.`,
  },
};

export async function notifyOrderStatusChanged(
  order: NotifiableOrder,
  targetStatus: string
): Promise<void> {
  const copy = STATUS_MESSAGES[targetStatus];
  if (!copy) return;

  const { email, phone, name } = await resolveOrderContacts(order);
  const totalFormatted = formatPesewasToGhs(order.totalPesewas);
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/orders/${encodeURIComponent(order.orderNumber)}`;
  const fulfilmentLabel = formatFulfilmentTypeLabel(order.fulfilmentType);

  await Promise.all([
    createInAppNotification({
      userId: order.customerId,
      type: `ORDER_${targetStatus}`,
      title: `${copy.title} (#${order.orderNumber})`,
      body: copy.message,
      orderNumber: order.orderNumber,
      actionUrl: `/orders/${encodeURIComponent(order.orderNumber)}`,
    }),
    ...(targetStatus === "CONFIRMED"
      ? [
          createRoleInAppNotifications({
            roles: ["STAFF_KITCHEN"],
            type: "KITCHEN_NEW_TICKET",
            title: `New Kitchen Ticket #${order.orderNumber}`,
            body: `${order.fulfilmentType.toLowerCase()} order confirmed by cashier — ready to cook.`,
            orderNumber: order.orderNumber,
            actionUrl: "/kitchen",
          }),
        ]
      : []),
    ...(targetStatus === "READY_FOR_PICKUP"
      ? [
          createRoleInAppNotifications({
            roles: ["STAFF_CASHIER"],
            type: "COUNTER_PICKUP_READY",
            title: `Counter Pickup Ready (#${order.orderNumber})`,
            body: `Kitchen packed #${order.orderNumber}. Ready for counter handover.`,
            orderNumber: order.orderNumber,
            actionUrl: "/cashier",
          }),
        ]
      : []),
    ...(targetStatus === "READY_FOR_DISPATCH" && order.assignedRiderId
      ? [
          createInAppNotification({
            userId: order.assignedRiderId,
            type: "DISPATCH_READY",
            title: `Order #${order.orderNumber} Packed & Ready`,
            body: "Kitchen finished packing your delivery order. Collect at the dispatch counter.",
            orderNumber: order.orderNumber,
            actionUrl: "/rider",
          }),
        ]
      : []),
    sendEmail({
      to: email,
      eventType: `ORDER_${targetStatus}`,
      orderId: order.id,
      subject: `Sika Cuisine — ${copy.title} (#${order.orderNumber})`,
      html: renderSikaBusinessEmail({
        preheader: `Order #${order.orderNumber}: ${copy.message}`,
        badgeLabel: copy.badge,
        tone: copy.tone,
        referenceCode: `#${order.orderNumber}`,
        headline: copy.title,
        greeting: `Dear ${name},`,
        paragraphs: [copy.message, copy.detail],
        metaRows: [
          { label: "Order Reference", value: `#${order.orderNumber}`, mono: true },
          { label: "Status Update", value: copy.badge, highlight: true },
          { label: "Fulfilment Method", value: fulfilmentLabel },
          { label: "Order Total", value: totalFormatted, mono: true },
        ],
        items: mapOrderItemsForEmail(order),
        totalLabel: "Order Total",
        totalFormatted,
        ctaLabel: "View Live Order Status",
        ctaUrl: trackUrl,
      }),
      text: `Dear ${name},\n\nOrder #${order.orderNumber} — ${copy.title}\n${copy.message}\n${copy.detail}\n\nTrack your order: ${trackUrl}`,
    }),
    sendSms({
      to: phone,
      eventType: `ORDER_${targetStatus}`,
      orderId: order.id,
      message: `Sika Cuisine #${order.orderNumber}: ${copy.title}. ${copy.message}`,
    }),
    sendExpoPush({
      userId: order.customerId,
      eventType: `ORDER_${targetStatus}`,
      orderId: order.id,
      title: `${copy.title} (#${order.orderNumber})`,
      body: copy.message,
      data: { orderNumber: order.orderNumber, status: targetStatus },
    }),
  ]);
}

export async function notifyRefundInitiated(
  order: NotifiableOrder,
  reason?: string | null
): Promise<void> {
  const { email, phone, name } = await resolveOrderContacts(order);
  const totalFormatted = formatPesewasToGhs(order.totalPesewas);
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/orders/${encodeURIComponent(order.orderNumber)}`;
  const cleanReason = reason?.trim() || "Order could not be fulfilled";
  const reasonLine = reason?.trim() ? ` Reason: ${reason.trim()}.` : "";
  const timelineNote =
    "Mobile Money refunds typically arrive within minutes to 24 hours; Card refunds take 3–7 business days.";

  await Promise.all([
    createInAppNotification({
      userId: order.customerId,
      type: "REFUND_INITIATED",
      title: `Refund Initiated (#${order.orderNumber})`,
      body: `Your full refund of ${totalFormatted} has been sent to Paystack.${reasonLine} ${timelineNote}`,
      orderNumber: order.orderNumber,
      actionUrl: `/orders/${encodeURIComponent(order.orderNumber)}`,
    }),
    sendEmail({
      to: email,
      eventType: "REFUND_INITIATED",
      orderId: order.id,
      subject: `Sika Cuisine — Refund Initiated (${totalFormatted}) for #${order.orderNumber}`,
      html: renderSikaBusinessEmail({
        preheader: `We have initiated a full refund of ${totalFormatted} via Paystack for your Sika Cuisine Order #${order.orderNumber}.`,
        badgeLabel: "Refund Processing",
        tone: "warning",
        referenceCode: `#${order.orderNumber}`,
        headline: "Your Full Refund Has Been Initiated",
        greeting: `Dear ${name},`,
        paragraphs: [
          `Because your order #${order.orderNumber} could not be completed, we have automatically initiated a 100% refund of ${totalFormatted} back to your original payment method through Paystack.`,
          `No further action is required from you. You will receive a final confirmation email as soon as Paystack completes the settlement.`,
        ],
        calloutTitle: "Expected Reversal Timeline",
        calloutBody:
          "MTN MoMo & Telecel Cash reversals typically reflect within a few minutes to 24 hours. Visa and Mastercard refunds take 3 to 7 business days depending on your issuing bank.",
        metaRows: [
          { label: "Order Reference", value: `#${order.orderNumber}`, mono: true },
          { label: "Refund Amount", value: totalFormatted, highlight: true, mono: true },
          { label: "Refund Gateway", value: "Paystack Electronic Reversal" },
          { label: "Refund Status", value: "Processing with Gateway", highlight: true },
          { label: "Cancellation Reason", value: cleanReason },
        ],
        items: mapOrderItemsForEmail(order),
        totalLabel: "Total Refund Amount",
        totalFormatted,
        ctaLabel: "View Refund & Order Receipt",
        ctaUrl: trackUrl,
      }),
      text: `Dear ${name},\n\nYour full refund of ${totalFormatted} for Sika Cuisine Order #${order.orderNumber} has been initiated automatically via Paystack.${reasonLine}\n${timelineNote}\n\nView your receipt and refund status: ${trackUrl}`,
    }),
    sendSms({
      to: phone,
      eventType: "REFUND_INITIATED",
      orderId: order.id,
      message: `Sika Cuisine: Refund of ${totalFormatted} initiated for #${order.orderNumber}. MoMo: mins-24h; Card: 3-7 business days.`,
    }),
    sendExpoPush({
      userId: order.customerId,
      eventType: "REFUND_INITIATED",
      orderId: order.id,
      title: `Refund Initiated (#${order.orderNumber})`,
      body: `${totalFormatted} refund started. MoMo arrives within mins-24h; Cards 3-7 days.`,
      data: { orderNumber: order.orderNumber, type: "REFUND_INITIATED" },
    }),
  ]);
}

export async function notifyRefundProcessed(order: NotifiableOrder): Promise<void> {
  const { email, phone, name } = await resolveOrderContacts(order);
  const totalFormatted = formatPesewasToGhs(order.totalPesewas);
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/orders/${encodeURIComponent(order.orderNumber)}`;

  await Promise.all([
    createInAppNotification({
      userId: order.customerId,
      type: "REFUND_PROCESSED",
      title: `Refund Completed (#${order.orderNumber})`,
      body: `Paystack has completed your refund of ${totalFormatted} for Order #${order.orderNumber}.`,
      orderNumber: order.orderNumber,
      actionUrl: `/orders/${encodeURIComponent(order.orderNumber)}`,
    }),
    sendEmail({
      to: email,
      eventType: "REFUND_PROCESSED",
      orderId: order.id,
      subject: `Sika Cuisine — Official Refund Receipt (${totalFormatted}) for #${order.orderNumber}`,
      html: renderSikaBusinessEmail({
        preheader: `Official refund confirmation: ${totalFormatted} has been settled by Paystack back to your payment method for Order #${order.orderNumber}.`,
        badgeLabel: "Refund Completed",
        tone: "success",
        referenceCode: `#${order.orderNumber}`,
        headline: "Your Refund Has Been Completed",
        greeting: `Dear ${name},`,
        paragraphs: [
          `This email confirms that Paystack has finalized and settled your full refund of ${totalFormatted} for Order #${order.orderNumber} back to your original payment method.`,
          `Please retain this message as your official refund receipt. We sincerely apologize for any inconvenience and hope to welcome you back to Sika Cuisine Sunyani soon.`,
        ],
        calloutTitle: "Statement Reflection Notice",
        calloutBody: `Mobile Money reversals appear directly in your wallet statement. For bank cards, please allow your card issuer's standard posting window if the credit does not show immediately. Quote #${order.orderNumber} if you contact our front desk at ${RESTAURANT_INFO.primaryPhone}.`,
        metaRows: [
          { label: "Order Reference", value: `#${order.orderNumber}`, mono: true },
          { label: "Amount Refunded", value: totalFormatted, highlight: true, mono: true },
          { label: "Settlement Status", value: "Refund Settled (100%)", highlight: true },
          { label: "Payment Processor", value: "Paystack Electronic Reversal" },
        ],
        items: mapOrderItemsForEmail(order),
        totalLabel: "Total Refund Settled",
        totalFormatted,
        ctaLabel: "View Official Refund Receipt",
        ctaUrl: trackUrl,
      }),
      text: `Dear ${name},\n\nPaystack has completed your full refund of ${totalFormatted} for Sika Cuisine Order #${order.orderNumber} back to your payment method.\n\nView your official refund receipt: ${trackUrl}\nSupport: ${RESTAURANT_INFO.primaryPhone}`,
    }),
    sendSms({
      to: phone,
      eventType: "REFUND_PROCESSED",
      orderId: order.id,
      message: `Sika Cuisine: Your ${totalFormatted} refund for #${order.orderNumber} is settled by Paystack.`,
    }),
    sendExpoPush({
      userId: order.customerId,
      eventType: "REFUND_PROCESSED",
      orderId: order.id,
      title: `Refund Completed (#${order.orderNumber})`,
      body: `Your ${totalFormatted} refund has been settled by Paystack.`,
      data: { orderNumber: order.orderNumber, type: "REFUND_PROCESSED" },
    }),
  ]);
}
