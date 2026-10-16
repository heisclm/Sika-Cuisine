"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Banner */}
      <div className="border-b border-border-subtle bg-surface-300 py-16 sm:py-20 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2 block">
            We Are Here In Sunyani
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-black text-white">
            Connect With Sika Cuisine
          </h1>
          <p className="mt-3 text-base text-gray-300 font-light">
            Have questions about catering, custom dietary orders, or bulk corporate lunch deliveries? Reach out to us.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Information Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-6">
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
                    <h4 className="font-semibold text-white">Customer Support & Orders</h4>
                    <p className="text-gray-400 text-xs mt-0.5">+233 24 000 0000 / +233 20 000 0000</p>
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
          </div>

          {/* Inquiry Form */}
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

                  <button
                    type="submit"
                    className="btn-red-gradient inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white shadow-glow"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
