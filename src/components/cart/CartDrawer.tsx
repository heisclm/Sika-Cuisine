"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MapPin, Clock, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { SUNYANI_DELIVERY_ZONES, getZoneFeePesewas } from "@/lib/delivery-zones";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    subtotalPesewas,
    totalCount,
  } = useCart();

  const [selectedZone, setSelectedZone] = useState<string>(SUNYANI_DELIVERY_ZONES[0].name);

  // Close drawer on Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const currentZoneFeePesewas = getZoneFeePesewas(selectedZone);
  const estimatedTotalPesewas = subtotalPesewas + currentZoneFeePesewas;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your Order Cart"
        className="relative z-10 flex h-full w-full sm:max-w-md flex-col bg-surface-300 border-l border-border-subtle p-5 sm:p-6 shadow-2xl animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-red/15 text-brand-red border border-brand-red/30">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                Your Culinary Feast
              </h2>
              <span className="text-[11px] font-semibold text-gray-400">
                {totalCount} {totalCount === 1 ? "delicacy" : "delicacies"} selected
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="rounded-full p-2 text-gray-400 hover:bg-surface-100 hover:text-white transition-colors"
            aria-label="Close cart drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 text-gray-500 mb-4 border border-border-subtle">
              <ShoppingBag className="h-9 w-9 stroke-1 text-gray-400" />
            </div>
            <p className="text-lg font-serif font-medium text-white mb-1">
              Your plate is empty
            </p>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xs mb-6 font-light">
              Explore authentic charcoal-grilled tilapia, slow-simmered jollof, soups, and pizza in Sunyani.
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="btn-red-gradient inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white shadow-glow"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 rounded-2xl bg-surface-200/80 p-3.5 border border-border-subtle/70"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-18 w-18 sm:h-20 sm:w-20 flex-shrink-0 rounded-xl object-cover border border-white/5"
                  />

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight font-serif">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-500 hover:text-brand-red transition-colors p-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {item.selectedOptions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selectedOptions.map((opt, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-[10px] text-gray-400 bg-surface-100 px-1.5 py-0.5 rounded"
                            >
                              {opt.optionName}
                              {opt.priceDeltaPesewas > 0 &&
                                ` (+${formatPesewasToGhs(opt.priceDeltaPesewas)})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full bg-surface-100 px-2 py-1 border border-border-subtle">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-gray-400 hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-white min-w-[16px] text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-gray-400 hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-xs sm:text-sm font-bold text-brand-red font-mono">
                        {formatPesewasToGhs(item.lineTotalPesewas)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Delivery Estimator */}
            <div className="border-t border-border-subtle pt-3 pb-2 space-y-3 bg-surface-300">
              <div className="rounded-2xl bg-surface-200/90 border border-border-subtle p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-red" />
                    <span>Sunyani Delivery Estimator</span>
                  </span>
                  <span className="text-[11px] text-brand-gold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>~25-35 mins</span>
                  </span>
                </div>

                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full rounded-xl bg-surface-100 border border-border-subtle px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                >
                  {SUNYANI_DELIVERY_ZONES.map((zone) => (
                    <option key={zone.id} value={zone.name} className="bg-surface-300 text-white">
                      {zone.name} ({formatPesewasToGhs(zone.feePesewas)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Breakdown in integer pesewas */}
              <div className="space-y-1.5 text-xs text-gray-400 px-1">
                <div className="flex justify-between">
                  <span>Delicacies Subtotal</span>
                  <span className="font-semibold text-white font-mono">
                    {formatPesewasToGhs(subtotalPesewas)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Delivery ({selectedZone})</span>
                  <span className="font-semibold text-white font-mono">
                    {formatPesewasToGhs(currentZoneFeePesewas)}
                  </span>
                </div>
                <div className="border-t border-border-subtle/60 pt-2 flex justify-between items-baseline">
                  <span className="font-serif text-sm font-bold text-white">Estimated Total</span>
                  <span className="font-serif text-xl font-black text-brand-red font-mono">
                    {formatPesewasToGhs(estimatedTotalPesewas)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="btn-red-gradient flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm sm:text-base font-semibold text-white tracking-wide shadow-glow"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
