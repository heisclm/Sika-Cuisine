"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Menu, X, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";
import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const pathname = usePathname();
  const { totalCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "Track Order", href: "/orders" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isRouteActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#141518]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18 sm:h-20">
        
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <Logo size={42} className="shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:scale-105 group-hover:rotate-[-2deg] transition-all duration-300" />
          <div className="flex flex-col select-none">
            <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white flex items-center leading-none whitespace-nowrap">
              Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.2em] uppercase font-semibold text-gray-400 mt-1 flex items-center gap-1 font-mono whitespace-nowrap">
              <MapPin className="h-2.5 w-2.5 text-brand-red flex-shrink-0" /> Sunyani, Ghana
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links - reserved for lg+ viewports to prevent tablet collision */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => {
            const active = isRouteActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-all duration-200 whitespace-nowrap relative py-1.5 ${
                  active
                    ? "text-white font-semibold"
                    : "text-gray-300 hover:text-white hover:-translate-y-0.5"
                }`}
              >
                <span>{link.name}</span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red rounded-full shadow-[0_0_8px_rgba(229,9,20,0.7)] animate-scale-in" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Dining Order Tray Button with Cassie Evans cloche micro-interaction */}
          <button
            id="header-cart-button"
            onClick={() => setIsCartOpen(true)}
            className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#1c1d22] border border-white/10 text-white hover:border-brand-red/50 hover:bg-[#25272e] active:scale-95 transition-all duration-200 shadow-sm"
            aria-label="View order tray"
          >
            <div className="group-hover:-translate-y-0.5 group-hover:rotate-[-3deg] transition-transform duration-300 ease-out">
              <RestaurantClocheIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[11px] font-bold text-white shadow-md animate-scale-in">
                {totalCount}
              </span>
            )}
          </button>

          {/* Desktop/Tablet Sign In Pill Button */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-red hover:bg-brand-red-hover active:scale-95 transition-all shadow-[0_4px_14px_rgba(229,9,20,0.35)] shrink-0 whitespace-nowrap"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>

          {/* Mobile & Tablet Circular Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#1c1d22] border border-white/10 text-gray-200 hover:text-white hover:bg-[#25272e] active:scale-95 transition-all shadow-sm"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-brand-red" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Full-Screen Matte Studio Mobile Navigation */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        pathname={pathname}
      />
    </header>
  );
}
