"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { RESTAURANT_INFO } from "@/lib/navigation";

/**
 * Customer password assistance page.
 * Automated email/SMS reset tokens are not yet provisioned in this release, so requests
 * surface direct phone and WhatsApp verification channels with Sika Cuisine Sunyani.
 */
export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-12 flex items-center justify-center">
      <PageReveal className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2.5">
          <Link href="/" className="inline-flex justify-center">
            <Logo size={48} />
          </Link>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            Account Recovery
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1EA]">
            Need Password Help?
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
            Self-service automated password resets are not active yet. Verify your account details with our Sunyani desk for manual assistance.
          </p>
        </div>

        <div className="rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/10 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-[#FACC15] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-[#F5F1EA]/90">
            For security, no automated reset emails or SMS codes are dispatched from this form. Contact our kitchen counter directly to verify your phone number.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-[#22C55E]/35 bg-[#22C55E]/10 p-5 text-center space-y-4">
            <CheckCircle2 className="h-8 w-8 text-[#4ADE80] mx-auto" aria-hidden="true" />
            <div className="space-y-1.5">
              <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                Ready for Direct Verification
              </h2>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Reach out to Sika Cuisine Sunyani mentioning <strong className="text-white">{identifier}</strong> so our team can assist with access restoration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <a
                href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-4 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Call {RESTAURANT_INFO.primaryPhone}</span>
              </a>
              <a
                href={`${RESTAURANT_INFO.whatsappBaseUrl}?text=${encodeURIComponent(
                  `Hello Sika Cuisine, I need help resetting password for account: ${identifier}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-4 py-2.5 text-xs font-semibold text-[#F5F1EA] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#4ADE80]" aria-hidden="true" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="recovery-identifier"
                className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
              >
                Registered Email or Phone Number
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  id="recovery-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="kwame@example.com or 0244123456"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth>
              Get Password Assistance
            </Button>
          </form>
        )}

        <div className="border-t border-[#333333] pt-4 flex items-center justify-between text-xs">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Sign In</span>
          </Link>
          <a
            href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
            className="font-mono font-semibold text-[#F0444A] hover:underline"
          >
            {RESTAURANT_INFO.primaryPhone}
          </a>
        </div>
      </PageReveal>
    </div>
  );
}
