import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border-subtle bg-surface-400 text-gray-400 pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-black tracking-tight text-white flex items-center">
                Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Sunyani’s premier destination for authentic, slow-simmered Ghanaian gastronomy.
              From sizzling street grills to royal waakye feasts, crafted with culinary pride.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>Certified Food Hygiene & Safety</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-serif">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/menu" className="hover:text-white transition-colors">
                  Full Menu & Specials
                </Link>
              </li>
              <li>
                <Link href="/orders/track" className="hover:text-white transition-colors">
                  Track Delivery
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Our Culinary Heritage
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Location
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-serif">
              Kitchen Hours
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-brand-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Monday — Saturday</p>
                  <p className="text-xs text-gray-400">10:00 AM — 10:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-brand-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Sunday</p>
                  <p className="text-xs text-gray-400">12:00 PM — 9:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-serif">
              Find Us
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-brand-red mt-0.5 flex-shrink-0" />
                <span>Commercial Road, Sunyani Central, Bono Region, Ghana</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-brand-red mt-0.5 flex-shrink-0" />
                <div className="flex flex-col text-xs space-y-1">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider">Call / WhatsApp</span>
                  <div className="flex flex-wrap gap-2 text-white">
                    <a href="tel:+233533376760" className="hover:text-brand-red transition-colors font-medium">
                      0533376760
                    </a>
                    <span className="text-gray-500">/</span>
                    <a href="tel:+233554406681" className="hover:text-brand-red transition-colors font-medium">
                      0554406681
                    </a>
                  </div>
                  <span className="text-gray-400 text-[11px]">@sikacuisine.restaurant</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-red flex-shrink-0" />
                <a href="mailto:info@sikacuisine.com" className="hover:text-white transition-colors">
                  orders@sikacuisine.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Sika Cuisine Restaurant. All rights reserved. Built for Sunyani, Ghana.
          </div>
          <div className="flex items-center gap-3">
            <span>Secured by Paystack:</span>
            <span className="font-semibold text-yellow-500">MTN MoMo</span>
            <span>&bull;</span>
            <span className="font-semibold text-red-400">Telecel Cash</span>
            <span>&bull;</span>
            <span className="font-semibold text-blue-400">AT Money</span>
            <span>&bull;</span>
            <span className="font-semibold text-white">Cards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
