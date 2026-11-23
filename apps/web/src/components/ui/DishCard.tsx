"use client";

import React from "react";
import Link from "next/link";
import { Clock, Flame, Minus, Plus, Sparkles, SlidersHorizontal } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";

interface DishCardProps {
  dish: MenuItem;
  cardRef?: (el: HTMLDivElement | null) => void;
  onSelectDish: (dish: MenuItem) => void;
  onQuickAdd: (dish: MenuItem, e: React.MouseEvent) => void;
  className?: string;
  priority?: boolean;
}

/**
 * Editorial photographic dish card implementing Sika Cuisine's dark-charcoal visual system.
 * Highlights the real food photograph first, surfaces availability and preparation time clearly,
 * and allows quick addition or customization modal launch.
 */
export function DishCard({
  dish,
  cardRef,
  onSelectDish,
  onQuickAdd,
  className = "",
  priority = false,
}: DishCardProps) {
  const { items, updateQuantity } = useCart();
  const [imgError, setImgError] = React.useState(false);
  const requiresCustomization = Boolean(dish.optionGroups?.some((g) => g.isRequired));
  const prepMins = dish.preparationTimeMinutes ?? 20;
  const spice = dish.spiceLevel ?? 0;

  const simpleCartItem = !requiresCustomization
    ? items.find(
        (i) =>
          i.menuItemId === dish.id &&
          i.selectedOptions.length === 0 &&
          !i.specialInstructions
      )
    : undefined;

  return (
    <article
      ref={cardRef}
      className={`group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-[20px] border border-[#333333] bg-[#1C1C1C] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transform-gpu transition-all duration-300 ${
        dish.isAvailable
          ? "hover:-translate-y-1 hover:border-[#D71920]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_20px_42px_-14px_rgba(0,0,0,0.9)]"
          : "opacity-70"
      } ${className}`}
    >
      {/* Large photographic visual */}
      <button
        type="button"
        onClick={() => onSelectDish(dish)}
        className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#1C1C1C] text-left transform-gpu focus-visible:outline-none"
        aria-label={`View details for ${dish.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgError ? "/images/dishes/hero-signature-plate.jpg" : dish.imageUrl}
          alt={dish.name}
          onError={() => setImgError(true)}
          className={`block h-full w-full object-cover transform-gpu will-change-transform transition-transform duration-500 ease-out ${
            dish.isAvailable ? "group-hover:scale-105" : "grayscale-[65%]"
          }`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="pointer-events-none absolute -inset-x-px -bottom-px top-0 bg-gradient-to-t from-[#1C1C1C] from-[2%] via-[#1C1C1C]/20 to-black/35" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between gap-1.5 sm:gap-2">
          {!dish.isAvailable ? (
            <span className="inline-flex items-center rounded-full border border-[#FB7185]/45 bg-[#101010]/85 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#FDA4AF] backdrop-blur-md">
              <span className="sm:hidden">Sold Out</span>
              <span className="hidden sm:inline">Currently Unavailable</span>
            </span>
          ) : dish.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D71920] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
              Signature
            </span>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#101010]/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-[#F5F1EA] backdrop-blur-md">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#F0444A]" aria-hidden="true" />
            {prepMins}m
          </span>
        </div>
      </button>

      {/* Card body */}
      <div className="relative z-10 -mt-px flex flex-1 flex-col justify-between bg-[#1C1C1C] p-3 sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <span className="truncate text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#F0444A]">
              {dish.categoryName || "Sika Kitchen"}
            </span>
            {spice > 0 && (
              <span
                className="inline-flex flex-shrink-0 items-center gap-0.5 text-[10px] sm:text-[11px] font-medium text-[#A3A3A3]"
                title={`Spice level ${spice} of 3`}
              >
                {Array.from({ length: Math.min(spice, 3) }).map((_, i) => (
                  <Flame key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#F0444A]" aria-hidden="true" />
                ))}
                <span className="sr-only">Spice level {spice} of 3</span>
              </span>
            )}
          </div>

          <h3 className="mt-1 sm:mt-1.5 font-serif text-sm sm:text-lg font-bold leading-snug text-[#FFFFFF] group-hover:text-[#F5F1EA] line-clamp-2">
            <Link
              href={`/menu/${dish.slug}`}
              className="hover:text-[#F0444A] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {dish.name}
            </Link>
          </h3>

          <p className="mt-1 sm:mt-1.5 line-clamp-2 text-[11px] sm:text-xs leading-relaxed text-[#A3A3A3]">
            {dish.description}
          </p>
        </div>

        {/* Footer action */}
        <div className="mt-3 sm:mt-5 flex items-center justify-between gap-1.5 sm:gap-3 border-t border-[#333333] pt-2.5 sm:pt-4">
          <div className="min-w-0">
            <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
              Price
            </span>
            <span className="tabular-nums text-sm sm:text-base font-extrabold text-[#F5F1EA] group-hover:text-white transition-colors truncate block">
              {formatPesewasToGhs(dish.basePricePesewas)}
            </span>
          </div>

          {dish.isAvailable && !requiresCustomization && simpleCartItem ? (
            <div
              className="inline-flex h-8 sm:h-10 flex-shrink-0 items-center overflow-hidden rounded-lg sm:rounded-xl bg-[#D71920] text-white shadow-[0_4px_14px_rgba(215,25,32,0.35)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(simpleCartItem.id, simpleCartItem.quantity - 1);
                }}
                aria-label={`Decrease quantity of ${dish.name}`}
                className="flex h-full items-center justify-center px-2 sm:px-2.5 hover:bg-[#A91017] active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
              >
                <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              </button>
              <span
                className="min-w-[20px] sm:min-w-[24px] select-none text-center text-xs font-extrabold tabular-nums"
                aria-live="polite"
              >
                {simpleCartItem.quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(simpleCartItem.id, simpleCartItem.quantity + 1);
                }}
                aria-label={`Increase quantity of ${dish.name}`}
                className="flex h-full items-center justify-center px-2 sm:px-2.5 hover:bg-[#A91017] active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!dish.isAvailable}
              onClick={(e) => dish.isAvailable && onQuickAdd(dish, e)}
              aria-label={
                !dish.isAvailable
                  ? `${dish.name} is unavailable`
                  : requiresCustomization
                  ? `Customize ${dish.name}`
                  : `Add ${dish.name} to cart`
              }
              className={`inline-flex h-8 sm:h-10 flex-shrink-0 items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0444A] ${
                !dish.isAvailable
                  ? "cursor-not-allowed border border-[#333333] bg-[#262626] text-[#737373]"
                  : "bg-[#D71920] text-white hover:bg-[#A91017] shadow-[0_4px_14px_rgba(215,25,32,0.35)]"
              }`}
            >
              {!dish.isAvailable ? (
                <>
                  <span className="sm:hidden">Out</span>
                  <span className="hidden sm:inline">Sold out</span>
                </>
              ) : requiresCustomization ? (
                <>
                  <SlidersHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                  <span className="sm:hidden">Select</span>
                  <span className="hidden sm:inline">Customize</span>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
