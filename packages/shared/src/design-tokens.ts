/**
 * @file packages/shared/src/design-tokens.ts
 * @description Canonical Sika Cuisine visual design tokens shared across Next.js Web and Expo Native Mobile.
 *
 * COLOUR IDENTITY INVARIANT:
 * - Crimson Red (`#D71920`) is the primary Sika Cuisine brand accent.
 * - Deep Black (`#101010`), Charcoal (`#1C1C1C`), and Elevated Charcoal (`#262626`) form the surface hierarchy.
 * - Warm White (`#F5F1EA`) and Pure White (`#FFFFFF`) provide high-contrast foreground typography.
 * - Legacy orange and gold accent tokens are strictly forbidden across all surfaces.
 */

/** Official Sika Cuisine colour palette. */
export const SikaPalette = {
  /** Primary brand accent for primary CTAs, active navigation, and price highlights. */
  primaryRed: "#D71920",
  primaryRedRgb: "215, 25, 32",
  /** Hover/pressed state for primary red controls. */
  darkerRed: "#A91017",
  /** High-contrast red for small uppercase labels, icons, and links on dark surfaces (>= 4.5:1 AA on #101010). */
  lightRed: "#F0444A",
  /** Deep burgundy red for gradient anchoring. */
  deepRed: "#860B11",

  /** Primary application canvas. */
  deepBlack: "#101010",
  /** Card, sheet, header, and drawer primary surface. */
  charcoal: "#1C1C1C",
  /** Nested surface, input fill, chip background, and raised card header. */
  elevatedSurface: "#262626",
  /** Subtle hover/active surface elevation. */
  surfaceHover: "#2F2F2F",

  /** Warm culinary editorial ink for readable body/display accents. */
  warmWhite: "#F5F1EA",
  /** Pure white for high-emphasis headings and button foregrounds on red. */
  primaryText: "#FFFFFF",
  /** Secondary body and metadata copy (~7.2:1 contrast on #1C1C1C). */
  secondaryText: "#A3A3A3",
  /** Muted captions, timestamps, and disabled placeholders. */
  mutedText: "#737373",

  /** Standard 1px hairline border separating dark charcoal planes. */
  border: "#333333",
  borderSubtle: "rgba(245, 241, 234, 0.10)",
  borderHighlight: "rgba(245, 241, 234, 0.18)",

  /** Semantic status colours engineered to be distinct from primary brand red `#D71920`. */
  success: "#22C55E",
  successText: "#4ADE80",
  successBg: "rgba(34, 197, 94, 0.14)",
  successBorder: "rgba(34, 197, 94, 0.35)",

  warning: "#EAB308",
  warningText: "#FACC15",
  warningBg: "rgba(234, 179, 8, 0.14)",
  warningBorder: "rgba(234, 179, 8, 0.35)",

  /** Rose-coral validation error tone visually separated from primary brand red. */
  error: "#FB7185",
  errorText: "#FDA4AF",
  errorBg: "rgba(251, 113, 133, 0.14)",
  errorBorder: "rgba(251, 113, 133, 0.38)",
} as const;

/** Structured brand red scale consumed by Tailwind config, Web CSS, and Mobile Theme. */
export const SikaBrand = {
  red: SikaPalette.primaryRed,
  redRgb: SikaPalette.primaryRedRgb,
  redHover: SikaPalette.darkerRed,
  redReadable: SikaPalette.lightRed,
  redDark: SikaPalette.deepRed,
  redGradientStart: "#E52229",
  redGradientEnd: SikaPalette.darkerRed,
} as const;

/** Platform-neutral typography scale in px/dp. */
export const SikaTypography = {
  display: { fontSize: 44, lineHeight: 48, fontWeight: "800" as const, letterSpacing: -1.1 },
  h1: { fontSize: 32, lineHeight: 38, fontWeight: "800" as const, letterSpacing: -0.7 },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const, letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const, letterSpacing: -0.2 },
  cardTitle: { fontSize: 16, lineHeight: 22, fontWeight: "700" as const, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const, letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 19, fontWeight: "400" as const, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const, letterSpacing: 0.1 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: "700" as const, letterSpacing: 1.4 },
  price: { fontSize: 16, lineHeight: 20, fontWeight: "800" as const, letterSpacing: -0.2 },
} as const;

/** Consistent 4px/8px grid spacing scale. */
export const SikaSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
} as const;

/** Harmonized border-radius scale avoiding over-rounded pills on multi-line containers. */
export const SikaRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 9999,
} as const;

/** Motion duration, spring physics, and easing curve tokens. */
export const SikaMotion = {
  quick: 150,
  standard: 240,
  emphasis: 360,
  spring: { stiffness: 380, damping: 32, mass: 0.9 },
  ease: [0.16, 1, 0.3, 1] as const,
} as const;
