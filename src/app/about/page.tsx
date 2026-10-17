import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Utensils, MapPin, ArrowRight, Flame } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-24 text-gray-200">
      <div className="border-b border-border-subtle bg-surface-300 py-16 sm:py-24 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-red/5 blur-[120px] pointer-events-none -z-10" />
        <div className="mx-auto max-w-3xl px-4">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-px w-8 bg-brand-red/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red">
              Sunyani Culinary Heritage
            </span>
            <span className="h-px w-8 bg-brand-red/60" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
            The Sika Cuisine Story
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-300 leading-relaxed font-light max-w-2xl mx-auto">
            Rooted in the rich agricultural heart of the Bono Region, Sika Cuisine is Sunyani&apos;s premier destination for authentic, slow-simmered Ghanaian gastronomy and vibrant lounge dining.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-3xl bg-surface-300/90 border border-border-subtle p-8 text-center space-y-3.5 hover:border-brand-red/40 transition-colors shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red mx-auto">
              <Flame className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Charcoal Grill & Woodsmoke</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              From our signature charcoal-grilled whole tilapia with chilli to succulent spiced chicken packages, our dishes are kissed with natural embers and woodsmoke aromatics.
            </p>
          </div>

          <div className="rounded-3xl bg-surface-300/90 border border-border-subtle p-8 text-center space-y-3.5 hover:border-brand-red/40 transition-colors shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/60 text-emerald-400 mx-auto">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Uncompromising Hygiene</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every cut of beef, fresh tilapia, farm chicken, and local vegetable is inspected daily. We uphold rigorous food safety and immaculate kitchen standards across every station.
            </p>
          </div>

          <div className="rounded-3xl bg-surface-300/90 border border-border-subtle p-8 text-center space-y-3.5 hover:border-brand-red/40 transition-colors shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold mx-auto">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Local Sunyani Pride</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We proudly celebrate Sunyani&apos;s culinary identity. Our couriers provide fast direct dispatch from Fiapre and UENR Campus to Berlin Top, Kotokrom, and Sunyani Central.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-300/90 border border-border-subtle p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center shadow-card">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-brand-red text-xs font-bold uppercase tracking-widest">
              <span>Authentic Kitchen Craft</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Honoring Ghana&apos;s Iconic Dishes
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed font-light">
              At Sika Cuisine, authenticity is our promise. Our traditional stews and soups — from slow-simmered Okro soup with Banku to rich Groundnut soup with Omutuo, Tuo Zaafi (TZ) with Ayoyo, and silky Pounded Fufu in spiced light soup — are cooked with time-honored patience.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed font-light">
              Alongside our traditional staples, our kitchen crafts signature creations: Wok-infused Sunyani Pineapple & Coconut Fruit Rice, the celebrated SIKA Special Combo (De Mixture), Loaded Fries, and stone-baked artisan pizzas.
            </p>
            <div className="pt-2">
              <Link
                href="/menu"
                className="btn-red-gradient inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white shadow-glow"
              >
                <span>Explore Full Menu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-border-subtle h-80 sm:h-96 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
              alt="Sika Cuisine Kitchen Atmosphere"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-r from-surface-300 via-surface-200 to-surface-300 border border-border-subtle p-8 text-center space-y-4">
          <h3 className="font-serif text-2xl font-bold text-white">
            Visit Sika Cuisine Lounge or Order to Your Door
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed font-light">
            Located in Sunyani Central, Bono Region. Order online for swift doorstep delivery or pickup at our counter.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-red" />
              Commercial Road, Sunyani Central
            </span>
            <span className="text-gray-500">&bull;</span>
            <span className="text-gray-300">
              Call / WhatsApp: <strong className="text-white">0533376760 / 0554406681</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
