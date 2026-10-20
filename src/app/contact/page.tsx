"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { TiltCard } from "@/components/creative/TiltCard";
import { MagneticButton } from "@/components/creative/MagneticButton";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-gray-200">
      <div className="border-b border-white/[0.06] bg-[#16171b] py-16 sm:py-20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] studio-vignette pointer-events-none -z-10" />
        <div className="mx-auto max-w-3xl px-4 relative z-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-px w-6 bg-brand-red/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red">
              Sunyani Central &bull; Bono Region
            </span>
            <span className="h-px w-6 bg-brand-red/60" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Connect With Sika Cuisine
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-400 font-light max-w-xl mx-auto leading-relaxed">
            Have questions about catering, custom dietary orders, or bulk corporate lunch deliveries? Reach out to us.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <TiltCard maxAngle={6} scale={1.01} glare={true} className="rounded-3xl">
              <div className="h-full rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-6 shadow-card">
                <h2 className="font-serif text-xl font-bold text-white border-b border-border-subtle pb-3">
                  Sunyani Kitchen Details
                </h2>

                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red flex-shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Physical Address</h4>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Commercial Road, Sunyani Central, Bono Region, Ghana
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red flex-shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Call / WhatsApp</h4>
                      <p className="text-gray-300 text-xs mt-0.5 font-medium">0533376760 / 0554406681</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Social: @sikacuisine.restaurant</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red flex-shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Direct Email</h4>
                      <p className="text-gray-400 text-xs mt-0.5">orders@sikacuisine.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red flex-shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Operating Hours</h4>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Mon — Sat: 10:00 AM – 10:00 PM<br />
                        Sunday: 12:00 PM – 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-10">
              <h2 className="font-serif text-2xl font-bold text-white mb-2">
                Send a Direct Message
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Our kitchen supervisor will respond to your inquiry promptly.
              </p>

              {submitted ? (
                <div className="rounded-2xl bg-emerald-950/40 border border-emerald-800 p-6 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <h3 className="font-serif text-lg font-bold text-white">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-xs text-gray-300">
                    Thank you for reaching out to Sika Cuisine Sunyani. We will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kwame Mensah"
                        className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0244123456"
                        className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Event Catering / Delivery Feedback"
                      className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How can we serve you in Sunyani today?"
                      className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <MagneticButton strength={0.2}>
                    <button
                      type="submit"
                      className="btn-red-gradient inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white shadow-glow"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send Inquiry</span>
                    </button>
                  </MagneticButton>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
