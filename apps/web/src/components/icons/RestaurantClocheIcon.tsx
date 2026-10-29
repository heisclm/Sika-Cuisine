import React from "react";

interface IconProps {
  className?: string;
}

/**
 * High-end restaurant dining cloche / gourmet food cover icon.
 * Used for restaurant table orders and dining trays.
 */
export function RestaurantClocheIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Top Cloche Knob / Finial */}
      <circle cx="12" cy="4.5" r="1.5" />
      {/* Food Cloche Dome */}
      <path d="M4 16.5C4 12.08 7.58 8.5 12 8.5C16.42 8.5 20 12.08 20 16.5H4Z" />
      {/* Service Platter Tray */}
      <path d="M2 18.5H22" strokeWidth="2" />
      {/* Under-Tray Base Accent */}
      <path d="M7 21H17" strokeWidth="1.6" />
    </svg>
  );
}
