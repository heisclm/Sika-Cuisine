import React from "react";

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border-subtle bg-surface-300 py-14 sm:py-20 text-center animate-pulse">
        <div className="mx-auto max-w-xl px-4 space-y-4">
          <div className="h-4 w-40 bg-surface-100 rounded-full mx-auto" />
          <div className="h-10 w-2/3 bg-surface-100 rounded-2xl mx-auto" />
          <div className="h-4 w-full bg-surface-100 rounded-full mx-auto" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="rounded-3xl bg-surface-300/80 border border-border-subtle p-8 shadow-2xl animate-pulse space-y-4">
          <div className="h-6 w-48 bg-surface-100 rounded-full" />
          <div className="h-4 w-72 bg-surface-100 rounded-full" />
          <div className="h-12 w-full bg-surface-100 rounded-xl" />
        </div>

        <div className="mt-12 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-surface-300/60 border border-border-subtle p-6 space-y-4 animate-pulse h-36"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
