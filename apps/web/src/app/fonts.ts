import localFont from "next/font/local";

/**
 * Fraunces — Bespoke editorial culinary serif with warm ink-traps and expressive italics.
 * Self-hosted locally with zero external network overhead and zero layout shifts.
 */
export const fontSerif = localFont({
  src: [
    {
      path: "../fonts/Fraunces-Variable.ttf",
      style: "normal",
    },
    {
      path: "../fonts/Fraunces-Italic-Variable.ttf",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: false,
});

/**
 * Plus Jakarta Sans — Modern geometric grotesque for crisp navigation, menus, and tabular numerals.
 * Self-hosted locally.
 */
export const fontSans = localFont({
  src: "../fonts/PlusJakartaSans-Variable.ttf",
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false,
});

/**
 * Syne — High-fashion Locomotive / Bruno Simon display sans for kinetic marquees and avant-garde badges.
 * Self-hosted locally.
 */
export const fontDisplay = localFont({
  src: "../fonts/Syne-Variable.ttf",
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false,
});
