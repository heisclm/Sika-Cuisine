import React from "react";

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Banner Skeleton */}
      <div className="border-b border-border-subtle bg-surface-300 py-14 sm:py-20 text-center animate-pulse">
        <div className="mx-auto max-w-xl px-4 space-y-4">
          <div className="h-4 w-40 bg-surface-100 rounded-full mx-auto" />
          <div className="h-10 w-3/4 bg-surface-100 rounded-2xl mx-auto" />
          <div className="h-4 w-full bg-surface-100 rounded-full mx-auto" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex gap-3 overflow-hidden pb-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-28 bg-surface-200 rounded-full flex-shrink-0 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-6">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl bg-surface-200/60 border border-border-subtle p-5 pt-16 flex flex-col justify-between animate-pulse h-80"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full bg-surface-100 border-2 border-surface-50 shadow-plate" />
              <div className="mt-4 space-y-3 text-center">
                <div className="h-3 w-16 bg-surface-100 rounded-full mx-auto" />
                <div className="h-5 w-3/4 bg-surface-100 rounded-full mx-auto" />
                <div className="h-3 w-full bg-surface-100 rounded-full mx-auto" />
              </div>
              <div className="mt-6 pt-4 border-t border-border-subtle/40 flex items-center justify-between">
                <div className="h-6 w-16 bg-surface-100 rounded-full" />
                <div className="h-11 w-11 bg-surface-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
