"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Sika Cuisine Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-8 text-center space-y-5 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FB7185]/35 bg-[#FB7185]/15 text-[#FDA4AF]">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-[#F5F1EA]">
            Something Interrupted Your Request
          </h1>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            An unexpected error occurred while loading this page. Your cart items remain safely stored.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="primary" size="md" fullWidth onClick={reset}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Try Again</span>
          </Button>
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-5 text-sm font-semibold text-[#F5F1EA] transition-colors"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
