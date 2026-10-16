"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, FlyingItem } from "@/context/CartContext";

export function FlyingCartAnimation() {
  const { flyingItems, removeFlyingItem } = useCart();
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  useEffect(() => {
    const updateTarget = () => {
      const cartBtn = document.getElementById("header-cart-button");
      if (cartBtn) {
        const rect = cartBtn.getBoundingClientRect();
        setTargetPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget);
    };
  }, []);

  if (prefersReducedMotion || !targetPos) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((item: FlyingItem) => (
          <motion.div
            key={item.id}
            initial={{
              x: item.startX - 32,
              y: item.startY - 32,
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: targetPos.x - 16,
              y: targetPos.y - 16,
              scale: 0.25,
              opacity: 0.6,
              rotate: 360,
            }}
            transition={{
              duration: 0.75,
              ease: [0.25, 1, 0.5, 1],
            }}
            onAnimationComplete={() => {
              removeFlyingItem(item.id);
              const cartBtn = document.getElementById("header-cart-button");
              if (cartBtn) {
                cartBtn.classList.add("scale-110", "shadow-glow");
                setTimeout(() => {
                  cartBtn.classList.remove("scale-110", "shadow-glow");
                }, 200);
              }
            }}
            className="absolute h-16 w-16 rounded-full border-2 border-brand-red bg-surface-100 shadow-plate overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover rounded-full"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
