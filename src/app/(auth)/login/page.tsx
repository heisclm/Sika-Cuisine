"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      if (email.includes("admin") || email.includes("staff")) {
        router.push("/admin");
      } else {
        router.push("/menu");
      }
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
          <h2 className="mt-4 font-serif text-xl font-bold text-white">
            Welcome Back
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Sign in to track orders, access your order history, or manage kitchen operations.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-950/50 border border-red-800 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 text-brand-red flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="rounded-2xl bg-surface-200 p-4 border border-border-subtle/70 text-xs text-gray-400 space-y-1.5">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-red" />
            Demo Accounts for Sunyani:
          </p>
          <p>
            <strong className="text-gray-300">Staff Portal:</strong> staff@sikacuisine.com
          </p>
          <p>
            <strong className="text-gray-300">Admin Portal:</strong> admin@sikacuisine.com
          </p>
          <p>
            <strong className="text-gray-300">Customer:</strong> customer@sikacuisine.com
          </p>
        </div>
      </div>
    </div>
  );
}
