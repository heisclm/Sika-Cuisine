"use client";

import React, { useRef, useEffect } from "react";

interface Ember {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  fadeSpeed: number;
  color: string;
}

export function AmbientEmbers({
  className = "",
  count = 28,
}: {
  className?: string;
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let animationFrameId: number;
    let isVisible = true;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = [
      "225, 29, 72",  // Sika Crimson Red
      "245, 158, 11", // Warm Charcoal Gold
      "217, 119, 6",  // Amber Embers
    ];

    const embers: Ember[] = Array.from({ length: count }, () => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 40,
        size: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.45 + 0.25,
        speedX: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.6 + 0.1,
        maxOpacity: Math.random() * 0.5 + 0.3,
        fadeSpeed: Math.random() * 0.003 + 0.001,
        color,
      };
    });

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        embers.forEach((ember) => {
          ember.y -= ember.speedY;
          ember.x += ember.speedX;
          ember.opacity -= ember.fadeSpeed;

          if (ember.y < -10 || ember.opacity <= 0) {
            ember.y = canvas.height + 10;
            ember.x = Math.random() * canvas.width;
            ember.opacity = Math.random() * 0.5 + 0.3;
          }

          ctx.beginPath();
          ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ember.color}, ${ember.opacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${ember.color}, 0.6)`;
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
