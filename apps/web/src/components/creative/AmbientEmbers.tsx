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
  minSize = 0.8,
  maxSize = 3.0,
  opacity = 0.5,
}: {
  className?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
  opacity?: number;
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
      "215, 25, 32",  // Sika Primary Red
      "240, 68, 74",  // Sika Light Red
      "245, 241, 234", // Warm White
    ];

    const opacityScale = opacity / 0.5;
    const embers: Ember[] = Array.from({ length: count }, () => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 40,
        size: Math.random() * (maxSize - minSize) + minSize,
        speedY: Math.random() * 0.45 + 0.25,
        speedX: (Math.random() - 0.5) * 0.35,
        opacity: (Math.random() * 0.6 + 0.1) * opacityScale,
        maxOpacity: (Math.random() * 0.5 + 0.3) * opacityScale,
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
  }, [count, minSize, maxSize, opacity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
