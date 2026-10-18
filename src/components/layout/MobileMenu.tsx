"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  User,
  ArrowRight,
  Clock,
  Sparkles,
  ChefHat,
  Bike,
} from "lucide-react";
import { SvgFlourish } from "@/components/creative/SvgFlourish";
import { SteamAroma } from "@/components/creative/SteamAroma";

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
    desc: "36 Delicacies & Charcoal Specialties",
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
  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
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

  if (!isOpen) return null;

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#07080a]/98 backdrop-blur-2xl text-white overflow-y-auto animate-mobile-menu-fade"
    >
      {/* Cassie Evans subtle ambient steam vapor in top background */}
      <SteamAroma className="top-4 left-1/2 -translate-x-1/2 opacity-25" />

      {/* Atmospheric luxury glows */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-brand-red/[0.08] blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-gold/[0.05] blur-[100px] pointer-events-none -z-10" />

      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.08]">
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2a0e13] via-[#1a080b] to-[#0c0406] border border-brand-red/40 font-serif font-black text-lg shadow-[0_4px_16px_rgba(225,29,72,0.25)]">
            <span className="tracking-tight text-white">S</span>
            <span className="text-[12px] text-brand-red font-sans font-bold -ml-0.5">C</span>
          </div>
          <div>
            <span className="font-serif text-xl font-black tracking-tight text-white block leading-none">
              Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
            </span>
            <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-gray-400 mt-1 flex items-center gap-1 font-mono">
              <MapPin className="h-2.5 w-2.5 text-brand-red" /> 07°20&apos;N, 02°20&apos;W
            </span>
          </div>
        </Link>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-95"
          aria-label="Close menu"
        >
          <span className="text-[11px] uppercase tracking-wider">Close</span>
          <X className="h-4 w-4 text-brand-red" />
        </button>
      </div>

      {/* EDITORIAL NAVIGATION LINKS (Locomotive typography + Cassie Evans flourish) */}
      <div className="flex-1 px-6 py-8 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-red/80 flex items-center gap-2">
          <span className="h-px w-4 bg-brand-red/60" />
          <span>Curated Gastronomy Experience</span>
        </div>

        <nav className="space-y-4">
          {MENU_ITEMS.map((item, idx) => {
            const active = isActive(item.href);

            return (
              <div
                key={item.name}
                className="group relative"
                style={{
                  animation: `menuSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.06}s forwards`,
                  opacity: 0,
                  transform: "translateY(16px)",
                }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block py-1 transition-all duration-200"
                >
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-brand-red/70 font-semibold tracking-wider">
                        {item.index}
                      </span>
                      <span
                        className={`font-serif text-3xl sm:text-4xl font-bold tracking-tight transition-colors ${
                          active
                            ? "text-brand-red italic"
                            : "text-white group-hover:text-brand-red"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <ArrowRight
                      className={`h-5 w-5 transition-transform duration-300 ${
                        active
                          ? "text-brand-red translate-x-0"
                          : "text-gray-600 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-white"
                      }`}
                    />
                  </div>

                  <p className="text-xs text-gray-400 font-light mt-1 pl-7">
                    {item.desc}
                  </p>

                  {/* Cassie Evans organic stroke flourish for active link */}
                  {active && (
                    <div className="pl-7 mt-1.5">
                      <SvgFlourish width={160} height={12} color="#e11d48" />
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* PRIMARY AUTH ACTION BUTTON */}
        <div className="pt-3">
          <Link
            href="/login"
            onClick={onClose}
            className="btn-red-gradient flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white shadow-glow transition-all active:scale-95"
          >
            <User className="h-4 w-4" />
            <span>Sign In to Sika Account</span>
          </Link>
        </div>
      </div>

      {/* LOCOMOTIVE FOOTER UTILITY STRIP */}
      <div className="px-5 pt-4 pb-6 border-t border-white/[0.08] bg-[#0c0d12]/90 space-y-4">
        {/* Quick-dial Sunyani dispatch hotline & WhatsApp */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href="tel:+233533376760"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-200/90 border border-white/5 text-gray-200 hover:text-white font-mono text-[11px] transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-brand-red" />
            <span>0533376760</span>
          </a>

          <a
            href="https://wa.me/233533376760?text=Hello%20Sika%20Cuisine,%20I%20want%20to%20order%20food"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-semibold text-[11px] shadow-sm transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>WhatsApp Kitchen</span>
          </a>
        </div>

        {/* Terminal portals & address info */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-300">Kitchen Open &bull; Sunyani Central</span>
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

      <style jsx>{`
        @keyframes menuSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-mobile-menu-fade {
          animation: menuFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes menuFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
