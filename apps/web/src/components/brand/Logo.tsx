"use client";

import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Universal Sika Cuisine Brand Logo.
 * Points directly to /images/logo.png so that replacing the file
 * in public/images/logo.png automatically updates the entire site.
 */
export function Logo({ size = 44, className = "" }: LogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden rounded-2xl ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo.png"
        alt="Sika Cuisine Logo"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        onError={(e) => {
          // Fallback to logo.svg if PNG is being swapped
          const target = e.currentTarget;
          if (target.src.endsWith(".png")) {
            target.src = "/images/logo.svg";
          }
        }}
      />
    </div>
  );
}
