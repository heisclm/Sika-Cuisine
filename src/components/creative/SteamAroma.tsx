"use client";

import React from "react";

export function SteamAroma({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 flex justify-center gap-6 overflow-visible ${className}`}
    >
      <svg
        viewBox="0 0 60 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-24 opacity-40 animate-steam-wisp-1"
      >
        <path
          d="M30 110C15 90 45 70 30 50C15 30 40 15 25 5"
          stroke="url(#steam-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="steam-gradient" x1="0" y1="110" x2="0" y2="5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#e11d48" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        viewBox="0 0 60 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-28 opacity-30 animate-steam-wisp-2"
      >
        <path
          d="M25 115C40 95 10 75 35 55C15 35 30 20 20 8"
          stroke="url(#steam-gradient-2)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="steam-gradient-2" x1="0" y1="115" x2="0" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        viewBox="0 0 60 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-20 opacity-35 animate-steam-wisp-3"
      >
        <path
          d="M32 105C20 85 40 68 28 48C18 32 32 18 24 10"
          stroke="url(#steam-gradient)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>

      <style jsx>{`
        @keyframes steamRise1 {
          0% {
            transform: translateY(12px) scaleY(0.9);
            opacity: 0;
          }
          40% {
            opacity: 0.45;
          }
          80% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-24px) scaleY(1.15);
            opacity: 0;
          }
        }
        @keyframes steamRise2 {
          0% {
            transform: translateY(16px) scaleY(0.85);
            opacity: 0;
          }
          45% {
            opacity: 0.4;
          }
          85% {
            opacity: 0.15;
          }
          100% {
            transform: translateY(-30px) scaleY(1.2);
            opacity: 0;
          }
        }
        @keyframes steamRise3 {
          0% {
            transform: translateY(8px) scaleY(0.95);
            opacity: 0;
          }
          50% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-20px) scaleY(1.1);
            opacity: 0;
          }
        }
        .animate-steam-wisp-1 {
          animation: steamRise1 4.5s ease-in-out infinite;
        }
        .animate-steam-wisp-2 {
          animation: steamRise2 5.5s ease-in-out 1.2s infinite;
        }
        .animate-steam-wisp-3 {
          animation: steamRise3 4s ease-in-out 2.1s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-steam-wisp-1,
          .animate-steam-wisp-2,
          .animate-steam-wisp-3 {
            animation: none;
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}
