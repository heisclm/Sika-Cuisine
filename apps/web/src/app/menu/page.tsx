"use client";

import React, { Suspense, useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ArrowUp, X, SlidersHorizontal, Flame } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { DishDetailModal } from "@/components/menu/DishDetailModal";
import { KineticMarquee } from "@/components/creative/KineticMarquee";
import { DishCard } from "@/components/ui/DishCard";
import { DishCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StaggerContainer, StaggerItem } from "@/components/ui/MotionPrimitives";

type SortMode = "featured" | "price-asc" | "price-desc" | "prep-asc";
const WEB_MENU_PAGE_SIZE = 12;

function MenuContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const { addItem, setIsCartOpen, totalCount } = useCart();
  const { success } = useToast();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [maxSpice, setMaxSpice] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);

  const [activeDishForModal, setActiveDishForModal] = useState<MenuItem | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleCount, setVisibleCount] = useState(WEB_MENU_PAGE_SIZE);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/v1/menu/items?includeUnavailable=true");
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load restaurant menu.");
      }
      setMenuItems(
        (payload.items ?? []).map((item: MenuItem & { category?: { name: string } }) => ({
          ...item,
          categoryName: item.category?.name,
        }))
      );
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not connect to Sika Cuisine menu."
      );
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 380);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categories = useMemo(
    () => [
      { id: "all", name: "All Dishes" },
      ...Array.from(
        new Map(
          menuItems.map((dish) => [
            dish.categoryId,
            { id: dish.categoryId, name: dish.categoryName ?? "Menu" },
          ])
        ).values()
      ),
    ],
    [menuItems]
  );

  const filteredDishes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = menuItems.filter((dish) => {
      const matchesCat = selectedCategory === "all" || dish.categoryId === selectedCategory;
      const matchesSearch =
        !q ||
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q) ||
        Boolean(dish.categoryName && dish.categoryName.toLowerCase().includes(q));
      const matchesAvail = !availableOnly || dish.isAvailable;
      const matchesSpice =
        maxSpice === null || (dish.spiceLevel ?? 0) <= maxSpice;
      return matchesCat && matchesSearch && matchesAvail && matchesSpice;
    });

    return [...list].sort((a, b) => {
      if (sortMode === "price-asc") return a.basePricePesewas - b.basePricePesewas;
      if (sortMode === "price-desc") return b.basePricePesewas - a.basePricePesewas;
      if (sortMode === "prep-asc") {
        return (a.preparationTimeMinutes ?? 20) - (b.preparationTimeMinutes ?? 20);
      }
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
  }, [menuItems, selectedCategory, searchQuery, availableOnly, maxSpice, sortMode]);

  useEffect(() => {
    setVisibleCount(WEB_MENU_PAGE_SIZE);
  }, [selectedCategory, searchQuery, availableOnly, maxSpice, sortMode]);

  const visibleDishes = useMemo(
    () => filteredDishes.slice(0, visibleCount),
    [filteredDishes, visibleCount]
  );
  const remainingCount = Math.max(0, filteredDishes.length - visibleDishes.length);
  const hasOddVisibleCount = visibleDishes.length > 1 && visibleDishes.length % 2 === 1;

  const resetFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSortMode("featured");
    setMaxSpice(null);
    setAvailableOnly(false);
  };

  const handleQuickAdd = (dish: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dish.isAvailable) return;
    if (dish.optionGroups && dish.optionGroups.some((g) => g.isRequired)) {
      setActiveDishForModal(dish);
      return;
    }
    const element = cardRefs.current[dish.id];
    addItem(dish, [], 1, undefined, element);
    success(`Added ${dish.name}`, "Freshly added to your Sika order tray", {
      label: "View Tray",
      onClick: () => setIsCartOpen(true),
    });
  };

  return (
    <div className="min-h-screen bg-[#101010] pb-24 text-[#F5F1EA]">
      {/* Editorial Header Banner */}
      <div className="relative border-b border-[#333333] bg-[#1C1C1C]/50 py-12 sm:py-16 overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[260px] w-full max-w-5xl studio-vignette -z-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            Sika Cuisine · Sunyani Kitchen
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-black tracking-tight text-white">
            Restaurant Menu
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#A3A3A3] leading-relaxed">
            Browse authentic Ghanaian dishes, grilled specialties, packages, and stone-baked pizzas prepared fresh to order.
          </p>
        </div>
      </div>

      <KineticMarquee />

      {/* Sticky Category + Search + Filter Toolbar */}
      <div className="sticky top-16 sm:top-20 z-30 border-b border-[#333333] bg-[#101010]/95 backdrop-blur-xl py-2.5 sm:py-3.5 shadow-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-2.5 sm:space-y-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-pan-x pb-0.5">
            {categories.map((cat) => {
              const count =
                cat.id === "all"
                  ? menuItems.length
                  : menuItems.filter((d) => d.categoryId === cat.id).length;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full border px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 sm:gap-2 ${
                    active
                      ? "border-[#D71920] bg-[#D71920] text-white shadow-[0_4px_14px_rgba(215,25,32,0.35)]"
                      : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:bg-[#262626] hover:text-white"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      active ? "bg-black/30 text-white" : "bg-[#262626] text-[#A3A3A3]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-2.5">
            <div className="flex items-center gap-2 w-full md:flex-1 md:max-w-lg">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search dishes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tilapia, jollof, banku, pizza..."
                  className="h-10 sm:h-9 w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-9 pr-8 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#D71920] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#A3A3A3] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAvailableOnly((prev) => !prev)}
                aria-pressed={availableOnly}
                className={`h-10 sm:h-9 flex-shrink-0 whitespace-nowrap rounded-xl border px-3 text-xs font-semibold transition-colors ${
                  availableOnly
                    ? "border-[#D71920] bg-[#D71920]/15 text-white"
                    : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                }`}
              >
                <span className="sm:hidden">In Stock</span>
                <span className="hidden sm:inline">In Stock Only</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto text-xs">
              <Select
                id="menu-sort-select"
                ariaLabel="Sort dishes"
                value={sortMode}
                onChange={(val) => setSortMode(val as SortMode)}
                variant="surface"
                size="sm"
                fullWidth
                className="sm:w-auto"
                leadingIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                options={[
                  { value: "featured", label: "Sort: Recommended" },
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                  { value: "prep-asc", label: "Fastest Prep" },
                ]}
              />

              <Select
                id="menu-spice-select"
                ariaLabel="Filter by spice level"
                value={maxSpice === null ? "all" : String(maxSpice)}
                onChange={(val) =>
                  setMaxSpice(val === "all" ? null : Number(val))
                }
                variant="surface"
                size="sm"
                fullWidth
                className="sm:w-auto"
                menuAlign="right"
                leadingIcon={<Flame className="h-3.5 w-3.5" />}
                options={[
                  { value: "all", label: "All Spice Levels" },
                  { value: "1", label: "Mild Only (0–1)" },
                  { value: "2", label: "Medium (0–2)" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <DishCardSkeleton key={i} />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            title="Could not load the menu"
            message={loadError}
            onRetry={() => void loadMenu()}
          />
        ) : filteredDishes.length === 0 ? (
          <EmptyState
            title="No matching dishes"
            description="Try clearing your search term, changing category, or relaxing spice/availability filters."
            action={
              <Button variant="primary" size="sm" onClick={resetFilters}>
                Reset all filters
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {visibleDishes.map((dish, idx) => (
                <StaggerItem
                  key={dish.id}
                  className={
                    hasOddVisibleCount && idx === 0
                      ? "col-span-2 lg:col-span-1"
                      : undefined
                  }
                >
                  <DishCard
                    dish={dish}
                    cardRef={(el) => {
                      cardRefs.current[dish.id] = el;
                    }}
                    onSelectDish={setActiveDishForModal}
                    onQuickAdd={handleQuickAdd}
                    className="h-full"
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {remainingCount > 0 && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <p className="font-mono text-xs text-[#A3A3A3]">
                  Showing {visibleDishes.length} of {filteredDishes.length} dishes
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() =>
                    setVisibleCount((prev) => prev + WEB_MENU_PAGE_SIZE)
                  }
                >
                  Load More Dishes ({remainingCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <DishDetailModal
        dish={activeDishForModal}
        isOpen={!!activeDishForModal}
        onClose={() => setActiveDishForModal(null)}
        sourceElement={activeDishForModal ? cardRefs.current[activeDishForModal.id] : null}
      />

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#333333] bg-[#D71920] text-white shadow-[0_6px_20px_rgba(215,25,32,0.45)] hover:bg-[#A91017] active:scale-95 transition-all ${
            totalCount > 0 ? "bottom-24 lg:bottom-6 lg:right-6" : "bottom-6 right-6"
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101010] mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <DishCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
