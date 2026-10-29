/**
 * Paystack API client and HMAC verification utilities.
 */

import * as crypto from "crypto";
import { pesewasToPaystackAmount } from "./currency";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface InitializePaystackParams {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface InitializePaystackResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyPaystackResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      phone?: string;
    };
    metadata?: Record<string, unknown>;
  };
}

function getSecretKey(): string {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing PAYSTACK_SECRET_KEY in server environment variables."
    );
  }
  return secretKey;
}

/**
 * Initializes a new Paystack transaction for an order.
 * Amount is passed strictly in integer pesewas.
 */
export async function initializePaystackTransaction(
  params: InitializePaystackParams
): Promise<InitializePaystackResponse> {
  const secretKey = getSecretKey();
  const amount = pesewasToPaystackAmount(params.amountPesewas);

  const payload = {
    email: params.email,
    amount,
    currency: "GHS",
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
    channels: params.channels ?? ["mobile_money", "card"],
  };

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(
      `Paystack initialization failed: ${data.message || response.statusText}`
    );
  }

  return data as InitializePaystackResponse;
}

/**
 * Verifies a transaction reference directly against Paystack's API.
 * Server-authoritative check before updating order status.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<VerifyPaystackResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(
      `Paystack verification failed: ${data.message || response.statusText}`
    );
  }

  return data as VerifyPaystackResponse;
}

/**
 * Verifies the HMAC SHA512 signature of incoming Paystack webhook requests.
 * Uses timing-safe string comparison to protect against side-channel timing attacks.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("Missing Paystack secret for webhook signature verification.");
    return false;
  }

  const computedHash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  try {
    const computedBuffer = Buffer.from(computedHash, "hex");
    const signatureBuffer = Buffer.from(signatureHeader, "hex");

    if (computedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}
