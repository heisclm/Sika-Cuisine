"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Minus, Flame, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { MenuItem, MenuItemOption, SelectedOptionSnapshot } from "@/types/menu";
import { formatPesewasToGhs, calculateLineTotalPesewas } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";
import { SikaMotion } from "@sika/shared";

interface DishDetailModalProps {
  dish: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  sourceElement?: HTMLElement | null;
}

export function DishDetailModal({
  dish,
  isOpen,
  onClose,
  sourceElement,
}: DishDetailModalProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { success } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<{
    [groupId: string]: MenuItemOption[];
  }>({});
  const [instructions, setInstructions] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form selections whenever opening a new dish
  useEffect(() => {
    if (!dish || !isOpen) return;
    setQuantity(1);
    setInstructions("");
    setValidationError(null);
    const defaults: { [groupId: string]: MenuItemOption[] } = {};
    dish.optionGroups?.forEach((group) => {
      if (group.isRequired && group.options.length > 0) {
        const firstAvailable = group.options.find((o) => o.isAvailable);
        if (firstAvailable) defaults[group.id] = [firstAvailable];
      }
    });
    setSelectedOptionsMap(defaults);
  }, [dish, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 10);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleSelectOption = (
    groupId: string,
    option: MenuItemOption,
    maxSelect: number
  ) => {
    if (!option.isAvailable) return;
    setValidationError(null);
    setSelectedOptionsMap((prev) => {
      const current = prev[groupId] || [];
      if (maxSelect === 1) {
        return { ...prev, [groupId]: [option] };
      }
      const exists = current.some((o) => o.id === option.id);
      if (exists) {
        return { ...prev, [groupId]: current.filter((o) => o.id !== option.id) };
      }
      if (current.length < maxSelect) {
        return { ...prev, [groupId]: [...current, option] };
      }
      return prev;
    });
  };

  const selectedOptionsList: SelectedOptionSnapshot[] = [];
  let optionsDeltaPesewas = 0;

  if (dish) {
    dish.optionGroups?.forEach((group) => {
      const selectedInGroup = selectedOptionsMap[group.id] || [];
      selectedInGroup.forEach((opt) => {
        optionsDeltaPesewas += opt.priceDeltaPesewas;
        selectedOptionsList.push({
          optionGroupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionName: opt.name,
          priceDeltaPesewas: opt.priceDeltaPesewas,
        });
      });
    });
  }

  const lineTotalPesewas = dish
    ? calculateLineTotalPesewas(dish.basePricePesewas, quantity, optionsDeltaPesewas)
    : 0;

  const handleAddToCart = () => {
    if (!dish || !dish.isAvailable) return;

    const missingRequired = dish.optionGroups?.find((group) => {
      const minRequired = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
      return (selectedOptionsMap[group.id]?.length ?? 0) < minRequired;
    });

    if (missingRequired) {
      setValidationError(`Please select an option for "${missingRequired.name}".`);
      return;
    }

    addItem(dish, selectedOptionsList, quantity, instructions.trim() || undefined, sourceElement);
    success(
      `Added ${quantity}x ${dish.name}`,
      "Freshly added to your Sika order tray",
      {
        label: "View Tray",
        onClick: () => setIsCartOpen(true),
      }
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && dish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: SikaMotion.quick / 1000 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={dish.name}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: SikaMotion.standard / 1000, ease: SikaMotion.ease }}
            className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-[#333333] bg-[#1C1C1C] shadow-2xl max-h-[90dvh]"
          >
            {/* Header Photo */}
            <div className="relative h-56 sm:h-64 w-full flex-shrink-0 bg-[#262626]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className={`h-full w-full object-cover ${!dish.isAvailable ? "grayscale-[70%]" : ""}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/20 to-black/50" />

              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#101010]/75 text-white hover:bg-[#101010] transition-colors backdrop-blur-md"
                aria-label="Close dish dialog"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#101010]/80 px-3 py-1 text-xs font-semibold text-[#F5F1EA] backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  {dish.preparationTimeMinutes ?? 20} mins
                </span>
                {dish.spiceLevel && dish.spiceLevel > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#101010]/80 px-3 py-1 text-xs font-semibold text-[#F0444A] backdrop-blur-md">
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    Spice {dish.spiceLevel}/3
                  </span>
                ) : null}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-[0.16em] text-[#F0444A]">
                    {dish.categoryName || "Sunyani Delicacy"}
                  </span>
                  <Link
                    href={`/menu/${dish.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#A3A3A3] hover:text-[#F5F1EA] transition-colors"
                  >
                    <span>Full page</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
                <h2 className="mt-1 font-serif text-2xl font-bold text-white">
                  {dish.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#A3A3A3]">
                  {dish.description}
                </p>
              </div>

              {validationError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-3.5 py-2.5 text-xs font-medium text-[#FDA4AF]"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}

              {dish.optionGroups && dish.optionGroups.length > 0 && (
                <div className="space-y-4">
                  {dish.optionGroups.map((group) => {
                    const selectedInGroup = selectedOptionsMap[group.id] || [];
                    return (
                      <div
                        key={group.id}
                        className="rounded-2xl border border-[#333333] bg-[#262626] p-4"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h4 className="font-serif text-sm font-bold text-white">
                              {group.name}
                            </h4>
                            {group.description && (
                              <p className="text-xs text-[#A3A3A3]">{group.description}</p>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              group.isRequired
                                ? "bg-[#D71920]/15 text-[#F0444A]"
                                : "bg-[#1C1C1C] text-[#A3A3A3]"
                            }`}
                          >
                            {group.isRequired ? "Required" : "Optional"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {group.options.map((option) => {
                            const isSelected = selectedInGroup.some((o) => o.id === option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                disabled={!option.isAvailable}
                                onClick={() =>
                                  handleSelectOption(group.id, option, group.maxSelect)
                                }
                                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-xs sm:text-sm transition-all ${
                                  !option.isAvailable
                                    ? "cursor-not-allowed border-[#333333] bg-[#1C1C1C]/40 text-[#737373]"
                                    : isSelected
                                    ? "border-[#D71920] bg-[#D71920]/15 text-white font-semibold"
                                    : "border-[#333333] bg-[#1C1C1C] text-[#F5F1EA] hover:border-[#555555]"
                                }`}
                              >
                                <span>{option.name}</span>
                                <span className="tabular-nums text-xs font-mono text-[#A3A3A3]">
                                  {option.priceDeltaPesewas > 0
                                    ? `+${formatPesewasToGhs(option.priceDeltaPesewas)}`
                                    : "Included"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label
                  htmlFor="sika-dish-modal-notes"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A3A3A3]"
                >
                  Kitchen Notes (Optional)
                </label>
                <textarea
                  id="sika-dish-modal-notes"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={250}
                  placeholder="e.g. Pack stew separately, mild spice..."
                  rows={2}
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] p-3 text-sm text-[#FFFFFF] placeholder-[#737373] focus:border-[#D71920] focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between gap-4 border-t border-[#333333] bg-[#101010] p-4 sm:p-5">
              <div className="flex items-center gap-2 rounded-xl border border-[#333333] bg-[#262626] p-1">
                <button
                  type="button"
                  disabled={!dish.isAvailable || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#A3A3A3] hover:bg-[#1C1C1C] hover:text-white disabled:opacity-40 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="tabular-nums min-w-[24px] text-center text-sm font-bold text-white font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={!dish.isAvailable || quantity >= 50}
                  onClick={() => setQuantity(Math.min(50, quantity + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#A3A3A3] hover:bg-[#1C1C1C] hover:text-white disabled:opacity-40 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                disabled={!dish.isAvailable}
                onClick={handleAddToCart}
                className={`flex flex-1 items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-bold transition-all active:scale-[0.98] ${
                  !dish.isAvailable
                    ? "cursor-not-allowed border border-[#333333] bg-[#262626] text-[#737373]"
                    : "bg-[#D71920] hover:bg-[#A91017] text-white shadow-[0_6px_20px_rgba(215,25,32,0.4)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <RestaurantClocheIcon className="h-4 w-4" />
                  <span>{dish.isAvailable ? "Add to Tray" : "Currently Unavailable"}</span>
                </span>
                <span className="tabular-nums font-mono">{formatPesewasToGhs(lineTotalPesewas)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
