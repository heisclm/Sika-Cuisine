"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, MapPin, Menu, X, User } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function Navbar() {
  const pathname = usePathname();
  const { totalCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle/70 bg-surface-400/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red font-serif font-black text-xl group-hover:scale-105 transition-transform">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-black tracking-tight text-white flex items-center">
              Sika Cuisine<span className="text-brand-red ml-0.5">.</span>
            </span>
            <span className="text-[10px] tracking-widest uppercase font-medium text-gray-400 -mt-1 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5 text-brand-red" /> Sunyani, Ghana
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-white ${
                isActive(link.href)
                  ? "text-white font-semibold after:block after:h-0.5 after:w-full after:bg-brand-red after:mt-1 after:rounded-full"
                  : "text-gray-300"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Action Icons: Cart & Auth */}
        <div className="flex items-center gap-4">
          {/* Cart Icon Button with Badge */}
          <button
            id="header-cart-button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-100 border border-border-subtle text-white hover:border-brand-red/50 hover:bg-surface-50 transition-all duration-200"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[11px] font-bold text-white shadow-glow">
                {totalCount}
              </span>
            )}
          </button>

          {/* Customer / Staff Sign In */}
          <Link
            href="/login"
            className="hidden sm:inline-flex btn-red-gradient items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white tracking-wide"
          >
            <User className="h-4 w-4" />
            <span>Sign In</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 text-gray-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-subtle bg-surface-300 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-base font-medium ${
                isActive(link.href)
                  ? "bg-brand-red/10 text-brand-red font-semibold"
                  : "text-gray-300 hover:bg-surface-100 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-red-gradient flex w-full items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white"
            >
              <User className="h-4 w-4" />
              Sign In / Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
