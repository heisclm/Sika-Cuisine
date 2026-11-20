"use client";

import React from "react";

export function SvgFlourish({
  className = "",
  color = "#D71920",
  width = 240,
  height = 20,
}: {
  className?: string;
  color?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block overflow-visible ${className}`}
      aria-hidden="true"
    >
      <path
        d="M3 15.5C45 4.5 95 3 145 7.5C185 11 215 15 237 12"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="path-flourish"
      />
      <path
        d="M25 18C70 11 150 9.5 215 16.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.6"
        className="path-flourish-secondary"
      />
      <style jsx>{`
        .path-flourish {
          stroke-dasharray: 260;
          stroke-dashoffset: 260;
          animation: drawFlourish 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .path-flourish-secondary {
          stroke-dasharray: 210;
          stroke-dashoffset: 210;
          animation: drawFlourish 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
        }
        @keyframes drawFlourish {
          to {
            stroke-dashoffset: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .path-flourish,
          .path-flourish-secondary {
            stroke-dashoffset: 0;
            animation: none;
          }
        }
      `}</style>
    </svg>
  );
}
