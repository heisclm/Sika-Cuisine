import {
  SikaBrand,
  SikaPalette,
  SikaSpacing,
  SikaRadius as SharedRadius,
  SikaTypography as SharedTypography,
  SikaMotion as SharedMotion,
} from "@sika/shared";

/** Canonical Sika visual tokens shared identically with web globals & Tailwind theme. */
export const SikaColors = {
  background: SikaPalette.deepBlack,
  surface: SikaPalette.charcoal,
  elevated: SikaPalette.elevatedSurface,
  surfaceHover: SikaPalette.surfaceHover,
  accent: SikaBrand.red,
  accentHover: SikaBrand.redHover,
  accentLight: SikaBrand.redReadable,
  accentDark: SikaBrand.redDark,
  accentWash08: `rgba(${SikaBrand.redRgb}, 0.08)`,
  accentWash12: `rgba(${SikaBrand.redRgb}, 0.12)`,
  accentWash16: `rgba(${SikaBrand.redRgb}, 0.16)`,
  accentWash25: `rgba(${SikaBrand.redRgb}, 0.25)`,
  accentWash40: `rgba(${SikaBrand.redRgb}, 0.40)`,
  accentWash50: `rgba(${SikaBrand.redRgb}, 0.50)`,
  warmWhite: SikaPalette.warmWhite,
  text: SikaPalette.primaryText,
  secondaryText: SikaPalette.secondaryText,
  muted: SikaPalette.mutedText,
  border: SikaPalette.border,
  borderSubtle: SikaPalette.borderSubtle,
  success: SikaPalette.successText,
  successBg: SikaPalette.successBg,
  successBorder: SikaPalette.successBorder,
  warning: SikaPalette.warningText,
  warningBg: SikaPalette.warningBg,
  warningBorder: SikaPalette.warningBorder,
  error: SikaPalette.errorText,
  errorBg: SikaPalette.errorBg,
  errorBorder: SikaPalette.errorBorder,
} as const;

export const SikaSpace = SikaSpacing;
export const SikaRadius = SharedRadius;
export const SikaType = SharedTypography;
export const SikaMotion = SharedMotion;
