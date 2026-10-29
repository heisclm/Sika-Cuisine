"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, Lock, Mail, ArrowRight, Loader2, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function RiderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      router.push("/rider");
    }, 600);
  };

  const handleQuickFill = () => {
    setEmail("rider.kofi@sikacuisine.com");
    setPassword("Rider123!@#");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-gray-200">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-brand-gold to-emerald-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] studio-vignette pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-6 rounded-3xl bg-[#1a1b20] border border-white/10 p-7 sm:p-9 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 mb-3 shadow-glow">
            <Bike className="h-7 w-7" />
          </div>
          <span className="block text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
            Sunyani Courier Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-white">
            Rider Dispatch Terminal
          </h1>
          <p className="mt-2 text-xs text-gray-400">
            For registered Sika Cuisine couriers delivering across Sunyani, Fiapre, UENR, and Berlin Top.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRiderLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Rider ID / Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider.kofi@sikacuisine.com"
                className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Terminal Passcode
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
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
            className="flex w-full items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-glow mt-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Bike className="h-4 w-4" />
                <span>Sign In & Start Shift</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center space-y-3">
          <button
            type="button"
            onClick={handleQuickFill}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Fill Demo Rider Credentials</span>
          </button>

          <div className="border-t border-border-subtle/50 pt-3 flex justify-between text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">
              &larr; Customer Home
            </Link>
            <Link href="/admin/login" className="hover:text-gray-300 transition-colors">
              Kitchen Terminal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
