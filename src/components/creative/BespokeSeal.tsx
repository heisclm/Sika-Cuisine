"use client";

import React from "react";
import { Logo } from "@/components/brand/Logo";

export function BespokeSeal({
  size = 56,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-md select-none ${className}`}
    >
      <Logo size={size} />
    </div>
  );
}
