"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { RESTAURANT_INFO } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { useToast } from "@/context/ToastContext";

/**
 * Contact & Sunyani location page.
 * Submits customer inquiries directly to `POST /api/v1/contact` (email + Admin alert)
 * while also offering direct WhatsApp & telephone shortcuts.
 */
export default function ContactPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Prefill contact fields when the customer is signed in
  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.success || !data.user) return;
        setName((prev) => prev || data.user.fullName || "");
        setPhone((prev) => prev || data.user.phone || "");
        setEmail((prev) => prev || data.user.email || "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          subject: subject.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg =
          data.error || "Unable to send your inquiry right now. Please try again.";
        setErrorMessage(msg);
        toastError("Send Failed", msg);
        return;
      }

      setSubmitted(true);
      toastSuccess(
        "Inquiry Sent",
        "Our Sunyani hospitality desk has received your message."
      );
    } catch {
      const msg = "Network error while sending your message. Please try again or use WhatsApp.";
      setErrorMessage(msg);
      toastError("Network Error", msg);
    } finally {
      setSubmitting(false);
    }
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
                Send Us a Message
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#A3A3A3] mb-6">
                Send your catering, reservation, or order question directly to our Sunyani hospitality desk.
              </p>

              {errorMessage && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-4 py-3 text-xs sm:text-sm text-[#FDA4AF]"
                >
                  {errorMessage}
                </div>
              )}

              {submitted ? (
                <div className="rounded-2xl border border-[#22C55E]/35 bg-[#22C55E]/10 p-6 text-center space-y-4">
                  <CheckCircle2 className="h-9 w-9 text-[#4ADE80] mx-auto" aria-hidden="true" />
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-lg font-bold text-[#F5F1EA]">
                      Message Delivered
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A3A3A3]">
                      Thank you, <strong className="text-white">{name}</strong>. Our Sunyani hospitality desk has received your inquiry{email.trim() ? " and emailed you a confirmation copy" : ""}.
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
                      <span>Also Chat on WhatsApp</span>
                    </a>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSubmitted(false);
                        setSubject("");
                        setMessage("");
                      }}
                    >
                      Send Another Message
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                      >
                        Email Address (Optional)
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                          aria-hidden="true"
                        />
                        <input
                          id="contact-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-3 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
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

                  <Button type="submit" variant="primary" size="lg" loading={submitting}>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>{submitting ? "Sending..." : "Send Message"}</span>
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
