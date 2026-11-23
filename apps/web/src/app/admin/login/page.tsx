"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getDashboardForRole } from "@sika/shared";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { PageReveal } from "@/components/ui/MotionPrimitives";

const ALLOWED_STAFF_ROLES = new Set([
  "ADMIN",
  "STAFF_CASHIER",
  "STAFF_KITCHEN",
  "DELIVERY_RIDER",
]);

interface ActiveCustomerSession {
  fullName: string;
  email: string;
}

/**
 * Staff & Operations Sign-In backed by `POST /api/v1/auth/login`.
 * Enforces staff/rider role authorization before routing to the user's exact
 * operational workspace (`/admin`, `/cashier`, `/kitchen`, or `/rider`).
 * If a user is already signed in as a Customer, guards their session and lets them
 * return to the storefront or explicitly switch accounts.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [customerSession, setCustomerSession] =
    useState<ActiveCustomerSession | null>(null);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const user = data?.user;
        if (user && ALLOWED_STAFF_ROLES.has(user.role)) {
          const dest = getDashboardForRole(user.role);
          router.replace(dest.path);
          return;
        }
        if (user && user.role === "CUSTOMER") {
          setCustomerSession({
            fullName: user.fullName || "Customer",
            email: user.email || "",
          });
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const handleSwitchFromCustomer = async () => {
    setSwitchingAccount(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setCustomerSession(null);
      router.refresh();
    } finally {
      setSwitchingAccount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid staff credentials.");
        setLoading(false);
        return;
      }

      if (!ALLOWED_STAFF_ROLES.has(data.user?.role)) {
        await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
        setError("Access denied. This account does not have staff or rider privileges.");
        setLoading(false);
        return;
      }

      const destination = getDashboardForRole(data.user?.role);
      router.push(destination.path);
      router.refresh();
    } catch {
      setError("Network connection error. Unable to reach authentication server.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D71920] border-t-transparent" />
      </div>
    );
  }

  if (customerSession) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
        <PageReveal className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#EAB308]/40 bg-[#EAB308]/10 text-[#FACC15]">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FACC15]">
              Customer Session Active
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Staff Terminal Restricted
            </h1>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              You are currently signed in as{" "}
              <strong className="text-[#F5F1EA]">{customerSession.fullName}</strong>
              {customerSession.email ? ` (${customerSession.email})` : ""}. The
              Staff Terminal is reserved for authorized Sika Cuisine kitchen,
              cashier, and management personnel.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Return to Storefront</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              loading={switchingAccount}
              onClick={handleSwitchFromCustomer}
            >
              <LogOut className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
              <span>Sign Out &amp; Switch to Staff Account</span>
            </Button>
          </div>
        </PageReveal>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
      <PageReveal className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2.5">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#D71920]/40 bg-[#D71920]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F0444A]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Kitchen &amp; Operations Terminal</span>
          </div>
          <div className="flex justify-center pt-1">
            <Logo size={46} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1EA]">
            Staff Sign In
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3]">
            Authenticate with your Admin, Cashier, or Kitchen Staff credentials.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-4 py-3 text-xs sm:text-sm text-[#FDA4AF]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
            >
              Staff Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sikacuisine.com"
                className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#F0444A] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-11 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#A3A3A3] hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            <span>Access Staff Terminal</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <div className="flex items-center justify-between border-t border-[#333333] pt-4 text-xs">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#A3A3A3] hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Storefront</span>
          </Link>
          <Link href="/rider/login" className="font-semibold text-[#F0444A] hover:underline">
            Rider Portal
          </Link>
        </div>
      </PageReveal>
    </div>
  );
}
