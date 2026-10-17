import React from "react";

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
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a0e13] via-[#1a080b] to-[#0c0406] border border-brand-red/50 shadow-[0_4px_20px_rgba(225,29,72,0.3)] select-none ${className}`}
    >
      <div className="absolute inset-1 rounded-full border border-brand-gold/30 border-dashed animate-spin-slow pointer-events-none" />
      <div className="flex flex-col items-center justify-center font-serif text-center leading-none">
        <span className="text-white font-black text-sm tracking-tight">S</span>
        <span className="text-[9px] font-sans font-bold text-brand-gold tracking-widest uppercase mt-0.5">
          BONO
        </span>
      </div>
    </div>
  );
}
