"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { MenuItem } from "@/types/menu";
import { TiltCard } from "@/components/creative/TiltCard";
import { MagneticButton } from "@/components/creative/MagneticButton";
import { FloatingGarnishes } from "@/components/creative/FloatingGarnishes";
import { KineticMarquee } from "@/components/creative/KineticMarquee";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";

const FEATURED_DISHES: MenuItem[] = [
  {
    id: "special-combo-mixture",
    categoryId: "sika-specials",
    categoryName: "Sika Specials",
    name: "SIKA Special Combo (De Mixture)",
    slug: "special-combo-mixture",
    description: "Chef's ultimate platter: seasoned meats, kelewele, wings, sausages & savory rice.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/special-combo.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 30,
    sortOrder: 1,
  },
  {
    id: "seafood-tilapia-banku",
    categoryId: "seafood",
    categoryName: "Seafood & Swallows",
    name: "Tilapia with Banku (Chilli)",
    slug: "seafood-tilapia-banku",
    description: "Whole succulent charcoal-grilled tilapia paired with steaming hot corn dumplings.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/tilapia-banku.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 30,
    sortOrder: 2,
  },
  {
    id: "pkg-grilled-chicken-jollof-rice",
    categoryId: "packages",
    categoryName: "Packages",
    name: "Grilled Chicken with Jollof Rice",
    slug: "pkg-grilled-chicken-jollof-rice",
    description: "Charcoal-grilled spiced quarter chicken alongside slow-simmered smoky Ghanaian jollof.",
    basePricePesewas: 4000,
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 3,
  },
  {
    id: "fruit-pineapple-fried-rice",
    categoryId: "sika-fruit-rice",
    categoryName: "Fruit Rice",
    name: "Pineapple Fried Rice",
    slug: "fruit-pineapple-fried-rice",
    description: "Wok-tossed fragrant jasmine rice infused with caramelized Sunyani pineapples.",
    basePricePesewas: 9000,
    imageUrl: "/images/dishes/pineapple-rice.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 4,
  },
  {
    id: "local-fufu-goat-soup",
    categoryId: "locals",
    categoryName: "Locals & Swallows",
    name: "Fufu with Goat Light Soup",
    slug: "fufu-goat-light-soup",
    description: "Soft pounded cassava & plantain dumplings immersed in deeply spiced goat meat broth.",
    basePricePesewas: 7000,
    imageUrl: "/images/dishes/fufu-goat-soup.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 5,
  },
  {
    id: "pizza-bbq-chicken",
    categoryId: "pizza",
    categoryName: "Artisan Pizza",
    name: "BBQ Chicken Stone-Baked Pizza",
    slug: "pizza-bbq-chicken",
    description: "Crispy crust layered with shredded smoky BBQ chicken, sweet peppers, and melted mozzarella.",
    basePricePesewas: 11000,
    imageUrl: "/images/dishes/artisan-pizza.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 6,
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
  const { success } = useToast();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleQuickAdd = (dish: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = cardRefs.current[dish.id];
    addItem(dish, [], 1, undefined, element);
    success(
      `Added ${dish.name} to plate`,
      "Prepared fresh to order in Sunyani",
      {
        label: "View Plate",
        onClick: () => setIsCartOpen(true),
      }
    );
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden text-gray-200">
      {/* Soft Studio Matte Overhead Vignette (No Shiny Red Glare) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] studio-vignette pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Typography & Actions */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-[5.5rem] font-normal tracking-tight text-white leading-[1.04]">
              it&apos;s not just <br />
              Food, It&apos;s an <br />
              Experience.
            </h1>

            <p className="max-w-xl text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed font-light">
              Sunyani&apos;s premier destination for authentic, slow-simmered Ghanaian gastronomy and vibrant lounge dining. Savor charcoal-grilled tilapia with banku, slow-simmered jollof with grilled chicken, pounded fufu with light soup, and stone-baked pizzas delivered piping hot across Sunyani.
            </p>

            {/* Pill CTA Buttons: Red & Solid White */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <MagneticButton strength={0.25}>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center px-8 sm:px-9 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-semibold text-white bg-brand-red hover:bg-brand-red-hover active:scale-95 transition-all duration-200 shadow-[0_8px_24px_rgba(229,9,20,0.35)]"
                >
                  View Menu
                </Link>
              </MagneticButton>

              <MagneticButton strength={0.2}>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 sm:px-9 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-semibold text-[#141518] bg-white hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-md"
                >
                  Book A Table
                </Link>
              </MagneticButton>
            </div>

            {/* Social Proof Reviews Row */}
            <div className="pt-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white tracking-wide">Reviews</span>
                <div className="flex -space-x-2.5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-[#141518] object-cover"
                    src="/images/avatars/reviewer-1.jpg"
                    alt="Customer Reviewer"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-[#141518] object-cover"
                    src="/images/avatars/reviewer-2.jpg"
                    alt="Customer Reviewer"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-[#141518] object-cover"
                    src="/images/avatars/reviewer-3.jpg"
                    alt="Customer Reviewer"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22242b] border border-white/10 text-xs font-bold text-white">
                    +45
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <span className="text-sm text-gray-200 font-semibold">
                  5.0 <span className="text-gray-400 font-normal">(2.5k reviews)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Clean Plate with Basil & Tomato Garnishes */}
          <div className="lg:col-span-5 relative flex items-center justify-center mt-6 lg:mt-0">
            <div className="relative group animate-plate-float max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] w-full aspect-square">
              {/* Organic Floating Basil Leaves and Ripe Tomato Slice */}
              <FloatingGarnishes />

              {/* Clean Ceramic Plate with Studio Shadow */}
              <div className="w-full h-full rounded-full overflow-hidden border-[6px] sm:border-[8px] border-[#222429] shadow-[0_40px_90px_rgba(0,0,0,0.95)] relative bg-[#17181c]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/dishes/hero-signature-plate.jpg"
                  alt="Sika Cuisine Signature Delicacy"
                  className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dishes Horizontal Carousel Section (Matching Reference Design Layout) */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 border-t border-border-subtle/50">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red mb-2">
              Chef&apos;s Signature Selection &bull; Sunyani Favourites
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Most Loved In Sunyani
            </h2>
          </div>

          {/* Carousel Navigation Buttons: Left Dark Button, Right Red Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollCarousel("left")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1e2025] border border-white/10 text-white hover:bg-[#282a32] active:scale-95 transition-all shadow-md"
              aria-label="Previous dishes"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollCarousel("right")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white hover:bg-brand-red-hover active:scale-95 transition-all shadow-[0_4px_16px_rgba(229,9,20,0.4)]"
              aria-label="Next dishes"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={carouselRef}
          className="flex items-stretch gap-6 overflow-x-auto scrollbar-none scroll-smooth pt-16 pb-6 px-2 -mx-2 touch-pan-x"
        >
          {FEATURED_DISHES.map((dish) => (
            <div
              key={dish.id}
              ref={(el) => {
                cardRefs.current[dish.id] = el;
              }}
              className="w-64 sm:w-72 flex-shrink-0 relative rounded-[28px] bg-[#1a1b20] border border-white/[0.06] p-5 pt-20 flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:border-brand-red/40 transition-all duration-300 group"
            >
              {/* Overlapping Top Plate */}
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full overflow-hidden border-[4px] border-[#222429] shadow-[0_16px_32px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform duration-300 bg-[#16171a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Dish Meta */}
              <div className="text-center mt-2 flex-grow">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                  {dish.categoryName}
                </span>
                <h3 className="font-serif text-lg font-bold text-white mt-1 group-hover:text-brand-red transition-colors line-clamp-1">
                  {dish.name}
                </h3>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed font-light">
                  {dish.description}
                </p>

                {/* Star Rating */}
                <div className="flex items-center justify-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
              </div>

              {/* Bottom Price and Cart Button */}
              <div className="mt-6 pt-4 border-t border-border-subtle/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">Price</span>
                  <span className="text-base font-bold text-brand-red font-mono">
                    {formatPesewasToGhs(dish.basePricePesewas)}
                  </span>
                </div>

                <MagneticButton strength={0.25}>
                  <button
                    onClick={(e) => handleQuickAdd(dish, e)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red text-white shadow-[0_4px_14px_rgba(229,9,20,0.4)] hover:bg-brand-red-hover hover:scale-105 active:scale-95 transition-all duration-200"
                    aria-label={`Add ${dish.name} to order tray`}
                  >
                    <RestaurantClocheIcon className="h-4 w-4" />
                  </button>
                </MagneticButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kinetic Marquee Ticker */}
      <KineticMarquee className="border-y border-border-subtle/80 bg-[#111215]/90 backdrop-blur-md" />

      {/* Culinary Categories Grid */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
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
                className="block h-full rounded-3xl bg-surface-200/80 border border-border-subtle p-6 hover:border-brand-red/40 transition-all group shadow-card"
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

      {/* Delivery Coverage Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-border-subtle/60">
        <div className="rounded-3xl bg-surface-200 border border-border-subtle p-6 sm:p-10 md:p-12 relative overflow-hidden shadow-card">
          <div className="max-w-2xl relative z-10">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red mb-3">
              Fast & Reliable Sunyani Dispatch
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Delivering Hot & Fresh Across Sunyani
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed mb-6 font-light">
              From Sunyani Central to UENR Campus in Fiapre, Berlin Top, Abesim, New Dormaa, and Penkwase.
              Our dedicated delivery team ensures your food arrives piping hot with real-time status updates.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-[11px] sm:text-xs font-medium text-gray-300">
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
