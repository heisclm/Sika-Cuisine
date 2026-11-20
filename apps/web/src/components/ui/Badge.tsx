"use client";

import React from "react";

export type BadgeVariant = "brand" | "neutral" | "success" | "warning" | "error";

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  brand: "bg-[#D71920]/15 text-[#F0444A] border-[#D71920]/40",
  neutral: "bg-[#262626] text-[#A3A3A3] border-[#333333]",
  success: "bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/35",
  warning: "bg-[#EAB308]/15 text-[#FACC15] border-[#EAB308]/35",
  error: "bg-[#FB7185]/15 text-[#FDA4AF] border-[#FB7185]/35",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${BADGE_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
