import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#101010] flex flex-col items-center justify-center gap-3 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#333333] bg-[#1C1C1C]">
        <Loader2 className="h-6 w-6 animate-spin text-[#D71920]" aria-hidden="true" />
      </div>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#A3A3A3]">
        Loading Sika Cuisine
      </p>
    </div>
  );
}
