"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, MapPin, ArrowRight, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { SUNYANI_DELIVERY_ZONES } from "@/lib/delivery-zones";
import { formatGhanaPhone, isValidGhanaPhone } from "@/lib/phone";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredArea, setPreferredArea] = useState(SUNYANI_DELIVERY_ZONES[0].name);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!isValidGhanaPhone(phone)) {
      setError("Please enter a valid 10-digit Ghanaian mobile number (e.g. 053 337 6760).");
      return;
    }

    if (!agreedToTerms) {
      setError("Please accept the terms of service and privacy policy to continue.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/menu");
      }, 1200);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-10 shadow-2xl">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl font-black tracking-tight text-white flex items-center justify-center">
              Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
            </span>
          </Link>
          <h2 className="mt-4 font-serif text-2xl font-bold text-white">
            Create Your Diner Account
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Join Sika Cuisine to enjoy swift deliveries across Sunyani, track orders live, and save custom preferences.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-950/50 border border-red-800 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 text-brand-red flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-2xl bg-emerald-950/50 border border-emerald-800 p-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="font-serif text-lg font-bold text-white">
              Account Created Successfully!
            </h3>
            <p className="text-xs text-gray-300">
              Welcome to Sika Cuisine. Redirecting to our official menu...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Phone Number (Ghana) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatGhanaPhone(e.target.value))}
                    placeholder="053 337 6760"
                    maxLength={12}
                    className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email Address *
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
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Primary Delivery Area in Sunyani
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <select
                  value={preferredArea}
                  onChange={(e) => setPreferredArea(e.target.value)}
                  className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red appearance-none"
                >
                  {SUNYANI_DELIVERY_ZONES.map((zone) => (
                    <option key={zone.id} value={zone.name} className="bg-surface-300">
                      {zone.name} ({zone.estimatedMinutes} mins)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Password *
                </label>
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-surface-200 border border-border-subtle pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border-subtle bg-surface-200 text-brand-red focus:ring-brand-red"
              />
              <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-brand-red hover:underline">
                  Terms of Service
                </Link>{" "}
                and acknowledge the{" "}
                <Link href="/privacy" className="text-brand-red hover:underline">
                  Privacy Policy
                </Link>{" "}
                of Sika Cuisine Restaurant.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-red-gradient flex w-full items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold text-white shadow-glow disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-red hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
