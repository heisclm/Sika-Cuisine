"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Mail, ArrowRight, Loader2, ChefHat, KeyRound, Eye, EyeOff } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      if (email.includes("customer")) {
        setError("Customer credentials cannot be used on the staff terminal.");
        return;
      }
      router.push("/admin");
    }, 600);
  };

  const handleQuickFill = (role: "staff" | "admin") => {
    if (role === "staff") {
      setEmail("staff@sikacuisine.com");
      setPassword("Staff123!@#");
    } else {
      setEmail("admin@sikacuisine.com");
      setPassword("Admin123!@#");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-gray-200">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] studio-vignette pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 rounded-3xl bg-[#1a1b20] border border-white/10 p-8 sm:p-10 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/15 text-brand-red border border-brand-red/30 mb-4 shadow-glow">
            <ChefHat className="h-7 w-7" />
          </div>
          <span className="block text-[11px] font-bold uppercase tracking-widest text-brand-gold mb-1">
            Internal Operations Portal
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-white">
            Staff & Kitchen Terminal
          </h1>
          <p className="mt-2 text-xs text-gray-400">
            Authorized Sunyani kitchen staff and management access only. All actions are audited.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-950/60 border border-red-800 p-3.5 text-xs text-red-200">
            <ShieldAlert className="h-4 w-4 text-brand-red flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStaffLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Staff Email / Operator ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@sikacuisine.com"
                className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Terminal Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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
                <KeyRound className="h-4 w-4" />
                <span>Authorize & Enter Terminal</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="rounded-2xl bg-surface-200/80 p-4 border border-border-subtle/80 space-y-2 text-xs">
          <p className="font-semibold text-gray-300 flex items-center justify-between">
            <span>Development Quick-Fill:</span>
            <span className="text-[10px] text-brand-gold uppercase tracking-wider font-mono">Sunyani Central</span>
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickFill("staff")}
              className="px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/5 text-gray-300 hover:text-white font-medium text-left transition-colors"
            >
              Kitchen Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("admin")}
              className="px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/5 text-gray-300 hover:text-white font-medium text-left transition-colors"
            >
              Administrator
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            &larr; Exit to Public Diner Website
          </Link>
        </div>
      </div>
    </div>
  );
}
