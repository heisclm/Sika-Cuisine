# Sika Cuisine Design System

## 1. Visual Philosophy
Sika Cuisine combines modern editorial hospitality with high-contrast usability on dark charcoal planes. Food photography leads every surface while crimson red (`#D71920`) highlights decisive ordering actions, active navigation, and pricing. Web (`Next.js + Tailwind`) and native Mobile (`React Native + Expo`) consume the exact same source tokens from `packages/shared/src/design-tokens.ts` and navigation definitions from `packages/shared/src/navigation.ts`.

## 2. Official Colour Tokens
| Token | Hex / Value | Role |
| :--- | :--- | :--- |
| `primaryRed` | `#D71920` | Primary buttons, active tab indicators, floating cart triggers |
| `darkerRed` | `#A91017` | Hover / pressed state on primary red buttons |
| `lightRed` | `#F0444A` | Small uppercase labels, inline accents, and prices on dark surfaces (WCAG AA readable) |
| `deepBlack` | `#101010` | Primary canvas / viewport background |
| `charcoal` | `#1C1C1C` | Cards, drawers, modals, headers, bottom tabs |
| `elevatedSurface` | `#262626` | Nested panels, inputs, chips, skeleton tracks |
| `warmWhite` | `#F5F1EA` | Editorial display headlines and highlighted warm foreground ink |
| `primaryText` | `#FFFFFF` | High-contrast titles and primary button text |
| `secondaryText` | `#A3A3A3` | Descriptions, labels, and metadata |
| `mutedText` | `#737373` | Secondary hints and timestamps |
| `border` | `#333333` | Subtle 1px separation between charcoal surfaces |
| `success` | `#22C55E` (`#4ADE80` text) | Delivered / paid / open kitchen confirmation |
| `warning` | `#EAB308` (`#FACC15` text) | Offline stale cache banner / pending payment alert |
| `error` | `#FB7185` (`#FDA4AF` text) | Form validation errors & rejection alerts (distinct from brand red) |

## 3. Typography
- **Web Font Stack**: Self-hosted local fonts in `apps/web/src/app/fonts.ts`:
  - `font-serif`: **Fraunces Variable** for editorial headlines and dish titles.
  - `font-sans`: **Plus Jakarta Sans Variable** for UI controls, body copy, and tabular numerals (`font-variant-numeric: tabular-nums`).
  - `font-display`: **Syne Variable** for uppercase ticker accents.
- **Mobile Type Scale** (`SikaTypography` in `@sika/shared`):
  - `display` (44/48), `h1` (32/38), `h2` (24/30), `h3` (18/24), `cardTitle` (16/22), `body` (15/22), `bodySmall` (13/19), `caption` (12/16), `label` (11/14 uppercase tracked), `price` (16/20 bold).

## 4. Spacing & Radius Scale
- **Spacing** (`SikaSpacing`): `xxs: 4`, `xs: 8`, `sm: 12`, `md: 16`, `lg: 24`, `xl: 32`, `xxl: 48`, `section: 64`.
- **Radii** (`SikaRadius`): `xs: 6`, `sm: 10`, `md: 14`, `lg: 18`, `xl: 24`, `pill: 9999`. Multi-line cards consistently use `lg`/`xl` (`18–24px`); buttons and filter chips use `md` or `pill`.

## 5. Iconography
- **Lucide Icons Everywhere**: `lucide-react` on Web and `lucide-react-native` on Mobile (`1.75–2px` stroke, aligned sizing `16px–22px`, accessible labels on all icon-only buttons). No raw emojis or unicode dingbats for UI controls.

## 6. Motion & Accessibility Principles
- Duration tokens (`SikaMotion`): `quick: 150ms`, `standard: 240ms`, `emphasis: 360ms`, curve `[0.16, 1, 0.3, 1]`.
- Web motion wraps the tree in `<MotionConfig reducedMotion="user">` and obeys `@media (prefers-reduced-motion: reduce)`.
- Interactive drawers and dialogs lock background scroll, trap keyboard focus, dismiss on `Escape`, and restore focus to the triggering element on close.
