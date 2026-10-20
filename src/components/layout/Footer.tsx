"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Banknote,
  Sparkles,
  ChefHat,
  Send,
  Navigation,
} from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isKitchenOpen, setIsKitchenOpen] = useState(true);

  // Calculate live kitchen operating status according to Sunyani, Ghana time (GMT / UTC+0)
  useEffect(() => {
    const checkKitchenStatus = () => {
      const now = new Date();
      const utcHours = now.getUTCHours();
      const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      if (utcDay === 0) {
        // Sunday: 12:00 PM (noon) to 9:00 PM GMT
        setIsKitchenOpen(utcHours >= 12 && utcHours < 21);
      } else {
        // Monday - Saturday: 10:00 AM to 10:00 PM GMT
        setIsKitchenOpen(utcHours >= 10 && utcHours < 22);
      }
    };

    checkKitchenStatus();
    const interval = setInterval(checkKitchenStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#111215] text-gray-400 pt-14 sm:pt-20 pb-16 sm:pb-12 relative overflow-hidden select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* TOP VIP DINING CLUB / NEWSLETTER STRIP */}
        <div className="mb-14 pb-12 border-b border-white/[0.06] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-2.5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/25 text-brand-red text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sika Cuisine Dining Club &bull; Sunyani Privileges</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Savor Exclusive Chef Specials & Delivery Perks
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Join Sunyani&apos;s culinary circle. Receive secret weekend tasting menus, doorstep dispatch vouchers, and seasonal Bono harvest announcements.
            </p>
          </div>

          <div className="lg:col-span-5">
            {subscribed ? (
              <div className="rounded-2xl bg-emerald-950/40 border border-emerald-800/60 p-4 text-center sm:text-left flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-serif text-sm font-bold text-white">
                    Welcome to the Sika Dining Club!
                  </p>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    Your exclusive welcome delivery voucher has been dispatched to your inbox.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for delivery perks..."
                  className="w-full rounded-full bg-[#1a1b20] border border-white/10 px-5 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-red hover:bg-brand-red-hover active:scale-95 transition-all shadow-[0_4px_16px_rgba(229,9,20,0.35)] whitespace-nowrap"
                >
                  <span>Join Club</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* MAIN NAVIGATION GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          
          {/* Brand Identity Column */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1c1d22] border border-white/10 font-serif font-black text-xl shadow-sm group-hover:scale-105 group-hover:border-brand-red/40 transition-all duration-300">
                <span className="tracking-tight text-white">S</span>
                <span className="text-[13px] text-brand-red font-sans font-bold -ml-0.5">C</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-black tracking-tight text-white flex items-center leading-none">
                  Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5 text-brand-red" /> Sunyani Central, Ghana
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-gray-400 font-light pr-2">
              Sunyani&apos;s premier destination for authentic, slow-simmered Ghanaian gastronomy and vibrant lounge dining. Charcoal-grilled whole tilapia with banku, fragrant smoky jollof, light soups with pounded fufu, pineapple fruit rice, and stone-baked pizzas delivered hot across Sunyani.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-3 py-1.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="font-medium text-[11px]">Certified Food Hygiene & Safety</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded-full">
                <ChefHat className="h-3.5 w-3.5" />
                <span className="font-medium text-[11px]">Prepared Fresh to Order</span>
              </div>
            </div>
          </div>

          {/* Column 2: Authentic Gastronomy */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-serif border-l-2 border-brand-red pl-2.5">
              Gastronomy & Menu
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-gray-300 group-hover:text-white">Charcoal-Grilled Tilapia</span>
                  <span className="font-mono text-[11px] text-brand-red font-semibold">GH₵80</span>
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-gray-300 group-hover:text-white">Smoky Jollof & Grilled Chicken</span>
                  <span className="font-mono text-[11px] text-brand-red font-semibold">GH₵40</span>
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-gray-300 group-hover:text-white">Pounded Fufu with Light Soup</span>
                  <span className="font-mono text-[11px] text-brand-red font-semibold">GH₵50</span>
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-gray-300 group-hover:text-white">Tuo Zaafi (TZ) with Ayoyo</span>
                  <span className="font-mono text-[11px] text-brand-red font-semibold">GH₵50</span>
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-gray-300 group-hover:text-white">Sunyani Pineapple Fruit Rice</span>
                  <span className="font-mono text-[11px] text-brand-red font-semibold">GH₵90</span>
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-gray-300 group-hover:text-white">SIKA Special Combo (De Mixture)</span>
                  <span className="font-mono text-[11px] text-brand-red font-semibold">GH₵80</span>
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-gray-300 group-hover:text-white">Stone-Baked Artisan Pizza</span>
                  <span className="font-mono text-[11px] text-brand-red font-semibold">From GH₵110</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Guest Experience & Logistics */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-serif border-l-2 border-brand-red pl-2.5">
              Guest Service
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/orders" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-brand-red flex-shrink-0" />
                  <span>Live Order Tracker</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  Our Bono Culinary Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact & Table Inquiries
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Delivery Terms & Zones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Customer Privacy Policy
                </Link>
              </li>
              <li className="pt-2 border-t border-white/5 space-y-1.5">
                <Link
                  href="/admin/login"
                  className="text-gray-400 hover:text-brand-red transition-colors text-xs flex items-center gap-1"
                >
                  <span>&bull; Staff Kitchen Terminal</span>
                </Link>
                <Link
                  href="/rider/login"
                  className="text-gray-400 hover:text-emerald-400 transition-colors text-xs flex items-center gap-1"
                >
                  <span>&bull; Rider Dispatch Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Kitchen Hours & Live Sunyani Dispatch */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-serif border-l-2 border-brand-red pl-2.5">
                  Operating Hours
                </h4>
                {/* Dynamic Live Kitchen Status Pill */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    isKitchenOpen
                      ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-400"
                      : "bg-[#1c1d22] border-white/10 text-gray-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isKitchenOpen ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                    }`}
                  />
                  <span>{isKitchenOpen ? "Kitchen Open" : "Closed"}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="rounded-xl bg-[#1a1b20] p-2.5 border border-white/5 space-y-1">
                  <div className="flex justify-between font-semibold text-white">
                    <span>Monday — Saturday</span>
                    <span className="font-mono text-gray-300">10:00 AM — 10:00 PM</span>
                  </div>
                  <div className="flex justify-between font-semibold text-white pt-1 border-t border-white/5">
                    <span>Sunday</span>
                    <span className="font-mono text-gray-300">12:00 PM — 9:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block">
                Direct Dispatch Hotline
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="tel:+233533376760"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1b20] hover:bg-[#25272e] text-white font-mono text-xs border border-white/10 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-brand-red" />
                  <span>0533376760</span>
                </a>
                <a
                  href="https://wa.me/233533376760?text=Hello%20Sika%20Cuisine,%20I%20would%20like%20to%20order%20food"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-semibold text-xs border border-emerald-800/60 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 space-y-1 pt-1">
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-red mt-0.5 flex-shrink-0" />
                <span>Commercial Road, Sunyani Central (Opposite Total Station), Bono Region, Ghana</span>
              </div>
            </div>
          </div>
        </div>

        {/* AUTHENTIC PAYMENT METHODS & SECURITY STRIP */}
        <div className="pt-8 pb-8 border-t border-white/[0.06] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white font-serif block">
                Verified Ghana Payment Infrastructure
              </span>
              <span className="text-[11px] text-gray-400 font-light">
                Encrypted via Paystack with instant mobile money push prompts (MTN MoMo, Telecel Cash, AT Money).
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>256-Bit SSL Bank Grade Encryption</span>
            </div>
          </div>

          {/* Responsive Brand Payment Logo Badges Grid */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Paystack Official Logo Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#081524] border border-[#00C3F7]/30 shadow-sm"
              title="Official Paystack Gateway Integration"
            >
              <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="1" width="20" height="3" rx="1.5" fill="#00C3F7" />
                <rect y="7.5" width="13" height="3" rx="1.5" fill="#00C3F7" />
                <rect y="14" width="20" height="3" rx="1.5" fill="#00C3F7" />
              </svg>
              <span className="font-sans font-bold text-xs tracking-tight text-white">paystack</span>
            </div>

            {/* MTN Mobile Money Official Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFCC00] text-black shadow-sm"
              title="MTN Mobile Money Ghana"
            >
              <div className="w-5 h-3 rounded-full border border-black flex items-center justify-center text-[7px] font-black leading-none tracking-tighter">
                MTN
              </div>
              <span className="font-sans font-black text-xs tracking-tight">MoMo</span>
            </div>

            {/* Telecel Cash Official Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E60000] text-white shadow-sm"
              title="Telecel Cash Ghana (formerly Vodafone Cash)"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center text-[#E60000] font-black text-[9px] leading-none">
                t
              </div>
              <span className="font-sans font-bold text-xs tracking-tight">telecel cash</span>
            </div>

            {/* AT Money Official Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#002D62] text-white border border-blue-400/30 shadow-sm"
              title="AT Money (AirtelTigo)"
            >
              <span className="text-[#FF6600] font-black text-xs">at</span>
              <span className="font-sans font-bold text-xs tracking-tight text-white">money</span>
            </div>

            {/* Visa Badge */}
            <div
              className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#1A1F71] text-white font-sans font-black italic text-xs tracking-wider border border-blue-400/30 shadow-sm"
              title="Visa Debit & Credit Cards"
            >
              VISA
            </div>

            {/* Mastercard Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1d1f27] border border-white/10 shadow-sm"
              title="Mastercard Global Payments"
            >
              <div className="flex -space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EB001B] inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]/95 inline-block" />
              </div>
              <span className="text-[11px] text-gray-200 font-semibold tracking-tight">mastercard</span>
            </div>

            {/* Cash on Delivery Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold shadow-sm"
              title="Cash on Delivery available across Sunyani"
            >
              <Banknote className="h-3.5 w-3.5 text-emerald-400" />
              <span>Cash on Handover</span>
            </div>
          </div>
        </div>

        {/* BOTTOM LEGAL & COPYRIGHT ROW */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-center md:text-left">
            <span>&copy; {new Date().getFullYear()} Sika Cuisine Restaurant. All rights reserved.</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Sunyani Central, Bono Region, Ghana</span>
            <span className="hidden sm:inline">&bull;</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors underline-offset-2 hover:underline">
              Terms of Service
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
          </div>

          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <span className="text-gray-500">Connect:</span>
            <a
              href="https://wa.me/233533376760"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors font-medium"
            >
              WhatsApp
            </a>
            <span>&bull;</span>
            <a
              href="https://instagram.com/sikacuisine.restaurant"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition-colors font-medium"
            >
              Instagram
            </a>
            <span>&bull;</span>
            <a
              href="https://facebook.com/sikacuisine"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors font-medium"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
