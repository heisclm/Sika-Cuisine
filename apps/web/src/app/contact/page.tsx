"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { RESTAURANT_INFO } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { PageReveal } from "@/components/ui/MotionPrimitives";

/**
 * Contact & Sunyani location page.
 * Prepares customer inquiries locally and routes direct confirmation via WhatsApp or telephone.
 */
export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  const whatsappInquiryUrl = `${RESTAURANT_INFO.whatsappBaseUrl}?text=${encodeURIComponent(
    `Hello Sika Cuisine,\nName: ${name}\nPhone: ${phone}\nSubject: ${subject || "General Inquiry"}\nMessage: ${message}`
  )}`;

  return (
    <div className="min-h-screen bg-[#101010] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <PageReveal className="max-w-2xl space-y-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            Sunyani Hospitality Desk
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-white">
            Reach Sika Cuisine
          </h1>
          <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
            Questions about group catering, order updates, or pickup directions in Sunyani Central? Reach our kitchen desk directly by phone or WhatsApp.
          </p>
        </PageReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Sidebar */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-5">
              <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">
                Direct Channels
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#333333] bg-[#262626] text-[#F0444A]">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F5F1EA]">Restaurant Location</p>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">{RESTAURANT_INFO.address}</p>
                    <p className="text-xs text-[#737373] mt-0.5">{RESTAURANT_INFO.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#333333] bg-[#262626] text-[#F0444A]">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F5F1EA]">Telephone Orders &amp; Support</p>
                    <div className="mt-1 flex flex-col gap-1 font-mono text-xs">
                      <a
                        href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
                        className="text-[#F5F1EA] hover:text-[#F0444A] transition-colors"
                      >
                        {RESTAURANT_INFO.primaryPhone}
                      </a>
                      <a
                        href={`tel:${RESTAURANT_INFO.secondaryPhoneIntl}`}
                        className="text-[#A3A3A3] hover:text-[#F0444A] transition-colors"
                      >
                        {RESTAURANT_INFO.secondaryPhone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#333333] bg-[#262626] text-[#4ADE80]">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F5F1EA]">Kitchen Hours (GMT)</p>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">Mon – Sat: 10:00 AM – 10:00 PM</p>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">Sunday: 12:00 PM – 9:00 PM</p>
                  </div>
                </div>
              </div>

              <a
                href={`${RESTAURANT_INFO.whatsappBaseUrl}?text=Hello%20Sika%20Cuisine%20Sunyani,%20I%20have%20an%20inquiry`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#22C55E]/35 bg-[#22C55E]/15 hover:bg-[#22C55E]/25 px-4 py-3 text-sm font-semibold text-[#4ADE80] transition-colors"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Message Kitchen on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Inquiry Composer */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1EA]">
                Prepare a Kitchen Inquiry
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#A3A3A3] mb-6">
                Compose your catering or order question below, then launch WhatsApp or call directly for immediate response.
              </p>

              {submitted ? (
                <div className="rounded-2xl border border-[#22C55E]/35 bg-[#22C55E]/10 p-6 text-center space-y-4">
                  <CheckCircle2 className="h-9 w-9 text-[#4ADE80] mx-auto" aria-hidden="true" />
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-lg font-bold text-[#F5F1EA]">
                      Message Draft Ready
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A3A3A3]">
                      Send your pre-filled note directly to Sika Cuisine on WhatsApp or call {RESTAURANT_INFO.primaryPhone}.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                    <a
                      href={whatsappInquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      <span>Send via WhatsApp</span>
                    </a>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSubmitted(false)}
                    >
                      Edit Message
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                      >
                        Your Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Akosua Boateng"
                        className="w-full rounded-xl border border-[#333333] bg-[#262626] p-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                      >
                        Phone Number *
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0244123456"
                        className="w-full rounded-xl border border-[#333333] bg-[#262626] p-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Event Catering / Group Pickup"
                      className="w-full rounded-xl border border-[#333333] bg-[#262626] p-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                    >
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we serve you in Sunyani today?"
                      className="w-full rounded-xl border border-[#333333] bg-[#262626] p-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="lg">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Prepare Inquiry</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
