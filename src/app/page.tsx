"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Star, ShoppingBag, MapPin, Sparkles, Flame, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { MenuItem } from "@/types/menu";

// Featured placeholder showcase dishes strictly in integer pesewas
const FEATURED_DISHES: MenuItem[] = [
  {
    id: "dish-jollof",
    categoryId: "traditional-mains",
    categoryName: "Traditional Mains",
    name: "Sika Signature Jollof Special",
    slug: "sika-signature-jollof-special",
    description: "Slow-simmered rosemary tomato jollof served with sweet golden plantains and smoky black shito.",
    basePricePesewas: 6500, // GH₵65.00
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 1,
  },
  {
    id: "dish-waakye",
    categoryId: "traditional-mains",
    categoryName: "Traditional Mains",
    name: "Waakye Royale Feast",
    slug: "waakye-royale-feast",
    description: "Sorghum-infused rice & beans with gari foto, boiled egg, tender wele, and spicy talia.",
    basePricePesewas: 6000, // GH₵60.00
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 2,
  },
  {
    id: "dish-banku",
    categoryId: "traditional-mains",
    categoryName: "Traditional Mains",
    name: "Banku & Grilled Tilapia",
    slug: "banku-with-grilled-tilapia",
    description: "Steaming hot fermented corn dough with whole charcoal-grilled tilapia and fiery green pepper.",
    basePricePesewas: 7500, // GH₵75.00
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 30,
    sortOrder: 3,
  },
  {
    id: "dish-suya",
    categoryId: "street-grills",
    categoryName: "Street Grills",
    name: "Charcoal Suya Beef Skewers",
    slug: "suya-beef-skewers",
    description: "Tender beef skewers marinated in northern Yaji peanut spice, flash-grilled over glowing coals.",
    basePricePesewas: 4500, // GH₵45.00
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 20,
    sortOrder: 4,
  },
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
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[550px] ambient-glow pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-100/90 border border-border-subtle px-4 py-1.5 text-xs font-semibold text-gray-300">
              <span className="flex h-2 w-2 rounded-full bg-brand-red animate-pulse" />
              <span>Now Delivering Fast Across Sunyani, Bono Region</span>
            </div>

            {/* Cinematic Serif Headline (Inspired by reference) */}
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              It&apos;s not just <span className="text-white">Food</span>,{" "}
              <br className="hidden sm:inline" />
              It&apos;s an <span className="text-brand-red italic">Experience.</span>
            </h1>

            {/* Subtext */}
            <p className="max-w-xl text-base sm:text-lg text-gray-300 leading-relaxed font-light">
              Indulge in Sunyani’s most celebrated culinary traditions. From rich woodsmoke-infused
              Jollof to charcoal-grilled tilapia and fiery spiced kelewele, delivered fresh to your doorstep.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/menu"
                className="btn-red-gradient inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-white tracking-wide shadow-glow"
              >
                <span>View Full Menu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-base font-medium text-white bg-surface-100/80 hover:bg-surface-50 border border-white/10 transition-all duration-200"
              >
                <ShoppingBag className="h-5 w-5 text-brand-red" />
                <span>My Plate</span>
              </button>
            </div>

            {/* Social Proof / Reviews Stack */}
            <div className="pt-4 flex items-center gap-4">
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
                  +45
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

          {/* Right Column: Hero Culinary Showcase Platter */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Ambient circular backdrop */}
            <div className="absolute h-80 w-80 sm:h-96 sm:w-96 rounded-full bg-gradient-to-tr from-brand-red/20 via-surface-100 to-transparent blur-2xl pointer-events-none" />

            {/* Overlapping Hero Plate Presentation */}
            <div className="relative group">
              <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full overflow-hidden border-4 border-surface-100/80 shadow-plate relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80"
                  alt="Sika Cuisine Signature Dish"
                  className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Floating garnish badge */}
              <div className="absolute -bottom-4 -left-4 glass-panel rounded-2xl p-4 shadow-card flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/15 text-brand-red">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Daily Fresh Catch</p>
                  <p className="text-sm font-bold text-white">Charcoal Grilled Tilapia</p>
                </div>
              </div>

              {/* Delivery time pill */}
              <div className="absolute -top-3 -right-3 glass-panel rounded-full px-4 py-2 shadow-card flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-gold" />
                <span className="text-xs font-semibold text-white">25-45 Min Sunyani Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes Showcase Section (Inspired by screenshot bottom cards) */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-red text-xs font-bold uppercase tracking-widest mb-2">
              <Sparkles className="h-4 w-4" /> Chef&apos;s Recommendations
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Most Loved In Sunyani
            </h2>
          </div>
          <Link
            href="/menu"
            className="text-sm font-semibold text-gray-300 hover:text-brand-red transition-colors inline-flex items-center gap-1.5"
          >
            <span>Explore All Delicacies</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Featured Dish Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURED_DISHES.map((dish) => (
            <div
              key={dish.id}
              ref={(el) => {
                cardRefs.current[dish.id] = el;
              }}
              className="group relative rounded-3xl bg-surface-200/90 border border-border-subtle p-5 pt-16 transition-all duration-300 hover:-translate-y-2 hover:border-brand-red/40 hover:shadow-card flex flex-col justify-between"
            >
              {/* Protruding Plate Image overlapping out of card top */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full overflow-hidden border-2 border-surface-50 shadow-plate group-hover:scale-105 transition-transform duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Dish Metadata */}
              <div className="mt-4 text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {dish.categoryName}
                </span>
                <h3 className="font-serif text-lg font-bold text-white mt-1 group-hover:text-brand-red transition-colors line-clamp-1">
                  {dish.name}
                </h3>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                  {dish.description}
                </p>
              </div>

              {/* Price & Add to Cart Action */}
              <div className="mt-6 pt-4 border-t border-border-subtle/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block -mb-0.5">Price</span>
                  <span className="text-base font-bold text-brand-red">
                    {formatPesewasToGhs(dish.basePricePesewas)}
                  </span>
                </div>

                {/* Circular Red Cart Button (matching screenshot design) */}
                <button
                  onClick={(e) => handleQuickAdd(dish, e)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white shadow-glow hover:bg-brand-red-hover hover:scale-110 active:scale-95 transition-all duration-200"
                  aria-label={`Add ${dish.name} to cart`}
                >
                  <ShoppingBag className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sunyani Delivery Localities Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-border-subtle/60">
        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="flex items-center gap-2 text-brand-red text-xs font-bold uppercase tracking-widest mb-3">
              <MapPin className="h-4 w-4" /> Fast & Reliable Dispatch
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Delivering Across Sunyani Every Day
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
