"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

const MENU_ITEMS = [
  {
    index: "01",
    name: "Home",
    href: "/",
    desc: "Sunyani Bono Gastronomy & Direct Dispatch",
  },
  {
    index: "02",
    name: "Restaurant Menu",
    href: "/menu",
    desc: "36 Authentic Delicacies & Charcoal Specialties",
  },
  {
    index: "03",
    name: "Live Dispatch",
    href: "/orders",
    desc: "Track Courier Route Across Sunyani",
  },
  {
    index: "04",
    name: "Our Bono Story",
    href: "/about",
    desc: "Culinary Heritage & Woodsmoke Craft",
  },
  {
    index: "05",
    name: "Contact & Lounge",
    href: "/contact",
    desc: "Commercial Road Sunyani & Reservations",
  },
];

export function MobileMenu({ isOpen, onClose, pathname }: MobileMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll cleanly when mobile menu is active
  useEffect(() => {
    if (!isOpen) return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // If not mounted on client or menu is closed, render nothing
  if (!mounted || !isOpen) return null;

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-[#141518] text-white flex flex-col justify-between overflow-y-auto overscroll-contain animate-menu-overlay"
    >
      {/* Studio Matte Overhead Vignette (Zero Shiny Red Glare) */}
      <div className="absolute top-0 left-0 right-0 h-[450px] pointer-events-none -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,#24262b_0%,#141518_75%)]" />

      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-white/[0.06] bg-[#141518]/95 backdrop-blur-md sticky top-0 z-20">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1c1d22] border border-white/10 font-serif font-black text-lg shadow-sm">
            <span className="tracking-tight text-white">S</span>
            <span className="text-[12px] text-brand-red font-sans font-bold -ml-0.5">C</span>
          </div>
          <div>
            <span className="font-serif text-xl font-black tracking-tight text-white block leading-none">
              Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
            </span>
            <span className="text-[9px] tracking-[0.18em] uppercase font-semibold text-gray-400 mt-1 flex items-center gap-1 font-mono">
              <MapPin className="h-2.5 w-2.5 text-brand-red flex-shrink-0" /> Sunyani Central
            </span>
          </div>
        </Link>

        {/* Clean Pill Close Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1c1d22] hover:bg-[#25272e] border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all active:scale-95 shadow-sm"
          aria-label="Close menu"
        >
          <span className="text-[11px] uppercase tracking-wider font-bold">Close</span>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red/20 text-brand-red">
            <X className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        </button>
      </div>

      {/* EDITORIAL NAVIGATION LINKS */}
      <div className="flex-1 px-6 py-6 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red flex items-center gap-2">
          <span className="h-px w-5 bg-brand-red/60" />
          <span>Curated Sunyani Gastronomy</span>
        </div>

        <nav className="space-y-2">
          {MENU_ITEMS.map((item, idx) => {
            const active = isActive(item.href);

            return (
              <div
                key={item.name}
                className="group relative animate-menu-slide"
                style={{
                  animationDelay: `${idx * 0.04}s`,
                }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`block py-2.5 px-3 rounded-2xl transition-all duration-200 ${
                    active
                      ? "bg-[#1c1d22] border-l-4 border-brand-red text-white"
                      : "hover:bg-[#1a1b20] text-gray-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-brand-red font-semibold">
                        {item.index}
                      </span>
                      <span
                        className={`font-serif text-2xl sm:text-3xl font-bold tracking-tight ${
                          active ? "text-white" : "text-gray-200 group-hover:text-white"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <ArrowRight
                      className={`h-4 w-4 transition-transform duration-200 ${
                        active
                          ? "text-brand-red translate-x-0"
                          : "text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-white"
                      }`}
                    />
                  </div>

                  <p className="text-xs text-gray-400 font-light mt-1 pl-7">
                    {item.desc}
                  </p>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* PRIMARY AUTH ACTION BUTTON */}
        <div className="pt-2">
          <Link
            href="/login"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold text-white bg-brand-red hover:bg-brand-red-hover active:scale-95 transition-all shadow-[0_4px_16px_rgba(229,9,20,0.35)]"
          >
            <User className="h-4 w-4" />
            <span>Sign In to Sika Account</span>
          </Link>
        </div>
      </div>

      {/* FOOTER UTILITY STRIP */}
      <div className="px-5 pt-4 pb-6 border-t border-white/[0.06] bg-[#111215] space-y-3">
        {/* Quick-dial Sunyani dispatch hotline & WhatsApp */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href="tel:+233533376760"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1a1b20] hover:bg-[#22242a] border border-white/5 text-gray-200 hover:text-white font-mono text-[11px] transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-brand-red" />
            <span>0533376760</span>
          </a>

          <a
            href="https://wa.me/233533376760?text=Hello%20Sika%20Cuisine,%20I%20want%20to%20order%20food"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 font-semibold text-[11px] transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>WhatsApp Kitchen</span>
          </a>
        </div>

        {/* Terminal portals & address info */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-300 font-medium">Kitchen Open &bull; Sunyani Central</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              onClick={onClose}
              className="hover:text-brand-red transition-colors font-mono"
            >
              Staff
            </Link>
            <span className="text-gray-600">&bull;</span>
            <Link
              href="/rider/login"
              onClick={onClose}
              className="hover:text-emerald-400 transition-colors font-mono"
            >
              Rider
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
