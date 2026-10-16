import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart, Utensils, MapPin, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Banner */}
      <div className="border-b border-border-subtle bg-surface-300 py-16 sm:py-24 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4" /> Culinary Heritage in Sunyani
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-black text-white">
            The Sika Cuisine Story
          </h1>
          <p className="mt-4 text-base text-gray-300 leading-relaxed font-light">
            Born from an unyielding passion for Ghanaian culinary artistry, Sika Cuisine brings
            the soulful depth of home-cooked gastronomy to the heart of the Bono Region.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-16 space-y-16">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red mx-auto">
              <Utensils className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Woodsmoke Authenticity</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Our signature Jollof and stews are slow-simmered using natural wood coals and clay earthenware, locking in deep, smoky aromatics.
            </p>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/60 text-emerald-400 mx-auto">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Uncompromising Hygiene</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We strictly adhere to certified food handling standards. Every fish, cut of meat, and vegetable is meticulously sourced and inspected daily.
            </p>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold mx-auto">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Sunyani Local Pride</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We celebrate the warmth of Sunyani. Our dispatch couriers know every street from Fiapre to Berlin Top to ensure your food arrives piping hot.
            </p>
          </div>
        </div>

        {/* Narrative & Kitchen Section */}
        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
              Our Kitchen Philosophy
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">
              Food is Culture. Food is Home.
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed font-light">
              At Sika Cuisine, we never take shortcuts. Our shito is simmered for over six hours
              with ginger, dried shrimp, and smoked fish. Our plantains for kelewele are selected
              at the exact ripeness to achieve that irresistible caramelized crunch.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed font-light">
              Whether you are dining in, picking up at our Sunyani Central counter, or receiving a
              delivery at UENR campus, you receive an authentic Ghanaian banquet.
            </p>
            <div className="pt-2">
              <Link
                href="/menu"
                className="btn-red-gradient inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white shadow-glow"
              >
                <span>Experience Our Menu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-border-subtle h-80 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
              alt="Sika Cuisine Kitchen Atmosphere"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
