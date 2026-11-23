"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";
import { SikaMotion } from "@sika/shared";

const HIDDEN_ROUTE_PREFIXES = [
  "/checkout",
  "/admin",
  "/cashier",
  "/kitchen",
  "/rider",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Floating mobile-web order tray bar (`< 1024px`) surfacing live item count,
 * GH₵ subtotal, and instant drawer access without leaving menu or home browsing.
 */
export function FloatingMobileCartBar() {
  const pathname = usePathname();
  const { totalCount, subtotalPesewas, isCartOpen, setIsCartOpen } = useCart();

  const isHiddenRoute = HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const visible = totalCount > 0 && !isCartOpen && !isHiddenRoute;

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <motion.button
            type="button"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: SikaMotion.quick / 1000, ease: SikaMotion.ease }}
            onClick={() => setIsCartOpen(true)}
            aria-label={`View order tray with ${totalCount} ${
              totalCount === 1 ? "item" : "items"
            }, subtotal ${formatPesewasToGhs(subtotalPesewas)}`}
            className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#161616]/92 px-3.5 py-2.5 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0444A]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 min-w-[32px] items-center justify-center rounded-xl bg-[#D71920] px-2 text-xs font-extrabold text-white tabular-nums shadow-[0_4px_12px_rgba(215,25,32,0.4)]">
                {totalCount}
              </span>
              <RestaurantClocheIcon className="h-4 w-4 shrink-0 text-[#F5F1EA]" />
              <div className="min-w-0 text-left">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3] leading-none">
                  Order Tray
                </span>
                <span className="mt-1 block truncate text-sm font-extrabold text-white tabular-nums leading-none">
                  {formatPesewasToGhs(subtotalPesewas)}
                </span>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#D71920] px-3.5 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(215,25,32,0.35)]">
              <span>View Tray</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
