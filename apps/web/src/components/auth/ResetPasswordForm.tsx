"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

interface RedirectTarget {
  path: string;
  label: string;
  title: string;
}

interface ResetPasswordFormProps {
  initialToken: string;
  isInvited: boolean;
}

/**
 * Interactive password recovery & team invite activation form.
 * Receives `initialToken` and `isInvited` directly from the Server Component
 * so the recovery form renders immediately on first paint with zero hydration delay.
 */
export function ResetPasswordForm({
  initialToken,
  isInvited,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const token = initialToken.trim();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<RedirectTarget | null>(null);

  useEffect(() => {
    if (!completed || !redirectTarget) return;
    const timer = window.setTimeout(() => {
      router.replace(redirectTarget.path);
      router.refresh();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [completed, redirectTarget, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token || token.length < 32) {
      setErrorMessage("This password reset link is incomplete or invalid.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error || "Unable to reset password. Request a new reset link."
        );
        return;
      }
      const nextPath =
        data.role === "CUSTOMER" ? "/" : data.redirectPath || "/";
      setRedirectTarget({
        path: nextPath,
        label:
          data.role === "CUSTOMER"
            ? "Explore Sika Cuisine"
            : data.dashboardLabel || "Open Dashboard",
        title:
          data.role === "CUSTOMER"
            ? "Sika Cuisine Menu"
            : data.dashboardTitle || "Dashboard",
      });
      setCompleted(true);
    } catch {
      setErrorMessage(
        "Network error while resetting password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2.5">
          <Link href="/" className="inline-flex justify-center">
            <Logo size={48} />
          </Link>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            {isInvited ? "Team Account Setup" : "Security Recovery"}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1EA]">
            {isInvited ? "Activate Your Sika Account" : "Set New Password"}
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
            {isInvited
              ? "Choose a strong private password (at least 8 characters) to activate your Sika Cuisine team login."
              : "Choose a strong password (at least 8 characters) to restore access to your Sika Cuisine account."}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-4 py-3 text-xs text-[#FDA4AF]"
          >
            {errorMessage}
          </div>
        )}

        {completed && redirectTarget ? (
          <div className="rounded-2xl border border-[#22C55E]/35 bg-[#22C55E]/10 p-5 text-center space-y-4">
            <CheckCircle2
              className="h-8 w-8 text-[#4ADE80] mx-auto"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                {isInvited ? "Account Activated" : "Password Updated"}
              </h2>
              <p className="text-xs text-[#A3A3A3]">
                Signed in automatically. Taking you to {redirectTarget.title}...
              </p>
            </div>
            <Link
              href={redirectTarget.path}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-4 py-3 text-sm font-semibold text-white transition-colors shadow-[0_6px_18px_rgba(215,25,32,0.35)]"
            >
              <span>{redirectTarget.label}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : !token ? (
          <div className="rounded-2xl border border-[#FB7185]/40 bg-[#FB7185]/10 p-5 text-center space-y-3">
            <KeyRound
              className="h-7 w-7 text-[#F0444A] mx-auto"
              aria-hidden="true"
            />
            <p className="text-xs text-[#F5F1EA]">
              No recovery token was found in this URL. Request a fresh password
              reset link first.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-xl bg-[#D71920] hover:bg-[#A91017] px-4 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              Request Reset Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
              >
                New Password *
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-11 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
              >
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-11 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
            >
              {isInvited ? "Activate Account & Set Password" : "Reset Password"}
            </Button>
          </form>
        )}

        {!completed && (
          <div className="border-t border-[#333333] pt-4 flex items-center justify-between text-xs">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-[#A3A3A3] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Request Another Link</span>
            </Link>
            <Link
              href="/login"
              className="text-[#F0444A] hover:underline font-semibold"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
