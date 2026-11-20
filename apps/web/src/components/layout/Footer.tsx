"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  ShieldCheck,
  MessageCircle,
  Banknote,
  CreditCard,
  Smartphone,
  Navigation,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CUSTOMER_NAV_LINKS, RESTAURANT_INFO } from "@/lib/navigation";

export function Footer() {
  const [isKitchenOpen, setIsKitchenOpen] = useState(true);

  // Compute Sunyani operating status cleanly against GMT / UTC+0
  useEffect(() => {
    const checkKitchenStatus = () => {
      const now = new Date();
      const utcHours = now.getUTCHours();
      const utcDay = now.getUTCDay();
      if (utcDay === 0) {
        setIsKitchenOpen(utcHours >= 12 && utcHours < 21);
      } else {
        setIsKitchenOpen(utcHours >= 10 && utcHours < 22);
      }
    };

    checkKitchenStatus();
    const interval = window.setInterval(checkKitchenStatus, 60000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-[#333333] bg-[#101010] text-[#A3A3A3] pt-14 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-10 lg:gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Logo size={42} className="transition-transform duration-300 group-hover:scale-105" />
              <div>
                <span className="font-serif text-2xl font-black tracking-tight text-white block leading-none">
                  {RESTAURANT_INFO.brandName}
                  <span className="text-[#D71920] ml-0.5">.</span>
                </span>
                <span className="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A3A3A3]">
                  <MapPin className="h-3 w-3 text-[#F0444A]" aria-hidden="true" />
                  {RESTAURANT_INFO.city}
                </span>
              </div>
            </Link>

            <p className="max-w-md text-xs sm:text-sm leading-relaxed text-[#A3A3A3]">
              Authentic Ghanaian delicacies prepared fresh to order in Sunyani. Charcoal-grilled tilapia with banku, slow-simmered jollof, traditional swallows, fruit rice, and stone-baked pizza for pickup or delivery.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/35 bg-[#22C55E]/10 px-3 py-1.5 text-[11px] font-semibold text-[#4ADE80]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Freshly cooked in Sunyani Central</span>
            </div>
          </div>

          {/* Navigation Column (Same shared destinations) */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h4 className="border-l-2 border-[#D71920] pl-2.5 font-serif text-xs font-bold uppercase tracking-[0.18em] text-white">
              Navigate
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {CUSTOMER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#A3A3A3] hover:text-[#F5F1EA] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/account" className="text-[#A3A3A3] hover:text-[#F5F1EA] transition-colors">
                  Customer Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Ordering & Support */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h4 className="border-l-2 border-[#D71920] pl-2.5 font-serif text-xs font-bold uppercase tracking-[0.18em] text-white">
              Service
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1.5 text-[#A3A3A3] hover:text-[#F5F1EA] transition-colors"
                >
                  <Navigation className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  <span>Track an Order</span>
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-[#A3A3A3] hover:text-[#F5F1EA] transition-colors">
                  Checkout
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#737373] hover:text-[#F5F1EA] transition-colors">
                  Delivery Zones &amp; Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#737373] hover:text-[#F5F1EA] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Hours & Contact */}
          <div className="col-span-2 lg:col-span-3 space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="border-l-2 border-[#D71920] pl-2.5 font-serif text-xs font-bold uppercase tracking-[0.18em] text-white">
                  Kitchen Hours
                </h4>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                    isKitchenOpen
                      ? "border-[#22C55E]/35 bg-[#22C55E]/15 text-[#4ADE80]"
                      : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isKitchenOpen ? "bg-[#22C55E]" : "bg-[#737373]"
                    }`}
                  />
                  {isKitchenOpen ? "Open" : "Closed"}
                </span>
              </div>

              <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-[#F5F1EA]">
                  <span className="font-medium">Mon — Sat</span>
                  <span className="font-mono text-[#A3A3A3]">10:00 AM – 10:00 PM</span>
                </div>
                <div className="flex justify-between border-t border-[#333333] pt-1.5 text-[#F5F1EA]">
                  <span className="font-medium">Sunday</span>
                  <span className="font-mono text-[#A3A3A3]">12:00 PM – 9:00 PM</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/50 px-3 py-2.5 font-mono font-semibold text-[#F5F1EA] transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                <span>{RESTAURANT_INFO.primaryPhone}</span>
              </a>
              <a
                href={`${RESTAURANT_INFO.whatsappBaseUrl}?text=Hello%20Sika%20Cuisine,%20I%20would%20like%20to%20order`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#22C55E]/35 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 px-3 py-2.5 font-semibold text-[#4ADE80] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Supported Payment Methods (Cohesive Charcoal & Red Surface) */}
        <div className="border-t border-[#333333] pt-6 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white font-serif block">
              Supported Payment Options
            </span>
            <span className="text-[11px] text-[#737373]">
              Configured for Paystack (MoMo &amp; Cards), Cash on Delivery, and Cash on Collection.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] px-3 py-1.5 font-semibold text-[#F5F1EA]">
              <CreditCard className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
              Paystack
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] px-3 py-1.5 font-semibold text-[#F5F1EA]">
              <Smartphone className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
              Mobile Money
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] px-3 py-1.5 font-semibold text-[#F5F1EA]">
              <Banknote className="h-3.5 w-3.5 text-[#4ADE80]" aria-hidden="true" />
              Cash on Handover
            </span>
          </div>
        </div>

        {/* Legal Row */}
        <div className="border-t border-[#333333] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#737373]">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} {RESTAURANT_INFO.brandName} &bull; {RESTAURANT_INFO.address}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#F5F1EA] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#F5F1EA] transition-colors">
              Privacy
            </Link>
            <Link href="/admin/login" className="hover:text-[#F5F1EA] transition-colors">
              Staff Terminal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
