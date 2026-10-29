"use client";

import React from "react";

/**
 * Organic floating basil leaves and ripe tomato garnishes
 * replicated from the reference design.
 */
export function FloatingGarnishes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      {/* Top Left Floating Basil Leaf */}
      <div className="absolute -left-6 sm:-left-8 top-10 sm:top-14 animate-float-leaf-1 z-20">
        <svg
          width="44"
          height="48"
          viewBox="0 0 50 56"
          fill="none"
          className="drop-shadow-[0_12px_16px_rgba(0,0,0,0.7)] transform -rotate-12 hover:scale-105 transition-transform"
        >
          <path
            d="M25 2C10 12 2 30 12 46C18 54 32 54 38 46C48 30 40 12 25 2Z"
            fill="url(#basil-grad-1)"
          />
          <path
            d="M25 6C23 18 24 35 25 50"
            stroke="#22541a"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M25 22C18 20 12 25 9 30"
            stroke="#22541a"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M25 32C32 30 38 34 41 38"
            stroke="#22541a"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="basil-grad-1" x1="12" y1="2" x2="38" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#48bb35" />
              <stop offset="50%" stopColor="#2e8520" />
              <stop offset="100%" stopColor="#1b5e13" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Mid Left Floating Basil Leaf */}
      <div className="absolute -left-10 sm:-left-12 top-1/2 -translate-y-6 animate-float-leaf-2 z-20">
        <svg
          width="52"
          height="56"
          viewBox="0 0 50 56"
          fill="none"
          className="drop-shadow-[0_14px_20px_rgba(0,0,0,0.75)] transform rotate-45"
        >
          <path
            d="M25 2C10 12 2 30 12 46C18 54 32 54 38 46C48 30 40 12 25 2Z"
            fill="url(#basil-grad-2)"
          />
          <path
            d="M25 6C24 20 24 38 25 50"
            stroke="#1b5e13"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M25 18C16 17 11 22 8 28"
            stroke="#1b5e13"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M25 28C34 26 39 31 42 36"
            stroke="#1b5e13"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="basil-grad-2" x1="8" y1="2" x2="42" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#55c942" />
              <stop offset="60%" stopColor="#318f23" />
              <stop offset="100%" stopColor="#1c5c14" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Left Small Basil Leaf */}
      <div className="absolute -left-6 sm:-left-8 bottom-6 sm:bottom-10 animate-float-leaf-3 z-20">
        <svg
          width="36"
          height="40"
          viewBox="0 0 50 56"
          fill="none"
          className="drop-shadow-[0_10px_14px_rgba(0,0,0,0.7)] transform rotate-12"
        >
          <path
            d="M25 2C10 12 2 30 12 46C18 54 32 54 38 46C48 30 40 12 25 2Z"
            fill="url(#basil-grad-1)"
          />
          <path
            d="M25 6C23 18 24 35 25 50"
            stroke="#22541a"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Fresh Ripe Red Tomato on the Right Rim */}
      <div className="absolute -right-5 sm:-right-8 top-16 sm:top-24 animate-float-tomato z-20">
        <svg
          width="64"
          height="64"
          viewBox="0 0 80 80"
          fill="none"
          className="drop-shadow-[0_18px_25px_rgba(0,0,0,0.85)] transform rotate-6"
        >
          {/* Main tomato sphere with specular highlight */}
          <circle cx="40" cy="44" r="32" fill="url(#tomato-body)" />
          <ellipse cx="30" cy="32" rx="14" ry="8" fill="white" fillOpacity="0.25" transform="rotate(-20 30 32)" />

          {/* Green stem & calyx leaves */}
          <path
            d="M40 12C38 18 36 24 40 26C44 24 42 18 40 12Z"
            fill="#388e3c"
          />
          <path
            d="M40 24C32 20 22 22 18 26C24 28 32 26 40 24Z"
            fill="#2e7d32"
          />
          <path
            d="M40 24C48 20 58 22 62 26C56 28 48 26 40 24Z"
            fill="#2e7d32"
          />
          <path
            d="M40 24C36 30 34 38 36 42C38 36 40 30 40 24Z"
            fill="#1b5e20"
          />
          <path
            d="M40 24C44 30 46 38 44 42C42 36 40 30 40 24Z"
            fill="#1b5e20"
          />

          <defs>
            <radialGradient id="tomato-body" cx="32" cy="34" r="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4d4d" />
              <stop offset="35%" stopColor="#e50914" />
              <stop offset="75%" stopColor="#ad030a" />
              <stop offset="100%" stopColor="#660005" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <style jsx>{`
        @keyframes floatLeaf1 {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-7px) rotate(-8deg); }
        }
        @keyframes floatLeaf2 {
          0%, 100% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-9px) rotate(49deg); }
        }
        @keyframes floatLeaf3 {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-5px) rotate(16deg); }
        }
        @keyframes floatTomato {
          0%, 100% { transform: translateY(0px) rotate(6deg); }
          50% { transform: translateY(-6px) rotate(4deg); }
        }
        .animate-float-leaf-1 {
          animation: floatLeaf1 6s ease-in-out infinite;
        }
        .animate-float-leaf-2 {
          animation: floatLeaf2 7s ease-in-out 1s infinite;
        }
        .animate-float-leaf-3 {
          animation: floatLeaf3 5.5s ease-in-out 0.5s infinite;
        }
        .animate-float-tomato {
          animation: floatTomato 6.5s ease-in-out 1.5s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-float-leaf-1,
          .animate-float-leaf-2,
          .animate-float-leaf-3,
          .animate-float-tomato {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
