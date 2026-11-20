"use client";

import React from "react";
import { LucideIcon, UtensilsCrossed } from "lucide-react";

export function EmptyState({
  icon: Icon = UtensilsCrossed,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-[#333333] bg-[#1C1C1C] px-6 py-14 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#333333] bg-[#262626] text-[#F0444A]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-xl font-bold text-[#F5F1EA]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A3A3A3]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
