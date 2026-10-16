import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Editorial serif font for headlines and culinary showcase text.
 * Automatically downloaded, preloaded, and self-hosted with zero external CDN calls at runtime.
 */
export const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

/**
 * Modern sans-serif font for crisp navigation, menus, and tabular numerals.
 * Automatically downloaded, preloaded, and self-hosted with zero external CDN calls at runtime.
 */
export const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
