"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MapPin,
  Clock,
  Truck,
  Store,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { SUNYANI_DELIVERY_ZONES, getZoneFeePesewas } from "@/lib/delivery-zones";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { SikaMotion } from "@sika/shared";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    subtotalPesewas,
    totalCount,
  } = useCart();

  const [fulfilmentMode, setFulfilmentMode] = useState<"DELIVERY" | "COLLECTION">("DELIVERY");
  const [selectedZone, setSelectedZone] = useState<string>(SUNYANI_DELIVERY_ZONES[0].name);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isCartOpen) return;

    const timer = window.setTimeout(() => closeBtnRef.current?.focus(), 10);
    const originalBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmClearOpen) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalBody;
    };
  }, [isCartOpen, confirmClearOpen, setIsCartOpen]);

  if (!mounted) return null;

  const currentZoneFeePesewas =
    fulfilmentMode === "COLLECTION" ? 0 : getZoneFeePesewas(selectedZone);
  const estimatedTotalPesewas = subtotalPesewas + currentZoneFeePesewas;

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: SikaMotion.quick / 1000 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Your Order Tray"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: SikaMotion.standard / 1000, ease: SikaMotion.ease }}
              className="relative z-10 flex h-full w-full sm:max-w-md flex-col border-l border-[#333333] bg-[#101010] p-5 sm:p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#333333]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D71920]/40 bg-[#D71920]/15 text-[#F0444A]">
                    <RestaurantClocheIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight">
                      Your Order Tray
                    </h2>
                    <span className="text-xs font-medium text-[#A3A3A3]">
                      {totalCount} {totalCount === 1 ? "item" : "items"} selected
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmClearOpen(true)}
                      className="rounded-xl border border-[#333333] bg-[#1C1C1C] px-2.5 py-1.5 text-[11px] font-semibold text-[#A3A3A3] hover:border-[#FB7185]/40 hover:text-[#FDA4AF] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:bg-[#262626] hover:text-white transition-colors"
                    aria-label="Close order tray"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#333333] bg-[#1C1C1C] text-[#F0444A]">
                    <RestaurantClocheIcon className="h-8 w-8" />
                  </div>
                  <p className="font-serif text-xl font-bold text-[#F5F1EA] mb-1.5">
                    Your order tray is empty
                  </p>
                  <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-xs mb-6 leading-relaxed">
                    Browse our Ghanaian classics, grilled tilapia, packages, and stone-baked pizzas crafted fresh in Sunyani.
                  </p>
                  <Link
                    href="/menu"
                    onClick={() => setIsCartOpen(false)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#D71920] hover:bg-[#A91017] px-6 py-3 text-sm font-bold text-white transition-colors shadow-[0_6px_18px_rgba(215,25,32,0.35)]"
                  >
                    <span>Explore Menu</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <>
                  {/* Scrollable Items */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3.5 rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-20 w-20 flex-shrink-0 rounded-xl object-cover border border-[#333333] bg-[#262626]"
                        />

                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-serif text-sm font-bold text-white leading-snug line-clamp-2">
                                {item.name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="rounded-lg p-1 text-[#737373] hover:bg-[#262626] hover:text-[#FDA4AF] transition-colors flex-shrink-0"
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>

                            {item.selectedOptions.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.selectedOptions.map((opt, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block rounded-md border border-[#333333] bg-[#262626] px-1.5 py-0.5 text-[10px] text-[#A3A3A3]"
                                  >
                                    {opt.optionName}
                                    {opt.priceDeltaPesewas > 0 &&
                                      ` (+${formatPesewasToGhs(opt.priceDeltaPesewas)})`}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.specialInstructions && (
                              <p className="mt-1 text-[11px] italic text-[#F0444A] line-clamp-1">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-xl border border-[#333333] bg-[#262626] p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#A3A3A3] hover:bg-[#1C1C1C] hover:text-white transition-colors"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="h-3 w-3" aria-hidden="true" />
                              </button>
                              <span className="tabular-nums min-w-[22px] text-center text-xs font-bold text-white font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#A3A3A3] hover:bg-[#1C1C1C] hover:text-white transition-colors"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>

                            <span className="tabular-nums text-sm font-extrabold text-[#F0444A] font-mono">
                              {formatPesewasToGhs(item.lineTotalPesewas)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estimator & Checkout Footer */}
                  <div className="border-t border-[#333333] pt-4 space-y-3.5 bg-[#101010]">
                    <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFulfilmentMode("DELIVERY")}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                            fulfilmentMode === "DELIVERY"
                              ? "border-[#D71920] bg-[#D71920]/15 text-white"
                              : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                          }`}
                        >
                          <Truck className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                          <span>Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFulfilmentMode("COLLECTION")}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                            fulfilmentMode === "COLLECTION"
                              ? "border-[#D71920] bg-[#D71920]/15 text-white"
                              : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                          }`}
                        >
                          <Store className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                          <span>Pickup (Free)</span>
                        </button>
                      </div>

                      {fulfilmentMode === "DELIVERY" ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-[#A3A3A3]">
                            <span className="flex items-center gap-1 font-semibold">
                              <MapPin className="h-3 w-3 text-[#F0444A]" aria-hidden="true" />
                              Sunyani delivery zone
                            </span>
                            <span className="flex items-center gap-1 text-[#F5F1EA]">
                              <Clock className="h-3 w-3 text-[#F0444A]" aria-hidden="true" />
                              ~30–45 mins
                            </span>
                          </div>
                          <Select
                            ariaLabel="Select Sunyani delivery zone"
                            value={selectedZone}
                            onChange={setSelectedZone}
                            placement="top"
                            variant="elevated"
                            size="sm"
                            fullWidth
                            options={SUNYANI_DELIVERY_ZONES.map((zone) => ({
                              value: zone.name,
                              label: zone.name,
                              description: `Est. ~${zone.estimatedMinutes} mins`,
                              meta: formatPesewasToGhs(zone.feePesewas),
                            }))}
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#4ADE80] font-medium">
                          Collect at Commercial Rd, Sunyani Central — GH₵ 0.00 delivery fee.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-[#A3A3A3] px-1">
                      <div className="flex justify-between">
                        <span>Dishes Subtotal</span>
                        <span className="tabular-nums font-semibold text-[#F5F1EA] font-mono">
                          {formatPesewasToGhs(subtotalPesewas)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{fulfilmentMode === "COLLECTION" ? "Collection Fee" : "Est. Delivery"}</span>
                        <span className="tabular-nums font-semibold text-[#F5F1EA] font-mono">
                          {currentZoneFeePesewas === 0
                            ? "FREE (GH₵ 0.00)"
                            : formatPesewasToGhs(currentZoneFeePesewas)}
                        </span>
                      </div>
                      <div className="border-t border-[#333333] pt-2.5 flex justify-between items-baseline">
                        <span className="font-serif text-sm font-bold text-white">Estimated Total</span>
                        <span className="tabular-nums font-serif text-xl font-black text-[#F0444A] font-mono">
                          {formatPesewasToGhs(estimatedTotalPesewas)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D71920] hover:bg-[#A91017] py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(215,25,32,0.4)] transition-colors"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Clear your order tray?"
        description="This removes every dish currently in your tray. You can add dishes back anytime from the menu."
        confirmLabel="Clear tray"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearCart();
          setConfirmClearOpen(false);
        }}
      />
    </>
  );
}
