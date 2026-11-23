"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Flame,
  Minus,
  Plus,
  Sparkles,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { MenuItem, MenuItemOption, SelectedOptionSnapshot } from "@/types/menu";
import { formatPesewasToGhs, calculateLineTotalPesewas } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";
import { DishCard } from "@/components/ui/DishCard";
import { DishDetailModal } from "@/components/menu/DishDetailModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";

interface DishDetailClientProps {
  slug: string;
  initialDish?: MenuItem | null;
  initialRelated?: MenuItem[];
}

function buildDefaultOptions(targetDish: MenuItem | null): {
  [groupId: string]: MenuItemOption[];
} {
  const defaults: { [groupId: string]: MenuItemOption[] } = {};
  targetDish?.optionGroups?.forEach((group) => {
    if (group.isRequired && group.options.length > 0) {
      const first = group.options.find((o) => o.isAvailable);
      if (first) defaults[group.id] = [first];
    }
  });
  return defaults;
}

/**
 * Interactive dish configuration view hydrated directly from server props when
 * available so crawlers and users receive zero loading flicker on initial load.
 */
export function DishDetailClient({
  slug,
  initialDish = null,
  initialRelated = [],
}: DishDetailClientProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { success } = useToast();
  const addAreaRef = useRef<HTMLDivElement | null>(null);

  const [dish, setDish] = useState<MenuItem | null>(initialDish);
  const [relatedDishes, setRelatedDishes] = useState<MenuItem[]>(initialRelated);
  const [modalDish, setModalDish] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(!initialDish);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<{
    [groupId: string]: MenuItemOption[];
  }>(() => buildDefaultOptions(initialDish));
  const [instructions, setInstructions] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const loadDish = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setImgError(false);

    try {
      const response = await fetch(`/api/v1/menu/items?slug=${encodeURIComponent(slug)}`);
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.item) {
        throw new Error(payload.error || "Dish not found.");
      }

      const fetchedDish: MenuItem = {
        ...payload.item,
        categoryName: payload.item.category?.name,
      };
      setDish(fetchedDish);
      setQuantity(1);
      setInstructions("");
      setValidationError(null);
      setSelectedOptionsMap(buildDefaultOptions(fetchedDish));

      const relRes = await fetch(
        `/api/v1/menu/items?categoryId=${encodeURIComponent(fetchedDish.categoryId)}`
      );
      if (relRes.ok) {
        const relPayload = await relRes.json();
        if (relPayload.success && Array.isArray(relPayload.items)) {
          setRelatedDishes(
            relPayload.items
              .filter((item: MenuItem) => item.id !== fetchedDish.id)
              .slice(0, 4)
              .map((item: MenuItem & { category?: { name: string } }) => ({
                ...item,
                categoryName: item.category?.name,
              }))
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dish details.");
      setDish(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!initialDish) {
      void loadDish();
    }
  }, [initialDish, loadDish]);

  const handleSelectOption = (
    groupId: string,
    option: MenuItemOption,
    maxSelect: number
  ) => {
    if (!option.isAvailable) return;
    setValidationError(null);
    setSelectedOptionsMap((prev) => {
      const current = prev[groupId] || [];
      if (maxSelect === 1) return { ...prev, [groupId]: [option] };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-[4/3] rounded-3xl sika-skeleton border border-[#333333]" />
          <div className="lg:col-span-6 space-y-5">
            <div className="h-4 w-32 rounded sika-skeleton" />
            <div className="h-10 w-3/4 rounded-lg sika-skeleton" />
            <div className="h-20 w-full rounded-xl sika-skeleton" />
            <div className="h-36 w-full rounded-2xl sika-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="min-h-screen bg-[#101010] mx-auto max-w-3xl px-4 sm:px-6 py-20 space-y-6">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A3A3A3] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Menu
        </Link>
        <ErrorState
          title="Dish not found"
          message={error || "This dish could not be retrieved from the Sika Cuisine menu."}
          onRetry={() => void loadDish()}
        />
      </div>
    );
  }

  const selectedOptionsList: SelectedOptionSnapshot[] = [];
  let optionsDeltaPesewas = 0;
  dish.optionGroups?.forEach((group) => {
    const selected = selectedOptionsMap[group.id] || [];
    selected.forEach((opt) => {
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

  const lineTotalPesewas = calculateLineTotalPesewas(
    dish.basePricePesewas,
    quantity,
    optionsDeltaPesewas
  );

  const handleAddToTray = () => {
    if (!dish.isAvailable) return;
    const missingRequired = dish.optionGroups?.find((group) => {
      const minRequired = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
      return (selectedOptionsMap[group.id]?.length ?? 0) < minRequired;
    });
    if (missingRequired) {
      setValidationError(`Please choose an option for "${missingRequired.name}".`);
      return;
    }

    addItem(dish, selectedOptionsList, quantity, instructions.trim() || undefined, addAreaRef.current);
    success(`Added ${quantity}x ${dish.name}`, "Freshly added to your Sika order tray", {
      label: "View Tray",
      onClick: () => setIsCartOpen(true),
    });
  };

  return (
    <div className="min-h-screen bg-[#101010] pb-24 text-[#F5F1EA]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[#A3A3A3]">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#737373]" aria-hidden="true" />
          <Link href="/menu" className="hover:text-white transition-colors">
            Menu
          </Link>
          {dish.categoryName && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-[#737373]" aria-hidden="true" />
              <Link
                href={`/menu?category=${encodeURIComponent(dish.categoryId)}`}
                className="hover:text-white transition-colors"
              >
                {dish.categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-[#737373]" aria-hidden="true" />
          <span className="font-semibold text-[#F5F1EA]">{dish.name}</span>
        </nav>

        {/* Main 2-column Layout */}
        <PageReveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Photography Column */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#333333] bg-[#1C1C1C] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgError ? "/images/dishes/hero-signature-plate.jpg" : dish.imageUrl}
                alt={dish.name}
                onError={() => setImgError(true)}
                className={`h-full w-full object-cover ${!dish.isAvailable ? "grayscale-[70%]" : ""}`}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {!dish.isAvailable ? (
                  <span className="rounded-full border border-[#FB7185]/45 bg-[#101010]/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FDA4AF]">
                    Currently Unavailable
                  </span>
                ) : dish.isFeatured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D71920] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Chef Signature
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Details & Configuration Column */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F0444A]">
                {dish.categoryName || "Sika Kitchen"}
              </span>
              <h1 className="mt-1.5 font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
                {dish.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="tabular-nums font-serif text-2xl font-black text-[#F0444A]">
                  {formatPesewasToGhs(dish.basePricePesewas)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#333333] bg-[#1C1C1C] px-3 py-1 text-xs font-semibold text-[#F5F1EA]">
                  <Clock className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  {dish.preparationTimeMinutes ?? 20} mins prep
                </span>
                {dish.spiceLevel && dish.spiceLevel > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#333333] bg-[#1C1C1C] px-3 py-1 text-xs font-semibold text-[#F0444A]">
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    Spice {dish.spiceLevel}/3
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#A3A3A3]">
                {dish.description}
              </p>
            </div>

            {validationError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-4 py-3 text-xs font-medium text-[#FDA4AF]"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{validationError}</span>
              </div>
            )}

            {dish.optionGroups && dish.optionGroups.length > 0 && (
              <div className="space-y-4">
                {dish.optionGroups.map((group) => {
                  const selected = selectedOptionsMap[group.id] || [];
                  return (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-sm font-bold text-white">{group.name}</h2>
                          {group.description && (
                            <p className="text-xs text-[#A3A3A3]">{group.description}</p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            group.isRequired
                              ? "bg-[#D71920]/15 text-[#F0444A]"
                              : "bg-[#262626] text-[#A3A3A3]"
                          }`}
                        >
                          {group.isRequired ? "Required" : "Optional"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {group.options.map((opt) => {
                          const isSelected = selected.some((o) => o.id === opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={!opt.isAvailable}
                              onClick={() => handleSelectOption(group.id, opt, group.maxSelect)}
                              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm transition-all ${
                                !opt.isAvailable
                                  ? "cursor-not-allowed border-[#333333] bg-[#262626]/40 text-[#737373]"
                                  : isSelected
                                  ? "border-[#D71920] bg-[#D71920]/15 text-white font-semibold"
                                  : "border-[#333333] bg-[#262626] text-[#F5F1EA] hover:border-[#4D4D4D]"
                              }`}
                            >
                              <span>{opt.name}</span>
                              <span className="tabular-nums font-mono text-xs text-[#A3A3A3]">
                                {opt.priceDeltaPesewas > 0
                                  ? `+${formatPesewasToGhs(opt.priceDeltaPesewas)}`
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
                htmlFor="product-detail-notes"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#A3A3A3]"
              >
                Kitchen Instructions (Optional)
              </label>
              <textarea
                id="product-detail-notes"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={250}
                rows={2}
                placeholder="e.g. Pack pepper separately, mild spice..."
                className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] p-3 text-sm text-white placeholder-[#737373] focus:border-[#D71920] focus:outline-none"
              />
            </div>

            <div
              ref={addAreaRef}
              className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 border-t border-[#333333] pt-5"
            >
              <div className="flex items-center gap-2 rounded-xl border border-[#333333] bg-[#1C1C1C] p-1">
                <button
                  type="button"
                  disabled={!dish.isAvailable || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#A3A3A3] hover:bg-[#262626] hover:text-white disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="tabular-nums min-w-[28px] text-center font-mono text-base font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={!dish.isAvailable || quantity >= 50}
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#A3A3A3] hover:bg-[#262626] hover:text-white disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                disabled={!dish.isAvailable}
                onClick={handleAddToTray}
                className={`flex flex-1 items-center justify-between rounded-2xl px-6 py-4 text-sm sm:text-base font-bold transition-all active:scale-[0.98] ${
                  !dish.isAvailable
                    ? "cursor-not-allowed border border-[#333333] bg-[#1C1C1C] text-[#737373]"
                    : "bg-[#D71920] hover:bg-[#A91017] text-white shadow-[0_8px_24px_rgba(215,25,32,0.4)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <RestaurantClocheIcon className="h-4 w-4" />
                  <span>{dish.isAvailable ? "Add to Tray" : "Currently Unavailable"}</span>
                </span>
                <span className="tabular-nums font-mono">{formatPesewasToGhs(lineTotalPesewas)}</span>
              </button>
            </div>
          </div>
        </PageReveal>

        {/* Related Dishes */}
        {relatedDishes.length > 0 && (
          <section className="mt-16 border-t border-[#333333] pt-12">
            <h2 className="font-serif text-2xl font-bold text-white mb-6">
              More from {dish.categoryName || "Sika Kitchen"}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedDishes.map((rel) => (
                <DishCard
                  key={rel.id}
                  dish={rel}
                  onSelectDish={setModalDish}
                  onQuickAdd={(d, e) => {
                    e.stopPropagation();
                    if (!d.isAvailable) return;
                    if (d.optionGroups?.some((g) => g.isRequired)) {
                      setModalDish(d);
                    } else {
                      addItem(d, [], 1);
                      success(`Added ${d.name}`, "Added to your Sika order tray", {
                        label: "View Tray",
                        onClick: () => setIsCartOpen(true),
                      });
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <DishDetailModal
        dish={modalDish}
        isOpen={!!modalDish}
        onClose={() => setModalDish(null)}
      />
    </div>
  );
}
