"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Eye, EyeOff, Lock, Mail, UserPlus } from "lucide-react";
import {
  formatFirstName,
  getDashboardForRole,
  resolveCustomerAuthRedirect,
} from "@sika/shared";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

/**
 * Customer sign-in page backed by `POST /api/v1/auth/login`.
 * Stores HTTP-only session cookies on the server and routes signed-in customers
 * to their active `returnTo` destination, `/checkout` (if tray has items), or `/` Storefront Home.
 */
export default function LoginPage() {
  const router = useRouter();
  const { syncCartSession } = useCart();
  const { success } = useToast();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setReturnTo(params.get("returnTo"));
    }
  }, []);

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
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const role = data.user?.role;
      const firstName = formatFirstName(data.user?.fullName, "Guest");
      const resolvedCartCount = syncCartSession(
        typeof data.user?.id === "string" ? data.user.id : null
      );

      if (role && role !== "CUSTOMER") {
        const destination = getDashboardForRole(role);
        success(`Welcome back, ${firstName}`, `Opening ${destination.title}.`);
        router.push(destination.path);
        router.refresh();
        return;
      }

      const targetPath = resolveCustomerAuthRedirect({
        returnTo,
        cartItemCount: resolvedCartCount,
      });

      success(
        `Welcome back, ${firstName}`,
        targetPath === "/checkout"
          ? "Your details are ready for checkout."
          : "Good to see you again — explore today's menu."
      );
      router.push(targetPath);
      router.refresh();
    } catch {
      setError("Network connection error. Please check your internet and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
      <PageReveal className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex justify-center">
            <Logo size={48} />
          </Link>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            Customer Sign In
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1EA]">
            Welcome Back to Sika
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3]">
            Sign in to view your saved profile, order history, and active deliveries.
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
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kwame@example.com"
                className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
              >
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-[#F0444A] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                id="login-password"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#A3A3A3] hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
            <span>Sign In to Account</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <div className="space-y-4 pt-2 text-center">
          <p className="text-xs text-[#A3A3A3]">
            Don&apos;t have an account yet?{" "}
            <Link
              href={
                returnTo
                  ? `/register?returnTo=${encodeURIComponent(returnTo)}`
                  : "/register"
              }
              className="inline-flex items-center gap-1 font-semibold text-[#F0444A] hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Create an Account</span>
            </Link>
          </p>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#333333]" />
            <span className="bg-[#1C1C1C] px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#737373]">
              or
            </span>
            <div className="w-full border-t border-[#333333]" />
          </div>

          <Link
            href="/orders"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-4 py-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
          >
            <Compass className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
            <span>Track Existing Order as Guest</span>
          </Link>
        </div>
      </PageReveal>
    </div>
  );
}
