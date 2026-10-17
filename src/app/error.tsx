"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { AmbientEmbers } from "@/components/creative/AmbientEmbers";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for internal audit
  }, [error]);

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
      <AmbientEmbers count={14} minSize={1} maxSize={2.5} opacity={0.35} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-red/5 blur-[120px] pointer-events-none -z-10" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 rounded-3xl bg-surface-300/90 border border-border-subtle p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/15 text-brand-red border border-brand-red/30 shadow-glow mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-gold block mb-1">
            System Notice
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-white">
            Kitchen Ticket Interrupted
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
            An unexpected error occurred while preparing this view. Your saved orders and cart items remain safely stored.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="btn-red-gradient flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-full text-xs font-semibold text-white shadow-glow"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-full bg-surface-200 border border-border-subtle text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>

        <div className="text-[11px] text-gray-500 font-mono">
          Incident ID: {error.digest || "SYS-KITCHEN-OK"}
        </div>
      </div>
    </div>
  );
}
