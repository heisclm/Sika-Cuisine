import React from "react";
import Link from "next/link";
import { ArrowRight, ChefHat, Clock, Flame, MapPin, Phone, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { RESTAURANT_INFO } from "@/lib/navigation";
import { SUNYANI_DELIVERY_ZONES } from "@/lib/delivery-zones";
import { formatPesewasToGhs } from "@/lib/currency";

const KITCHEN_PILLARS = [
  {
    icon: Flame,
    title: "Charcoal & Clay-Pot Craft",
    description:
      "Every whole tilapia is seasoned with Sunyani herbs and grilled to order over live hardwood coals, while local soups slow-simmer daily.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent Ghana Cedis Pricing",
    description:
      "Menu prices, delivery zone tariffs across Sunyani, and payment methods are shown upfront before you confirm your order.",
  },
  {
    icon: Clock,
    title: "Built for Pickup & Doorstep Delivery",
    description:
      "Collect directly from our Commercial Road counter at zero delivery charge, or dispatch a rider across Central Sunyani, Fiapre, and estates.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#101010] pb-20">
      {/* Editorial Hero */}
      <section className="relative overflow-hidden border-b border-[#333333] bg-[#1C1C1C]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D71920]/40 bg-[#D71920]/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#F0444A]">
              <ChefHat className="h-3.5 w-3.5" aria-hidden="true" />
              Our Sunyani Kitchen
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.08]">
              Honest Ghanaian Hospitality, Crafted Fresh in Sunyani Central.
            </h1>
            <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
              Sika Cuisine brings together beloved Ghanaian classics — charcoal-grilled tilapia with banku, slow-cooked jollof, traditional fufu and aprapransa, spiced fruit rice, and stone-baked artisan pizzas — served from {RESTAURANT_INFO.address}.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 py-3 text-sm font-semibold text-white transition-colors"
              >
                <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                <span>Explore Full Menu</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-6 py-3 text-sm font-semibold text-[#F5F1EA] transition-colors"
              >
                <Phone className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                <span>Contact Us</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-[#333333] aspect-[4/3] shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/restaurant/lounge-interior.jpg"
                alt="Sika Cuisine Sunyani Dining Lounge"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/85 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl border border-[#333333] bg-[#1C1C1C]/90 px-4 py-3 backdrop-blur-md">
                <div>
                  <p className="font-serif text-base font-bold text-[#F5F1EA]">Sika Cuisine Lounge</p>
                  <p className="text-xs text-[#A3A3A3]">{RESTAURANT_INFO.address}</p>
                </div>
                <span className="rounded-full border border-[#22C55E]/35 bg-[#22C55E]/15 px-3 py-1 font-mono text-[11px] font-semibold text-[#4ADE80]">
                  Mon–Sun Service
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kitchen Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {KITCHEN_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#333333] bg-[#262626] text-[#F0444A]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">{pillar.title}</h2>
                <p className="text-sm leading-relaxed text-[#A3A3A3]">{pillar.description}</p>
              </div>
            );
          })}
        </div>

        {/* Delivery Coverage Summary */}
        <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#F0444A]">
                Sunyani Dispatch Network
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#F5F1EA]">
                Zone Tariffs Across Sunyani
              </h2>
            </div>
            <p className="text-xs text-[#A3A3A3] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
              Restaurant counter pickup is always GHS 0.00
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUNYANI_DELIVERY_ZONES.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between rounded-2xl border border-[#333333] bg-[#262626] px-4 py-3"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-semibold text-[#F5F1EA] truncate">{zone.name}</p>
                  <p className="text-xs text-[#A3A3A3] truncate">
                    Est. {zone.estimatedMinutes} mins &bull; {zone.description}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-[#F0444A] tabular-nums flex-shrink-0">
                  {formatPesewasToGhs(zone.feePesewas)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Strip */}
        <div className="rounded-3xl border border-[#333333] bg-gradient-to-r from-[#1C1C1C] via-[#262626] to-[#1C1C1C] p-8 text-center space-y-4">
          <h3 className="font-serif text-2xl font-bold text-white">
            Dine at Our Lounge or Order Straight to Your Door
          </h3>
          <p className="mx-auto max-w-xl text-sm text-[#A3A3A3]">
            Located in {RESTAURANT_INFO.city}. Place an order online for live kitchen preparation tracking or call our counter directly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm pt-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#F5F1EA]">
              <MapPin className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
              {RESTAURANT_INFO.address}
            </span>
            <span className="text-[#737373]">&bull;</span>
            <a
              href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
              className="font-mono font-bold text-white hover:text-[#F0444A] transition-colors"
            >
              {RESTAURANT_INFO.primaryPhone} / {RESTAURANT_INFO.secondaryPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
