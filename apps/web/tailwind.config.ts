import type { Config } from "tailwindcss";
import { SikaBrand, SikaPalette } from "../../packages/shared/src/design-tokens";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: SikaPalette.deepBlack,
        foreground: SikaPalette.warmWhite,
        surface: {
          50: SikaPalette.surfaceHover,
          100: SikaPalette.elevatedSurface,
          200: SikaPalette.charcoal,
          300: "#161616",
          400: SikaPalette.deepBlack,
          elevated: SikaPalette.elevatedSurface,
          DEFAULT: SikaPalette.charcoal,
        },
        brand: {
          red: {
            DEFAULT: SikaBrand.red,
            hover: SikaBrand.redHover,
            light: SikaBrand.redReadable,
            dark: SikaBrand.redDark,
            gradientStart: SikaBrand.redGradientStart,
            gradientEnd: SikaBrand.redGradientEnd,
          },
        },
        warmWhite: SikaPalette.warmWhite,
        border: {
          subtle: SikaPalette.border,
          muted: "#262626",
          highlight: "#484848",
        },
        semantic: {
          success: SikaPalette.successText,
          warning: SikaPalette.warningText,
          error: SikaPalette.errorText,
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-display)", "Syne", "sans-serif"],
      },
      boxShadow: {
        glow: `0 0 36px -8px rgba(${SikaBrand.redRgb}, 0.42)`,
        card: "0 18px 40px -16px rgba(0, 0, 0, 0.75)",
        plate: "0 24px 48px -12px rgba(0, 0, 0, 0.85)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
