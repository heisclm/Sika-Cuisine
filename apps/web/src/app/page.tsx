"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { formatTimeOfDayGreeting } from "@sika/shared";
import { useCart } from "@/context/CartContext";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useToast } from "@/context/ToastContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { fetchAndCacheWebMenu, readCachedWebMenu } from "@/lib/menu-cache";
import { RESTAURANT_INFO } from "@/lib/navigation";
import { MenuItem } from "@/types/menu";
import { KineticMarquee } from "@/components/creative/KineticMarquee";
import { DishDetailModal } from "@/components/menu/DishDetailModal";
import { DishCard } from "@/components/ui/DishCard";
import { DishCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageReveal } from "@/components/ui/MotionPrimitives";

interface ActiveOrderSummary {
  orderNumber: string;
  fulfilmentStatus: string;
}

const TERMINAL_ORDER_STATUSES = new Set([
  "DELIVERED",
  "COLLECTED",
  "CANCELLED",
  "REJECTED",
]);

function formatActiveStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pending Confirmation";
    case "CONFIRMED":
      return "Order Confirmed";
    case "PREPARING":
      return "Being Prepared";
    case "READY_FOR_DISPATCH":
      return "Ready for Rider";
    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";
    case "READY_FOR_PICKUP":
      return "Ready for Pickup";
    default:
      return status.replace(/_/g, " ");
  }
}

/**
 * Sika Cuisine Editorial Web Storefront Homepage.
 * Queries live menu catalog data, showcases authentic Ghanaian photography,
 * and surfaces Sunyani delivery zones alongside free restaurant pickup.
 */
export default function HomePage() {
  const { addItem, setIsCartOpen } = useCart();
  const { deliveryZones, restaurant } = usePublicConfig();
  const { success } = useToast();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [activeDishForModal, setActiveDishForModal] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSummary | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const featuredDishes = useMemo(
    () => menuItems.filter((item) => item.isFeatured),
    [menuItems]
  );

  const loadCatalog = useCallback(async (force = false) => {
    const cached = readCachedWebMenu();
    if (cached && cached.items.length > 0) {
      setMenuItems(cached.items);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setLoadError(null);
    try {
      const items = await fetchAndCacheWebMenu(force);
      setMenuItems(items);
    } catch (error) {
      if (!cached || cached.items.length === 0) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to connect to Sika Cuisine menu right now."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!active || !payload?.success || !payload.user?.fullName) return;
        setCustomerName(payload.user.fullName);
      })
      .catch(() => {});

    fetch("/api/v1/orders/my-orders", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!active || !payload?.success || !Array.isArray(payload.orders)) return;
        const live = payload.orders.find(
          (o: { orderNumber?: string; fulfilmentStatus?: string }) =>
            o?.orderNumber &&
            o?.fulfilmentStatus &&
            !TERMINAL_ORDER_STATUSES.has(o.fulfilmentStatus)
        );
        if (live) {
          setActiveOrder({
            orderNumber: live.orderNumber,
            fulfilmentStatus: live.fulfilmentStatus,
          });
        }
      })
      .catch(() => {
        // Guests or unauthenticated sessions simply skip live order banner
      });

    return () => {
      active = false;
    };
  }, []);

  const updateCarouselEdges = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateCarouselEdges();
    window.addEventListener("resize", updateCarouselEdges);
    return () => window.removeEventListener("resize", updateCarouselEdges);
  }, [featuredDishes, updateCarouselEdges]);

  const menuCategories = useMemo(
    () =>
      Array.from(
        new Map(
          menuItems.map((dish) => [
            dish.categoryId,
            {
              id: dish.categoryId,
              name: dish.categoryName ?? "Menu",
              count: menuItems.filter((item) => item.categoryId === dish.categoryId).length,
              coverImage: dish.imageUrl,
            },
          ])
        ).values()
      ),
    [menuItems]
  );

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -340 : 340,
      behavior: "smooth",
    });
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
    success(`Added ${dish.name}`, "Added to your Sika order tray", {
      label: "View Tray",
      onClick: () => setIsCartOpen(true),
    });
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#101010] text-[#F5F1EA]">
      {/* Editorial Hero Composition */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 sm:pb-24">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[520px] w-full max-w-6xl studio-vignette -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Copy Column */}
          <PageReveal className="lg:col-span-6 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className={`inline-flex items-center gap-2 rounded-full border bg-[#1C1C1C] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] sika-surface-rim ${
                  restaurant.isAcceptingOrders
                    ? "border-[#22C55E]/35 text-[#4ADE80]"
                    : "border-[#FB7185]/35 text-[#FDA4AF]"
                }`}
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  {restaurant.isAcceptingOrders && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      restaurant.isAcceptingOrders ? "bg-[#4ADE80]" : "bg-[#FB7185]"
                    }`}
                  />
                </span>
                <span>
                  {restaurant.isAcceptingOrders ? "Kitchen Open" : "Ordering Paused"}
                </span>
                <span className="text-[#525252]" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 text-[#F0444A]">
                  <MapPin className="h-3 w-3 text-[#D71920]" aria-hidden="true" />
                  <span>Sunyani Central</span>
                </span>
              </div>

              {customerName && (
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/45 px-3.5 py-1.5 text-[11px] font-bold text-[#F5F1EA] transition-colors sika-surface-rim max-w-[260px]"
                >
                  <Sparkles className="h-3 w-3 text-[#F0444A] shrink-0" aria-hidden="true" />
                  <span className="truncate">{formatTimeOfDayGreeting(customerName)}</span>
                </Link>
              )}

              {activeOrder && (
                <Link
                  href={`/orders/${activeOrder.orderNumber}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D71920]/45 bg-[#D71920]/15 px-3.5 py-1.5 text-[11px] font-bold text-[#F5F1EA] hover:bg-[#D71920]/25 transition-colors"
                >
                  <span
                    className="h-2 w-2 rounded-full bg-[#F0444A] animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="font-mono">{activeOrder.orderNumber}</span>
                  <span className="text-[#737373]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#F0444A]">
                    {formatActiveStatusLabel(activeOrder.fulfilmentStatus)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-[#F0444A]" aria-hidden="true" />
                </Link>
              )}
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Ghanaian Classics,{" "}
              <span className="italic font-normal text-[#F0444A]">Cooked Fresh</span>{" "}
              to Order.
            </h1>

            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[#A3A3A3]">
              From charcoal-grilled whole tilapia with steaming banku and slow-simmered smoky jollof to traditional soups and stone-baked pizzas — prepared fresh in our Commercial Road kitchen for pickup or delivery across Sunyani.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D71920] hover:bg-[#A91017] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(215,25,32,0.4)] active:scale-[0.98] transition-all"
              >
                <span>Order Now</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#333333] bg-[#1C1C1C] hover:border-[#4A4A4A] hover:bg-[#262626] px-6 py-3.5 text-sm font-semibold text-[#F5F1EA] active:scale-[0.98] transition-all"
              >
                <span>Track an Order</span>
              </Link>
            </div>

            {/* Verified Operational Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#333333]">
              <div className="rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 sika-surface-rim">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Kitchen Hours
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-[#F5F1EA]">
                  {restaurant.weekdayHours || "10am – 10pm (Mon–Sat)"}
                </span>
              </div>
              <div className="rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 sika-surface-rim">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Pickup Fee
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-[#4ADE80] tabular-nums">
                  GH₵ 0.00 (Free)
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-[#333333] bg-[#1C1C1C] px-3.5 py-2.5 sika-surface-rim">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Direct Line
                </span>
                <a
                  href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
                  className="mt-0.5 block font-mono text-xs font-semibold text-[#F5F1EA] hover:text-[#F0444A]"
                >
                  {restaurant.phone || RESTAURANT_INFO.primaryPhone}
                </a>
              </div>
            </div>
          </PageReveal>

          {/* Right Photographic Showcase */}
          <PageReveal delay={0.08} className="lg:col-span-6 relative">
            <div
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] hero-ambient-glow blur-2xl opacity-90"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] border border-[#333333] bg-[#1C1C1C] shadow-[0_28px_64px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/dishes/hero-signature-plate.jpg"
                  alt="Sika Cuisine signature platter prepared fresh in Sunyani"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/20 to-transparent" />
              </div>

              {/* Editorial Photo Caption Card */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-t border-[#333333] bg-[#1C1C1C]/95 p-4 backdrop-blur-md sm:absolute sm:bottom-6 sm:left-6 sm:right-6 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-[#1C1C1C]/90">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F0444A]">
                    Kitchen Showcase
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Charcoal Grills, Jollof &amp; Local Soups
                  </h2>
                  <p className="mt-0.5 text-xs text-[#A3A3A3] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                    <span>Freshly prepared upon confirmation</span>
                  </p>
                </div>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-[#D71920] hover:bg-[#A91017] px-4 py-2 text-xs font-bold text-white transition-colors whitespace-nowrap"
                >
                  <span>Browse Menu</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </PageReveal>
        </div>
      </section>

      {/* Featured Dishes Horizontal Carousel */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-[#333333]">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F0444A]">
              Signature Selection
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-4xl font-bold text-white">
              Featured from the Kitchen
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#333333] bg-[#1C1C1C] text-[#F5F1EA] hover:border-[#D71920]/60 hover:bg-[#262626] transition-colors"
              aria-label="Scroll featured dishes left"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D71920] hover:bg-[#A91017] text-white transition-colors shadow-[0_4px_14px_rgba(215,25,32,0.35)]"
              aria-label="Scroll featured dishes right"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <DishCardSkeleton key={i} />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            title="Could not load featured dishes"
            message={loadError}
            onRetry={() => void loadCatalog(true)}
          />
        ) : featuredDishes.length === 0 ? (
          <EmptyState
            title="Featured dishes unavailable"
            description="Explore the full Sika Cuisine menu to see all available dishes today."
            action={
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D71920] px-5 py-2.5 text-sm font-bold text-white"
              >
                View Full Menu
              </Link>
            }
          />
        ) : (
          <div className="relative">
            {canScrollLeft && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 sm:w-12 bg-gradient-to-r from-[#101010] to-transparent"
              />
            )}
            {canScrollRight && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 sm:w-12 bg-gradient-to-l from-[#101010] to-transparent"
              />
            )}
            <div
              ref={carouselRef}
              onScroll={updateCarouselEdges}
              className="flex items-stretch gap-3.5 sm:gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-2 touch-pan-x"
            >
              {featuredDishes.map((dish, index) => (
                <div key={dish.id} className="w-[225px] sm:w-[300px] flex-shrink-0">
                  <DishCard
                    dish={dish}
                    priority={index < 4}
                    cardRef={(el) => {
                      cardRefs.current[dish.id] = el;
                    }}
                    onSelectDish={setActiveDishForModal}
                    onQuickAdd={handleQuickAdd}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Kinetic Ticker */}
      <KineticMarquee />

      {/* Menu Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="flex items-end justify-between gap-3 mb-6 sm:mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F0444A]">
              Menu Categories
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-4xl font-bold text-white">
              Browse by Section
            </h2>
          </div>
          <Link
            href="/menu"
            className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#F0444A] hover:text-white transition-colors"
          >
            <span>See all dishes</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="flex overflow-x-auto scrollbar-none scroll-smooth touch-pan-x snap-x snap-mandatory gap-3 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible sm:pb-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 w-[170px] flex-shrink-0 snap-start sm:h-28 sm:w-auto rounded-2xl border border-[#333333] sika-skeleton"
              />
            ))}
          </div>
        ) : menuCategories.length > 0 ? (
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none sm:hidden absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#101010] to-transparent"
            />
            <div className="flex overflow-x-auto scrollbar-none scroll-smooth touch-pan-x snap-x snap-mandatory gap-3 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible sm:pb-0">
              {menuCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/menu?category=${encodeURIComponent(cat.id)}`}
                  className="group flex w-[170px] flex-shrink-0 snap-start sm:w-auto flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 rounded-2xl border border-[#333333] bg-[#1C1C1C] sika-surface-rim p-2.5 sm:p-4 hover:border-[#D71920]/60 hover:bg-[#262626] transition-all"
                >
                <div className="aspect-[16/10] w-full sm:aspect-auto sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl border border-[#333333] bg-[#262626] transform-gpu">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.coverImage}
                    alt={cat.name}
                    className="block h-full w-full object-cover transform-gpu will-change-transform group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-sm sm:text-lg font-bold text-white group-hover:text-[#F0444A] transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-[#A3A3A3]">
                    {cat.count} {cat.count === 1 ? "dish" : "dishes"}
                  </p>
                  <span className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#F0444A]">
                    Explore <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Delivery & Pickup Overview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Delivery Zones Card */}
          <div className="lg:col-span-7 rounded-3xl border border-[#333333] bg-[#1C1C1C] sika-surface-rim p-5 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D71920]/15 text-[#F0444A] border border-[#D71920]/30">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Sunyani Delivery Zones
                </h2>
                <p className="text-xs text-[#A3A3A3]">
                  Doorstep dispatch priced transparently by Sunyani zone
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deliveryZones.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-2xl border border-[#333333] bg-[#262626] p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{zone.name}</span>
                    <span className="tabular-nums font-mono text-xs font-extrabold text-[#F0444A]">
                      {formatPesewasToGhs(zone.feePesewas)}
                    </span>
                  </div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">{zone.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pickup & Visit Card */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-[#333333] bg-[#1C1C1C] sika-surface-rim p-5 sm:p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30">
                  <Store className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                    Restaurant Pickup
                  </h2>
                  <p className="text-xs font-semibold text-[#4ADE80]">
                    Always GH₵ 0.00 delivery fee
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#333333] bg-[#262626]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/restaurant/lounge-interior.jpg"
                  alt="Sika Cuisine Sunyani dining and collection lounge"
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="space-y-2 text-xs text-[#A3A3A3]">
                <p className="flex items-center gap-2 text-[#F5F1EA] font-medium">
                  <MapPin className="h-4 w-4 text-[#F0444A] flex-shrink-0" aria-hidden="true" />
                  <span>{RESTAURANT_INFO.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#F0444A] flex-shrink-0" aria-hidden="true" />
                  <span>
                    {RESTAURANT_INFO.primaryPhone} / {RESTAURANT_INFO.secondaryPhone}
                  </span>
                </p>
              </div>
            </div>

            <Link
              href="/menu"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#333333] bg-[#262626] hover:border-[#D71920]/60 hover:bg-[#2F2F2F] py-3 text-sm font-bold text-white transition-colors"
            >
              <span>Order for Pickup</span>
              <ArrowRight className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <DishDetailModal
        dish={activeDishForModal}
        isOpen={!!activeDishForModal}
        onClose={() => setActiveDishForModal(null)}
        sourceElement={activeDishForModal ? cardRefs.current[activeDishForModal.id] : null}
      />
    </div>
  );
}
