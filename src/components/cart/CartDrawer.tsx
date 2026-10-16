"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";

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

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-surface-300 border-l border-border-subtle p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-red" />
            <h2 className="text-xl font-serif font-bold text-white tracking-wide">
              Your Order
            </h2>
            <span className="ml-2 rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="rounded-full p-2 text-gray-400 hover:bg-surface-100 hover:text-white transition-colors"
            aria-label="Close cart"
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
            <p className="text-sm text-gray-400 max-w-xs mb-6">
              Discover authentic Ghanaian culinary delicacies from Sunyani and add your favorites to get started.
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="btn-red-gradient inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl bg-surface-200/70 p-3.5 border border-border-subtle/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover border border-white/5"
                  />

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white leading-tight">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-500 hover:text-brand-red transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.selectedOptions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selectedOptions.map((opt, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-[11px] text-gray-400 bg-surface-100 px-1.5 py-0.5 rounded"
                            >
                              {opt.optionName}
                              {opt.priceDeltaPesewas > 0 &&
                                ` (+${formatPesewasToGhs(opt.priceDeltaPesewas)})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full bg-surface-100 px-2 py-1 border border-border-subtle">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-gray-400 hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-white min-w-[16px] text-center">
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

                      <span className="text-sm font-bold text-brand-red">
                        {formatPesewasToGhs(item.lineTotalPesewas)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Subtotal</span>
                <span className="text-xl font-bold font-serif text-white">
                  {formatPesewasToGhs(subtotalPesewas)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Delivery fees calculated during checkout according to Sunyani zones.
              </p>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="btn-red-gradient flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white tracking-wide"
              >
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
