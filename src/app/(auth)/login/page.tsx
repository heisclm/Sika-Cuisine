"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2, UserPlus, Compass, Eye, EyeOff } from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      router.push("/menu");
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
            Welcome Back, Diner
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Sign in to track orders, reorder your favorite Sunyani dishes, and access saved delivery addresses.
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
                placeholder="kwame@example.com"
                className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand-red hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
                <span>Sign In to Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center space-y-4">
          <p className="text-xs text-gray-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-red hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="h-3 w-3 inline" />
              <span>Create an Account</span>
            </Link>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle/80" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-300 px-3 text-gray-500 uppercase tracking-widest text-[10px]">
                or
              </span>
            </div>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-gray-300 hover:text-white bg-surface-200/80 hover:bg-surface-100 border border-border-subtle px-4 py-2.5 rounded-full w-full transition-colors"
          >
            <Compass className="h-3.5 w-3.5 text-brand-red" />
            <span>Track Existing Order as Guest</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
