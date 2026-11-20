"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  User,
  ChevronRight,
  ShoppingBag,
  Home,
  UtensilsCrossed,
  Receipt,
  Info,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CUSTOMER_NAV_LINKS, RESTAURANT_INFO } from "@/lib/navigation";
import { useCart } from "@/context/CartContext";
import { SikaMotion, WebNavIconKey } from "@sika/shared";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  sessionUser?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

const NAV_ICONS: Record<WebNavIconKey, React.ComponentType<{ className?: string }>> = {
  home: Home,
  utensils: UtensilsCrossed,
  receipt: Receipt,
  info: Info,
  phone: Phone,
};

function isRouteActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Responsive mobile/tablet side drawer extending the desktop navigation structure.
 * Enforces WCAG dialog semantics: backdrop dismiss, Escape key handler, Tab focus trap,
 * background scroll lock, safe-area inset padding, and focus return to `returnFocusRef`.
 */
export function MobileMenu({
  isOpen,
  onClose,
  pathname,
  returnFocusRef,
  sessionUser,
}: MobileMenuProps) {
  const { totalCount, setIsCartOpen } = useCart();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Defer focus slightly so portal content has mounted into DOM
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 10);

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const triggerToRestore = returnFocusRef.current;

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      triggerToRestore?.focus?.();
    };
  }, [isOpen, onClose, returnFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999]">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: SikaMotion.quick / 1000 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Slide-in Side Drawer */}
          <motion.section
            id="sika-mobile-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Primary mobile navigation"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: SikaMotion.standard / 1000, ease: SikaMotion.ease }}
            className="fixed inset-y-0 right-0 flex h-[100dvh] w-full max-w-sm flex-col border-l border-[#333333] bg-[#101010] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-[#FFFFFF] shadow-2xl"
          >
            {/* Top Header */}
            <div className="flex h-16 sm:h-20 shrink-0 items-center justify-between border-b border-[#333333] bg-[#101010] px-5">
              <Link href="/" onClick={onClose} className="flex items-center gap-2.5 shrink-0">
                <Logo size={38} />
                <div className="select-none">
                  <span className="font-serif text-xl font-black tracking-tight text-white block leading-none">
                    {RESTAURANT_INFO.brandName}
                    <span className="text-[#D71920] ml-0.5">.</span>
                  </span>
                  <span className="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A3A3A3]">
                    <MapPin className="h-2.5 w-2.5 text-[#F0444A]" aria-hidden="true" />
                    {RESTAURANT_INFO.city}
                  </span>
                </div>
              </Link>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#333333] bg-[#1C1C1C] text-[#F5F1EA] hover:border-[#D71920]/60 hover:bg-[#262626] transition-colors"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Nav + Actions */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 space-y-6">
              <nav aria-label="Mobile navigation links" className="space-y-1.5">
                {CUSTOMER_NAV_LINKS.map((link) => {
                  const active = isRouteActive(link.href, pathname);
                  const Icon = NAV_ICONS[link.icon];
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-all ${
                        active
                          ? "border-[#D71920]/50 bg-[#1C1C1C] text-white"
                          : "border-transparent bg-transparent text-[#A3A3A3] hover:border-[#333333] hover:bg-[#1C1C1C]/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                            active
                              ? "border-[#D71920]/40 bg-[#D71920]/15 text-[#F0444A]"
                              : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] group-hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="block text-base font-bold tracking-tight">{link.name}</span>
                          <span className="block text-[11px] text-[#737373]">{link.description}</span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
                          active ? "text-[#F0444A]" : "text-[#737373]"
                        }`}
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </nav>

              {/* Consistent Customer Actions */}
              <div className="space-y-2.5 border-t border-[#333333] pt-5">
                <Link
                  href={sessionUser ? "/account" : "/login"}
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D71920] hover:bg-[#A91017] py-3.5 text-sm font-bold text-white transition-colors shadow-[0_6px_18px_rgba(215,25,32,0.35)]"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>{sessionUser ? `Account (${sessionUser.fullName.split(" ")[0]})` : "Sign In / Register"}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsCartOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#333333] bg-[#1C1C1C] hover:bg-[#262626] py-3 text-sm font-semibold text-[#F5F1EA] transition-colors"
                >
                  <ShoppingBag className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                  <span>Open Order Tray</span>
                  {totalCount > 0 && (
                    <span className="rounded-full bg-[#D71920] px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                      {totalCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Verified Contact & Kitchen Footer */}
            <div className="shrink-0 border-t border-[#333333] bg-[#1C1C1C]/70 px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#333333] bg-[#262626] py-2.5 px-3 font-mono text-[11px] font-semibold text-[#F5F1EA] hover:border-[#D71920]/40 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  <span>{RESTAURANT_INFO.primaryPhone}</span>
                </a>
                <a
                  href={`${RESTAURANT_INFO.whatsappBaseUrl}?text=Hello%20Sika%20Cuisine`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#22C55E]/35 bg-[#22C55E]/10 py-2.5 px-3 font-semibold text-[11px] text-[#4ADE80] hover:bg-[#22C55E]/20 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>
              <p className="text-center font-mono text-[10px] text-[#737373]">
                {RESTAURANT_INFO.address}
              </p>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
