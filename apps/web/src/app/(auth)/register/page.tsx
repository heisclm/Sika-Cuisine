"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { formatFirstName, resolveCustomerAuthRedirect } from "@sika/shared";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

/**
 * Customer account registration page calling `POST /api/v1/auth/register`.
 * Validates password confirmation client-side and redirects to `returnTo`, `/checkout` (if tray has items), or `/`.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { syncCartSession } = useCart();
  const { success: toastSuccess } = useToast();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resolvedCartCount, setResolvedCartCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setReturnTo(params.get("returnTo"));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const firstFieldError =
          data.details && typeof data.details === "object"
            ? (Object.values(data.details).flat()[0] as string | undefined)
            : undefined;
        setError(firstFieldError || data.error || "Unable to create your account.");
        setLoading(false);
        return;
      }

      const firstName = formatFirstName(fullName, "Guest");
      const cartCount = syncCartSession(
        typeof data.user?.id === "string" ? data.user.id : null
      );
      setResolvedCartCount(cartCount);
      const targetPath = resolveCustomerAuthRedirect({
        returnTo,
        cartItemCount: cartCount,
      });

      setSuccess(true);
      toastSuccess(
        `Welcome to Sika Cuisine, ${firstName}`,
        targetPath === "/checkout"
          ? "Your new account details are pre-filled for checkout."
          : "Your account is ready — let's find something delicious."
      );
      setTimeout(() => {
        router.push(targetPath);
        router.refresh();
      }, 700);
    } catch {
      setError("Network connection error. Please check your internet and try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
        <PageReveal className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#22C55E]/35 bg-[#22C55E]/15 text-[#4ADE80]">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#F5F1EA]">
            Welcome, {formatFirstName(fullName, "Guest")}!
          </h1>
          <p className="text-sm text-[#A3A3A3]">
            Taking you to {resolvedCartCount > 0 ? "checkout" : "the Sika Cuisine menu"}...
          </p>
        </PageReveal>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
      <PageReveal className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex justify-center">
            <Logo size={48} />
          </Link>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            New Customer
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1EA]">
            Create Sika Account
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3]">
            Save your contact details for faster Sunyani delivery and pickup tracking.
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
              htmlFor="reg-fullname"
              className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
            >
              Full Name *
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                id="reg-fullname"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kwame Mensah"
                className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
            >
              Ghana Mobile Number *
            </label>
            <div className="relative">
              <Phone
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                id="reg-phone"
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0244123456"
                className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
            >
              Email Address *
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                id="reg-email"
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

          <div className="space-y-4">
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
              >
                Password *
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-11 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#A3A3A3] hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="reg-confirm"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
                >
                  Confirm Password *
                </label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-semibold ${
                      password === confirmPassword ? "text-[#4ADE80]" : "text-[#FDA4AF]"
                    }`}
                  >
                    {password === confirmPassword ? "Passwords match" : "Does not match"}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-11 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#A3A3A3] hover:text-white transition-colors"
                  aria-label={
                    showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
            <span>Create Sika Account</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <p className="text-center text-xs text-[#A3A3A3]">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[#F0444A] hover:underline">
            Sign in instead
          </Link>
        </p>
      </PageReveal>
    </div>
  );
}
