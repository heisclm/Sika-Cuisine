"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { PageReveal } from "@/components/ui/MotionPrimitives";

const ALLOWED_STAFF_ROLES = new Set(["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN"]);

/**
 * Kitchen & Admin Terminal Sign-In backed by `POST /api/v1/auth/login`.
 * Enforces staff role authorization before routing into `/admin`, revoking
 * customer/non-staff cookies immediately if an unauthorized role signs in here.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError("Access denied. This account does not have Admin or Kitchen Staff privileges.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network connection error. Unable to reach authentication server.");
      setLoading(false);
    }
  };

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
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
            >
              Password
            </label>
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

        {/* Quick-fill helpers matching prisma/seed.ts */}
        <div className="rounded-2xl border border-[#333333] bg-[#262626]/70 p-3.5 space-y-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#A3A3A3]">
            Seeded Demo Terminal Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@sikacuisine.com");
                setPassword("Admin123!@#");
              }}
              className="rounded-xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/50 px-3 py-2 text-left text-xs transition-colors"
            >
              <span className="font-semibold text-[#F5F1EA] block">Admin</span>
              <span className="text-[11px] text-[#A3A3A3] truncate block">admin@sikacuisine.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("staff@sikacuisine.com");
                setPassword("Staff123!@#");
              }}
              className="rounded-xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/50 px-3 py-2 text-left text-xs transition-colors"
            >
              <span className="font-semibold text-[#F5F1EA] block">Kitchen Staff</span>
              <span className="text-[11px] text-[#A3A3A3] truncate block">staff@sikacuisine.com</span>
            </button>
          </div>
        </div>

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
