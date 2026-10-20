import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#141518",
        surface: {
          50: "#27292f",
          100: "#202227",
          200: "#1a1b20",
          300: "#151619",
          400: "#101113",
          DEFAULT: "#1a1b20",
        },
        brand: {
          red: {
            DEFAULT: "#e50914",
            hover: "#b91c1c",
            light: "#ff3842",
            dark: "#8f0007",
            gradientStart: "#f01c24",
            gradientEnd: "#a80710",
          },
          gold: "#f59e0b",
        },
        border: {
          subtle: "#282a30",
          muted: "#1f2025",
          highlight: "#393c44",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-display)", "Syne", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(229, 9, 20, 0.35)",
        card: "0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        plate: "0 25px 50px -12px rgba(0, 0, 0, 0.85)",
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
