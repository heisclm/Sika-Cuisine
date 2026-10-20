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
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

// Exactly matching desktop navigation 100%
const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Menu", href: "/menu" },
  { name: "Track Order", href: "/orders" },
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function isRouteActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-[#0c0d10]/92 backdrop-blur-2xl text-white flex flex-col justify-between overflow-y-auto overscroll-contain animate-menu-overlay select-none"
    >
      {/* Ambient Matte Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-[380px] pointer-events-none -z-10 bg-[radial-gradient(ellipse_90%_50%_at_50%_0%,#1f2128_0%,transparent_80%)]" />

      {/* TOP HEADER BAR (Apple Frosted Glass Header) */}
      <div className="flex items-center justify-between px-5 sm:px-8 h-18 sm:h-20 border-b border-white/[0.08] bg-[#0c0d10]/90 backdrop-blur-xl sticky top-0 z-20">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5 shrink-0">
          <Logo size={40} className="shadow-sm" />
          <div className="select-none">
            <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white block leading-none whitespace-nowrap">
              Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.18em] uppercase font-semibold text-gray-400 mt-1 flex items-center gap-1 font-mono whitespace-nowrap">
              <MapPin className="h-2.5 w-2.5 text-brand-red flex-shrink-0" /> Sunyani Central
            </span>
          </div>
        </Link>

        {/* Apple-Style Minimalist Circular Close Button */}
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10 shadow-sm"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* NAVIGATION LINKS (100% Matching Desktop with Apple Touch) */}
      <div className="flex-1 px-6 sm:px-8 py-8 flex flex-col justify-center max-w-lg mx-auto w-full">
        <nav className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {NAV_LINKS.map((link, idx) => {
            const active = isRouteActive(link.href, pathname);

            return (
              <div
                key={link.name}
                className="animate-menu-slide"
                style={{
                  animationDelay: `${idx * 0.04}s`,
                }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center justify-between py-4 sm:py-5 px-1 sm:px-2 transition-all duration-200 group active:opacity-75 ${
                    active ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Active State Glowing Red Dot (Apple/Studio touch) */}
                    <span
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        active
                          ? "bg-brand-red shadow-[0_0_10px_rgba(229,9,20,0.95)] scale-100"
                          : "bg-transparent scale-0"
                      }`}
                    />
                    <span
                      className={`text-2xl sm:text-3xl tracking-tight transition-transform duration-200 group-hover:translate-x-1 ${
                        active
                          ? "font-bold text-white"
                          : "font-normal text-gray-300 group-hover:text-white"
                      }`}
                    >
                      {link.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {active && (
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-brand-red bg-brand-red/10 border border-brand-red/30 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    <ChevronRight
                      className={`h-5 w-5 transition-transform duration-200 ${
                        active
                          ? "text-brand-red translate-x-0"
                          : "text-gray-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-white"
                      }`}
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Primary Auth Action Button (Matching Desktop Sign In) */}
        <div className="pt-8">
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

      {/* APPLE-STYLE FROSTED BOTTOM UTILITY BAR */}
      <div className="px-6 sm:px-8 py-5 border-t border-white/[0.08] bg-[#0c0d10]/95 space-y-3 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href="tel:+233533376760"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-gray-200 hover:text-white font-mono text-[11px] transition-all"
          >
            <Phone className="h-3.5 w-3.5 text-brand-red" />
            <span>0533376760</span>
          </a>

          <a
            href="https://wa.me/233533376760?text=Hello%20Sika%20Cuisine,%20I%20want%20to%20order%20food"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 text-emerald-300 font-semibold text-[11px] transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>WhatsApp Kitchen</span>
          </a>
        </div>

        {/* Sunyani Location & Status */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-300 font-medium">Kitchen Ready for Orders</span>
          </div>

          <span className="text-gray-500 font-mono text-[10px]">
            Commercial Rd, Sunyani
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
