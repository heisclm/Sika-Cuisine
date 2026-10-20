import React from "react";
import Link from "next/link";
import { Utensils, Home } from "lucide-react";
import { BespokeSeal } from "@/components/creative/BespokeSeal";

export default function NotFound() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background text-gray-200">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] studio-vignette pointer-events-none -z-10" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center mb-2">
          <BespokeSeal size={74} />
        </div>

        <div className="inline-flex items-center gap-2.5">
          <span className="h-px w-6 bg-brand-red/60" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red">
            Error 404 &bull; Missing Delicacy
          </span>
          <span className="h-px w-6 bg-brand-red/60" />
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          This Plate Has Left the Kitchen
        </h1>

        <p className="text-sm sm:text-base text-gray-400 font-light leading-relaxed max-w-md mx-auto">
          The delicacy or page you are looking for is no longer on our kitchen pass. Let us guide you back to our simmering pots and charcoal grills in Sunyani.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-brand-red hover:bg-brand-red-hover active:scale-95 transition-all shadow-sm"
          >
            <Utensils className="h-4 w-4" />
            <span>Browse Full Menu</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#1c1d22] border border-white/10 text-sm font-semibold text-gray-200 hover:text-white hover:bg-[#25272e] transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-border-subtle/50 text-[11px] uppercase tracking-widest text-gray-500 font-medium">
          Sika Cuisine &bull; Sunyani Central &bull; Bono Region
        </div>
      </div>
    </div>
  );
}
