"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

const TERMINAL_STATUSES = new Set([
  "DELIVERED",
  "COLLECTED",
  "CANCELLED",
  "REJECTED",
]);

interface LiveOrderRefresherProps {
  orderNumber: string;
  currentStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  latestPaymentReference?: string | null;
}

/**
 * Client-side synchronizer for the SSR order tracking page.
 * 1. Reconciles Paystack redirect callbacks (`?reference=`) against `/api/v1/payments/verify`.
 * 2. Surfaces double-debit-safe Verify / Retry controls when an online Paystack order is still unpaid.
 * 3. Refreshes server state every 15 seconds while the order remains active.
 */
export function LiveOrderRefresher({
  orderNumber,
  currentStatus,
  paymentMethod,
  paymentStatus,
}: LiveOrderRefresherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { info: toastInfo, success: toastSuccess } = useToast();
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    tone: "info" | "success" | "warning" | "error";
    text: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const verifiedRef = useRef<string | null>(null);
  const prevStatusRef = useRef(currentStatus);
  const prevPaymentRef = useRef(paymentStatus);

  const isTerminal = TERMINAL_STATUSES.has(currentStatus);
  const needsOnlinePayment =
    paymentMethod === "PAYSTACK" && paymentStatus !== "PAID" && !isTerminal;

  useEffect(() => {
    if (prevStatusRef.current !== currentStatus) {
      toastInfo(
        `Order #${orderNumber}`,
        `Status updated to ${currentStatus.replace(/_/g, " ").toLowerCase()}.`
      );
      prevStatusRef.current = currentStatus;
    }
    if (prevPaymentRef.current !== paymentStatus && paymentStatus === "PAID") {
      toastSuccess(
        `Payment Confirmed (#${orderNumber})`,
        "Paystack payment verified successfully."
      );
    }
    prevPaymentRef.current = paymentStatus;
  }, [currentStatus, paymentStatus, orderNumber, toastInfo, toastSuccess]);

  useEffect(() => {
    const refParam =
      searchParams.get("reference") || searchParams.get("trxref") || "";

    if (
      !refParam ||
      paymentStatus === "PAID" ||
      verifiedRef.current === refParam
    ) {
      return;
    }

    verifiedRef.current = refParam;
    let active = true;
    setVerifyingPayment(true);

    fetch(`/api/v1/payments/verify?reference=${encodeURIComponent(refParam)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.verified) {
          setPaymentNotice({
            tone: "success",
            text: "Payment confirmed! Your order has been sent to our Cashier & Kitchen.",
          });
          router.refresh();
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setVerifyingPayment(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams, paymentStatus, router]);

  useEffect(() => {
    if (isTerminal) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 15_000);

    return () => window.clearInterval(timer);
  }, [isTerminal, orderNumber, router]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 600);
  };

  const handleVerifyPaid = async () => {
    setVerifyingPayment(true);
    setPaymentNotice(null);
    try {
      const res = await fetch(
        `/api/v1/orders/${encodeURIComponent(orderNumber)}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verifyOnly: true, clientPlatform: "web" }),
        }
      );
      const data = await res.json();
      if (res.status === 409) {
        setPaymentNotice({
          tone: "warning",
          text:
            data.error ||
            "Your Mobile Money/card transaction is still processing. Please approve on your phone and verify again in 30 seconds.",
        });
        return;
      }
      if (!res.ok || !data.success) {
        setPaymentNotice({
          tone: "error",
          text: data.error || "Unable to verify payment right now.",
        });
        return;
      }
      if (data.verified) {
        setPaymentNotice({
          tone: "success",
          text:
            data.message ||
            "Payment confirmed! Your order is now with the Sunyani Cashier & Kitchen.",
        });
        router.refresh();
        return;
      }
      setPaymentNotice({
        tone: "info",
        text:
          data.message ||
          "No completed payment was found yet. Use Complete / Retry Payment below.",
      });
    } catch {
      setPaymentNotice({
        tone: "error",
        text: "Network error checking Paystack status. Please try again.",
      });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleCompletePayment = async () => {
    setRetryingPayment(true);
    setPaymentNotice(null);
    try {
      const res = await fetch(
        `/api/v1/orders/${encodeURIComponent(orderNumber)}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verifyOnly: false, clientPlatform: "web" }),
        }
      );
      const data = await res.json();

      if (res.status === 409) {
        setPaymentNotice({
          tone: "warning",
          text:
            data.error ||
            "A transaction is currently processing. Approve the MoMo prompt on your phone instead of paying twice.",
        });
        return;
      }

      if (!res.ok || !data.success) {
        setPaymentNotice({
          tone: "error",
          text: data.error || "Unable to open Paystack checkout right now.",
        });
        return;
      }

      if (data.alreadyPaid || data.verified) {
        setPaymentNotice({
          tone: "success",
          text:
            data.message ||
            "Your earlier payment is already confirmed — you will not be charged again.",
        });
        router.refresh();
        return;
      }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      setPaymentNotice({
        tone: "error",
        text: "Network error starting Paystack checkout. Please retry.",
      });
    } finally {
      setRetryingPayment(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#333333] bg-[#161616] px-4 py-2.5 text-xs text-[#A3A3A3]">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isTerminal
                ? "bg-emerald-400"
                : needsOnlinePayment
                ? "bg-[#FACC15] animate-pulse"
                : "bg-[#D71920] animate-pulse"
            }`}
          />
          <span>
            {verifyingPayment
              ? "Checking Paystack payment confirmation..."
              : needsOnlinePayment
              ? "Awaiting verified Paystack payment before sending to kitchen"
              : isTerminal
              ? "Order completed. Final status archived."
              : "Live tracking active \u2022 Auto-refreshing every 15s"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleManualRefresh}
          className="inline-flex items-center gap-1.5 font-semibold text-[#F5F1EA] hover:text-white transition-colors"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span>Refresh</span>
        </button>
      </div>

      {needsOnlinePayment && (
        <section className="rounded-3xl border border-[#D71920]/45 bg-[#1C1C1C] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#D71920]/40 bg-[#D71920]/15 text-[#F0444A]">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                Online Payment Required to Start Your Order
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
                For your security, Paystack orders are only routed to our Cashier and Kitchen
                once payment settles. If your Mobile Money or card was already debited, tap{" "}
                <strong className="text-[#F5F1EA]">I Already Paid</strong> first so you are
                never charged twice.
              </p>
            </div>
          </div>

          {paymentNotice && (
            <div
              role="status"
              className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed ${
                paymentNotice.tone === "success"
                  ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#4ADE80]"
                  : paymentNotice.tone === "warning"
                  ? "border-[#EAB308]/40 bg-[#EAB308]/10 text-[#FACC15]"
                  : paymentNotice.tone === "error"
                  ? "border-[#FB7185]/40 bg-[#FB7185]/10 text-[#FDA4AF]"
                  : "border-[#333333] bg-[#262626] text-[#F5F1EA]"
              }`}
            >
              {paymentNotice.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1"
              loading={verifyingPayment}
              disabled={retryingPayment}
              onClick={handleVerifyPaid}
            >
              <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" aria-hidden="true" />
              <span>I Already Paid &mdash; Verify Payment</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              className="flex-1"
              loading={retryingPayment}
              disabled={verifyingPayment}
              onClick={handleCompletePayment}
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              <span>Complete / Retry Payment</span>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
