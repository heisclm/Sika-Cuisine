"use client";

import React from "react";

interface KineticMarqueeProps {
  items?: string[];
  speedSeconds?: number;
  direction?: "left" | "right";
  className?: string;
}

const DEFAULT_MARQUEE_ITEMS = [
  "Charcoal-Grilled Whole Tilapia",
  "Slow-Simmered Smoky Jollof",
  "Hand-Pounded Fufu in Light Soup",
  "Sunyani Pineapple & Coconut Fruit Rice",
  "Stone-Baked Artisan Pizza",
  "Tuo Zaafi with Ayoyo & Dawadawa",
  "Direct Sunyani Kitchen Dispatch",
];

export function KineticMarquee({
  items = DEFAULT_MARQUEE_ITEMS,
  speedSeconds = 35,
  direction = "left",
  className = "",
}: KineticMarqueeProps) {
  const content = items.map((text, i) => (
    <span key={i} className="inline-flex items-center gap-6 px-4">
      <span className="font-display tracking-[0.22em] uppercase text-xs sm:text-sm font-bold text-[#A3A3A3] transition-colors group-hover:text-[#F5F1EA]">
        {text}
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-[#D71920] flex-shrink-0" />
    </span>
  ));

  return (
    <div
      aria-hidden="true"
      className={`group w-full overflow-hidden border-y border-[#333333] bg-[#101010]/90 backdrop-blur-md py-4 select-none ${className}`}
    >
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${speedSeconds}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        <div className="flex shrink-0">{content}</div>
        <div className="flex shrink-0">{content}</div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
