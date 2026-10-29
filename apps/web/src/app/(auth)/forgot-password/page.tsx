"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-10 shadow-2xl">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl font-black tracking-tight text-white flex items-center justify-center">
              Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
            </span>
          </Link>
          <h2 className="mt-4 font-serif text-2xl font-bold text-white">
            Reset Password
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Enter your registered diner email address and we will send you instructions to reset your password.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-950/50 border border-red-800 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 text-brand-red flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="rounded-2xl bg-emerald-950/50 border border-emerald-800 p-6 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-white">
              Reset Link Sent!
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              If an account exists for <span className="text-white font-semibold">{email}</span>, you will receive password reset instructions shortly.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="btn-red-gradient inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Your Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kwame@example.com"
                  className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-red-gradient flex w-full items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold text-white shadow-glow disabled:opacity-50 mt-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Reset Instructions</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
