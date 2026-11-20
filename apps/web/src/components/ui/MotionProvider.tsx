"use client";

import React from "react";
import { MotionConfig } from "framer-motion";

/**
 * Global Framer Motion reduced-motion provider ensuring WCAG 2.2 AA compliance
 * whenever a visitor enables reduced motion in their OS settings.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
