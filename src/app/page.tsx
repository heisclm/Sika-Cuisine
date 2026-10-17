"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Star, ShoppingBag, MapPin, Flame, Clock, Compass } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { MenuItem } from "@/types/menu";
import { TiltCard } from "@/components/creative/TiltCard";
import { MagneticButton } from "@/components/creative/MagneticButton";
import { AmbientEmbers } from "@/components/creative/AmbientEmbers";
import { BespokeSeal } from "@/components/creative/BespokeSeal";

const FEATURED_DISHES: MenuItem[] = [
  {
    id: "special-combo-mixture",
    categoryId: "sika-specials",
    categoryName: "Sika Specials (GH₵80)",
    name: "SIKA Special Combo (De Mixture)",
    slug: "special-combo-mixture",
    description: "Chef's ultimate showcase platter featuring seasoned meats, sweet plantains, sausages, and savory sides.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 30,
    sortOrder: 1,
  },
  {
    id: "seafood-tilapia-banku",
    categoryId: "seafood",
    categoryName: "Seafood (GH₵80)",
    name: "Tilapia with Banku (Chilli)",
    slug: "seafood-tilapia-banku",
    description: "Whole succulent charcoal-grilled tilapia paired with steaming hot fermented corn dumplings and freshly ground chilli pepper.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 30,
    sortOrder: 2,
  },
  {
    id: "pkg-grilled-chicken-jollof-rice",
    categoryId: "packages",
    categoryName: "Packages (GH₵40)",
    name: "Grilled Chicken with Jollof Rice",
    slug: "pkg-grilled-chicken-jollof-rice",
    description: "Charcoal-grilled spiced quarter chicken served alongside slow-simmered smoky Ghanaian jollof rice.",
    basePricePesewas: 4000,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 3,
  },
  {
    id: "fruit-pineapple-fried-rice",
    categoryId: "sika-fruit-rice",
    categoryName: "Fruit Rice (GH₵90)",
    name: "Pineapple Fried Rice",
    slug: "fruit-pineapple-fried-rice",
    description: "Wok-tossed fragrant jasmine rice infused with sweet caramelized Sunyani pineapples and crisp garden vegetables.",
    basePricePesewas: 9000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 4,
  },
];

const MENU_HIGHLIGHT_CATEGORIES = [
  { name: "Packages", price: "GH₵40", desc: "Grilled or fried chicken with aromatic Ghanaian rice" },
  { name: "Locals & Swallows", price: "GH₵50 - 70", desc: "Banku, Fufu, Tuo Zaafi (TZ), Omutuo & Red Red" },
  { name: "Fresh Seafood", price: "GH₵80", desc: "Grilled Tilapia, Red Fish with Banku & Garlic Shrimps" },
  { name: "Sika Specials", price: "GH₵80", desc: "Special Combo (De Mixture), Fries with Wings & Noodles" },
  { name: "Fruit Rice", price: "GH₵90", desc: "Wok-infused Sunyani Pineapple & Coconut rice specialties" },
  { name: "Artisan Pizza", price: "GH₵110 - 180", desc: "Stone-baked crispy pizzas in Mini, Medium & Family sizes" },
];

export default function HomePage() {
  const { addItem, setIsCartOpen } = useCart();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleQuickAdd = (dish: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = cardRefs.current[dish.id];
    addItem(dish, [], 1, undefined, element);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden text-gray-200">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[550px] ambient-glow pointer-events-none -z-10" />

      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20 overflow-hidden">
        <AmbientEmbers count={24} className="opacity-40" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-surface-100/90 border border-border-subtle px-4 py-1.5 text-xs font-semibold text-gray-300">
              <span className="flex h-2 w-2 rounded-full bg-brand-red animate-pulse" />
              <span>Direct Kitchen Dispatch &bull; Sunyani, Bono Region</span>
              <span className="text-gray-500 font-mono text-[10px]">07°20&apos;N, 02°20&apos;W</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.06]">
              It&apos;s not just <span className="text-white">Food</span>,{" "}
              <br className="hidden sm:inline" />
              It&apos;s an <span className="text-brand-red italic font-normal">Experience.</span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-gray-300 leading-relaxed font-light">
              Sunyani&apos;s premier destination for authentic, slow-simmered Ghanaian gastronomy and vibrant lounge dining. Savor charcoal-grilled tilapia with banku, slow-simmered jollof with grilled chicken, pounded fufu with light soup, and stone-baked pizzas delivered piping hot across Sunyani.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <MagneticButton strength={0.3}>
                <Link
                  href="/menu"
                  className="btn-red-gradient inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-white tracking-wide shadow-glow"
                >
                  <span>View Full Menu</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </MagneticButton>

              <MagneticButton strength={0.2}>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-base font-medium text-white bg-surface-100/80 hover:bg-surface-50 border border-white/10 transition-all duration-200"
                >
                  <Clock className="h-4 w-4 text-brand-red" />
                  <span>Track Active Order</span>
                </Link>
              </MagneticButton>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-background object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Customer"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-background object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt="Customer"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-background object-cover"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
                  alt="Customer"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-50 border border-border-subtle text-xs font-bold text-white">
                  +500
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-medium mt-0.5">
                  Over 500+ Satisfied Orders in Sunyani
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="absolute h-80 w-80 sm:h-96 sm:w-96 rounded-full bg-gradient-to-tr from-brand-red/20 via-surface-100 to-transparent blur-2xl pointer-events-none" />

            <TiltCard maxAngle={12} scale={1.03} glare={true} className="rounded-full">
              <div className="relative group animate-plate-float">
                <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full overflow-hidden border-4 border-surface-100/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80"
                    alt="Sika Cuisine Signature Dish"
                    className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                <div className="absolute -bottom-4 -left-4 glass-panel rounded-2xl p-4 shadow-card flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/15 text-brand-red">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Chef&apos;s Signature</p>
                    <p className="text-sm font-bold text-white">SIKA Special Combo (De Mixture)</p>
                  </div>
                </div>

                <div className="absolute -top-3 -right-3 glass-panel rounded-full px-4 py-2 shadow-card flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-gold" />
                  <span className="text-xs font-semibold text-white">25-40 Min Sunyani Delivery</span>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red mb-2">
              Chef&apos;s Signature Selection &bull; Sunyani Favourites
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Most Loved In Sunyani
            </h2>
          </div>
          <Link
            href="/menu"
            className="text-sm font-semibold text-gray-300 hover:text-brand-red transition-colors inline-flex items-center gap-1.5"
          >
            <span>Explore All 36 Delicacies</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURED_DISHES.map((dish) => (
            <TiltCard
              key={dish.id}
              maxAngle={8}
              scale={1.02}
              glare={true}
              className="rounded-3xl"
            >
              <div
                ref={(el) => {
                  cardRefs.current[dish.id] = el;
                }}
                className="group relative h-full rounded-3xl bg-surface-200/90 border border-border-subtle p-5 pt-16 transition-all duration-300 hover:border-brand-red/40 hover:shadow-card flex flex-col justify-between"
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full overflow-hidden border-2 border-surface-50 shadow-plate group-hover:scale-105 transition-transform duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-4 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {dish.categoryName}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white mt-1 group-hover:text-brand-red transition-colors line-clamp-1">
                    {dish.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed font-light">
                    {dish.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border-subtle/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-400 block -mb-0.5">Authoritative Price</span>
                    <span className="text-base font-bold text-brand-red font-mono">
                      {formatPesewasToGhs(dish.basePricePesewas)}
                    </span>
                  </div>

                  <MagneticButton strength={0.25}>
                    <button
                      onClick={(e) => handleQuickAdd(dish, e)}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white shadow-glow hover:bg-brand-red-hover hover:scale-105 active:scale-95 transition-all duration-200"
                      aria-label={`Add ${dish.name} to cart`}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </button>
                  </MagneticButton>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-border-subtle/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red mb-2">
            The Complete Sika Cuisine Experience
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Explore By Culinary Category
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 font-light">
            Every dish prepared to order according to authentic Bono culinary tradition.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MENU_HIGHLIGHT_CATEGORIES.map((cat, idx) => (
            <TiltCard key={idx} maxAngle={6} scale={1.01} glare={false} className="rounded-3xl">
              <Link
                href="/menu"
                className="block h-full rounded-3xl bg-surface-300/80 border border-border-subtle p-6 hover:border-brand-red/40 transition-all group shadow-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-serif text-lg font-bold text-white group-hover:text-brand-red transition-colors">
                    {cat.name}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold font-mono">
                    {cat.price}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                  {cat.desc}
                </p>
                <div className="flex items-center text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">
                  <span>View items</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 text-brand-red group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-border-subtle/60">
        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-12 relative overflow-hidden shadow-card">
          <div className="max-w-2xl relative z-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red mb-3">
              Fast & Reliable Sunyani Dispatch
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Delivering Hot & Fresh Across Sunyani
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
              From Sunyani Central to UENR Campus in Fiapre, Berlin Top, Abesim, New Dormaa, and Penkwase.
              Our dedicated delivery team ensures your food arrives piping hot with real-time status updates.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-medium text-gray-300">
              <div className="rounded-xl bg-surface-100 p-2.5 border border-border-subtle flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                Sunyani Central
              </div>
              <div className="rounded-xl bg-surface-100 p-2.5 border border-border-subtle flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                Fiapre & UENR
              </div>
              <div className="rounded-xl bg-surface-100 p-2.5 border border-border-subtle flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                Berlin Top
              </div>
              <div className="rounded-xl bg-surface-100 p-2.5 border border-border-subtle flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                Abesim
              </div>
              <div className="rounded-xl bg-surface-100 p-2.5 border border-border-subtle flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                Penkwase
              </div>
              <div className="rounded-xl bg-surface-100 p-2.5 border border-border-subtle flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                New Dormaa
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
