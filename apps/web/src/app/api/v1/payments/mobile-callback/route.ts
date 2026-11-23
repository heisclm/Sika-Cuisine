import { NextResponse } from "next/server";
import { isAllowedMobileReturnUrl } from "@sika/shared";
import { reconcilePaystackAttempt } from "@/lib/payments";

export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * GET /api/v1/payments/mobile-callback
 * Verified HTTPS landing page required by Paystack `callback_url` for mobile checkouts.
 * Verifies the payment server-side immediately, triggers an automatic deep-link redirect
 * back into the Sika Cuisine mobile app (`sikacuisine://payment-callback` or `exp://...`),
 * and displays a Sika dark-mode "Return to Sika Cuisine App" screen so Android/iOS browsers
 * that require a user tap never get stuck on a blank page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim().toUpperCase() || "";
  const reference =
    url.searchParams.get("reference")?.trim() ||
    url.searchParams.get("trxref")?.trim() ||
    "";
  const rawReturnTo = url.searchParams.get("returnTo")?.trim();

  let verified = false;
  if (reference && /^[A-Za-z0-9_-]+$/.test(reference)) {
    try {
      const result = await reconcilePaystackAttempt({
        reference,
        req,
        source: "callback",
      });
      verified = result.verified;
    } catch (err) {
      console.warn("[API v1 Mobile Payment Callback Verify Error]:", err);
    }
  }

  const allowExpo = process.env.NODE_ENV !== "production";
  const baseReturnUrl =
    rawReturnTo && isAllowedMobileReturnUrl(rawReturnTo, allowExpo)
      ? rawReturnTo
      : "sikacuisine://payment-callback";

  const params = new URLSearchParams();
  if (orderNumber) params.set("orderNumber", orderNumber);
  if (reference) params.set("reference", reference);
  params.set("verified", verified ? "1" : "0");

  const separator = baseReturnUrl.includes("?") ? "&" : "?";
  const deepLink = `${baseReturnUrl}${separator}${params.toString()}`;

  const safeDeepLink = escapeHtml(deepLink);
  const safeOrderNumber = escapeHtml(orderNumber || "SIKA ORDER");
  const webFallbackHref = orderNumber
    ? `/orders/${encodeURIComponent(orderNumber)}?reference=${encodeURIComponent(reference)}`
    : "/orders";
  const safeWebFallbackHref = escapeHtml(webFallbackHref);

  const badgeBg = verified ? "rgba(34, 197, 94, 0.14)" : "rgba(234, 179, 8, 0.14)";
  const badgeBorder = verified ? "rgba(34, 197, 94, 0.38)" : "rgba(234, 179, 8, 0.38)";
  const badgeColor = verified ? "#4ADE80" : "#FACC15";
  const badgeText = verified ? "Payment Confirmed" : "Verification Pending";
  const headingText = verified
    ? "Payment Confirmed!"
    : "Returning to Sika Cuisine";
  const bodyText = verified
    ? "Your Paystack payment was received and your order has been sent to our Sunyani Cashier & Kitchen."
    : "Tap below to jump back into Sika Cuisine and verify your live order status.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="refresh" content="1;url=${safeDeepLink}" />
  <title>Return to Sika Cuisine App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: #101010;
      color: #F5F1EA;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: #1C1C1C;
      border: 1px solid #333333;
      border-top-color: rgba(255,255,255,0.12);
      border-radius: 24px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
    }
    .brand {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #F0444A;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid ${badgeBorder};
      background: ${badgeBg};
      color: ${badgeColor};
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 900;
      color: #FFFFFF;
      margin-bottom: 10px;
    }
    .order-pill {
      display: inline-block;
      background: #262626;
      border: 1px solid #333333;
      border-radius: 10px;
      padding: 6px 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      font-weight: 800;
      color: #F5F1EA;
      margin-bottom: 14px;
    }
    p {
      font-size: 14px;
      line-height: 1.55;
      color: #A3A3A3;
      margin-bottom: 24px;
    }
    .btn-primary {
      display: block;
      width: 100%;
      padding: 15px 18px;
      border-radius: 14px;
      background: #D71920;
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 800;
      text-decoration: none;
      margin-bottom: 12px;
    }
    .btn-secondary {
      display: block;
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      background: #262626;
      border: 1px solid #333333;
      color: #F5F1EA;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">SIKA CUISINE &bull; SUNYANI</div>
    <div class="badge">${badgeText}</div>
    <h1>${headingText}</h1>
    ${orderNumber ? `<div class="order-pill">#${safeOrderNumber}</div>` : ""}
    <p>${bodyText}</p>
    <a class="btn-primary" href="${safeDeepLink}">Return to Sika Cuisine App</a>
    <a class="btn-secondary" href="${safeWebFallbackHref}">Track Order on Web Instead</a>
  </main>
  <script>
    setTimeout(function () {
      try { window.location.href = ${JSON.stringify(deepLink)}; } catch (e) {}
    }, 350);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
