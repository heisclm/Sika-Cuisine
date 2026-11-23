"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Menu, X, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MobileMenu } from "./MobileMenu";
import { CUSTOMER_NAV_LINKS, RESTAURANT_INFO } from "@/lib/navigation";
import { formatFirstName, getDashboardForRole, SikaMotion } from "@sika/shared";

interface NavSessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

/**
 * Primary persistent Web navigation bar.
 * Consumes `CUSTOMER_NAV_LINKS` from `@sika/shared` so desktop links and the responsive
 * mobile side drawer always share identical destinations, labels, and active route states.
 */
export function Navbar() {
  const pathname = usePathname();
  const { totalCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<NavSessionUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (active && payload?.success && payload.user) {
          setSessionUser(payload.user);
        } else if (active) {
          setSessionUser(null);
        }
      })
      .catch(() => {
        if (active) setSessionUser(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const firstName = formatFirstName(sessionUser?.fullName, "Account", 14);
  const accountDestination = sessionUser ? getDashboardForRole(sessionUser.role) : null;
  const accountHref = accountDestination ? accountDestination.path : "/login";
  const accountLabel = sessionUser
    ? sessionUser.role === "CUSTOMER"
      ? firstName
      : `${accountDestination?.shortLabel}`
    : "Sign In";

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? "border-white/10 bg-[#101010]/85 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-[#333333]/80 bg-[#101010]/95"
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand Identity */}
        <Link
          href="/"
          className="group flex items-center gap-3 shrink-0 rounded-xl focus-visible:outline-none"
        >
          <Logo
            size={40}
            className="shadow-[0_4px_14px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col select-none">
            <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white flex items-center leading-none whitespace-nowrap">
              {RESTAURANT_INFO.brandName}
              <span className="text-[#D71920] ml-0.5">.</span>
            </span>
            <span className="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A3A3A3] whitespace-nowrap">
              <MapPin className="h-2.5 w-2.5 text-[#F0444A] flex-shrink-0" aria-hidden="true" />
              {RESTAURANT_INFO.city}
            </span>
          </div>
        </Link>

        {/* Desktop Primary Links */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-2 xl:gap-3">
          {CUSTOMER_NAV_LINKS.map((link) => {
            const active = isRouteActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                  active ? "text-white font-semibold" : "text-[#A3A3A3] hover:text-[#F5F1EA]"
                }`}
              >
                <span className="relative z-10">{link.name}</span>
                {active && (
                  <motion.span
                    layoutId="sika-desktop-nav-pill"
                    transition={{ type: "spring", ...SikaMotion.spring }}
                    className="absolute inset-0 rounded-full border border-[#D71920]/45 bg-[#1C1C1C]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Notifications + Cart + Account + Mobile Drawer Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {sessionUser && <NotificationBell userId={sessionUser.id} />}
          <button
            id="header-cart-button"
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-[#333333] bg-[#1C1C1C] text-[#F5F1EA] hover:border-[#D71920]/60 hover:bg-[#262626] active:scale-95 transition-all"
            aria-label={`View cart (${totalCount} ${totalCount === 1 ? "item" : "items"})`}
          >
            <RestaurantClocheIcon className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
            {totalCount > 0 && (
              <motion.span
                key={totalCount}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-[#D71920] text-[11px] font-bold text-white shadow-md tabular-nums"
              >
                {totalCount}
              </motion.span>
            )}
          </button>

          <Link
            href={accountHref}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#D71920] hover:bg-[#A91017] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white active:scale-95 transition-all shadow-[0_6px_18px_rgba(215,25,32,0.35)] whitespace-nowrap max-w-[165px]"
          >
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{accountLabel}</span>
          </Link>

          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-[#333333] bg-[#1C1C1C] text-[#F5F1EA] hover:border-[#D71920]/50 hover:bg-[#262626] active:scale-95 transition-all"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="sika-mobile-drawer"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-[#F0444A]" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        pathname={pathname}
        returnFocusRef={menuTriggerRef}
        sessionUser={sessionUser}
      />
    </header>
  );
}
