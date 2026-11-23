"use client";

import React, { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

/**
 * Root crash boundary handling fatal errors occurring inside the root App Router shell.
 */
export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Sika Cuisine Fatal Error Boundary]:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#101010] text-[#F5F1EA] flex items-center justify-center px-4 antialiased">
        <div className="w-full max-w-md rounded-3xl border border-[#333333] bg-[#1C1C1C] p-8 text-center space-y-5 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D71920]/40 bg-[#D71920]/15 text-[#F0444A]">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              Sika Cuisine Needs a Quick Refresh
            </h1>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              An unexpected interruption occurred while rendering this page. Please retry or return to the storefront.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-5 text-sm font-semibold text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Retry Page</span>
            </button>
            <a
              href="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-5 text-sm font-semibold text-[#F5F1EA] transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
