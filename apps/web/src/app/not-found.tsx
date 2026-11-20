import React from "react";
import Link from "next/link";
import { Compass, Home, UtensilsCrossed } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-8 text-center space-y-5 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D71920]/40 bg-[#D71920]/15 text-[#F0444A]">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            404 — Page Missing
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1EA]">
            Dish or Page Not Found
          </h1>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            The route you followed does not exist or may have moved. Head back to our Sunyani menu or homepage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/menu"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-5 text-sm font-semibold text-white transition-colors"
          >
            <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            <span>Browse Menu</span>
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-5 text-sm font-semibold text-[#F5F1EA] transition-colors"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
