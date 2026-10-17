"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Phone, Mail, MapPin, ShoppingBag, ShieldCheck, Clock, ArrowRight, LogOut, Plus } from "lucide-react";
import { SUNYANI_DELIVERY_ZONES } from "@/lib/delivery-zones";

export default function CustomerAccountPage() {
  const [profile, setProfile] = useState({
    fullName: "Kwame Mensah",
    phone: "0244123456",
    email: "kwame@example.com",
    savedAddresses: [
      {
        id: "1",
        label: "Home / Campus",
        locality: "Fiapre & UENR Campus",
        streetAddress: "House No. 42, Near Notre Dame Gate",
        isDefault: true,
      },
      {
        id: "2",
        label: "Workplace",
        locality: "Sunyani Central",
        streetAddress: "Commercial Road, Near Market Square",
        isDefault: false,
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border-subtle bg-surface-300 py-14 sm:py-20 text-center relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red mx-auto mb-3 font-serif font-black text-2xl shadow-glow">
            {profile.fullName.charAt(0)}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
            {profile.fullName}
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Sika Cuisine Diner Account &bull; Member since 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/orders"
            className="rounded-3xl bg-surface-300 border border-border-subtle p-6 hover:border-brand-red/40 transition-all space-y-2 group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-red/15 text-brand-red group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">My Food Orders</h3>
            <p className="text-xs text-gray-400">
              Track active deliveries live and view your past orders in Sunyani.
            </p>
            <span className="text-xs font-semibold text-brand-red inline-flex items-center gap-1 pt-1">
              <span>View Orders</span>
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-950/60 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">Secure Checkout</h3>
            <p className="text-xs text-gray-400">
              Payments processed securely in GHS via Paystack Mobile Money & Cards.
            </p>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">Sunyani Fast Delivery</h3>
            <p className="text-xs text-gray-400">
              Direct dispatch across Fiapre, Berlin Top, Kotokrom, and Sunyani Central.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-brand-red" />
              <span>Personal Contact Details</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Full Name</span>
              <p className="font-semibold text-white">{profile.fullName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ghanaian Phone</span>
              <p className="font-semibold text-white font-mono">{profile.phone}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</span>
              <p className="font-semibold text-white">{profile.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account Type</span>
              <p className="font-semibold text-emerald-400">Verified Diner</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-red" />
                <span>Saved Sunyani Delivery Addresses</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Saved delivery destinations used during quick checkout
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-2xl bg-surface-200 border border-border-subtle p-4 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-red/20 text-brand-red text-[10px] font-bold border border-brand-red/30">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-200">{addr.streetAddress}</p>
                <p className="text-xs text-brand-gold">{addr.locality}, Sunyani</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-brand-red transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out from Sika Cuisine</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
