"use client";

import React from "react";

export function DishCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl sm:rounded-[20px] border border-[#333333] bg-[#1C1C1C]"
    >
      <div className="aspect-[4/3] w-full sika-skeleton" />
      <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3">
        <div className="h-3 w-20 sm:w-24 rounded-full sika-skeleton" />
        <div className="h-4 sm:h-5 w-4/5 rounded-lg sika-skeleton" />
        <div className="space-y-1.5">
          <div className="h-3 sm:h-3.5 w-full rounded sika-skeleton" />
          <div className="h-3 sm:h-3.5 w-2/3 rounded sika-skeleton" />
        </div>
        <div className="pt-2.5 sm:pt-3 border-t border-[#333333] flex items-center justify-between gap-2">
          <div className="h-4 sm:h-5 w-16 sm:w-20 rounded sika-skeleton" />
          <div className="h-8 sm:h-9 w-16 sm:w-24 rounded-lg sm:rounded-xl sika-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-5 space-y-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="h-5 w-36 rounded sika-skeleton" />
        <div className="h-6 w-24 rounded-full sika-skeleton" />
      </div>
      <div className="h-4 w-3/4 rounded sika-skeleton" />
      <div className="flex items-center justify-between pt-2 border-t border-[#333333]">
        <div className="h-3.5 w-28 rounded sika-skeleton" />
        <div className="h-4 w-20 rounded sika-skeleton" />
      </div>
    </div>
  );
}
