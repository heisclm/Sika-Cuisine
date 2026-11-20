import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";

export type BadgeVariant = "brand" | "neutral" | "success" | "warning" | "error";

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_MAP: Record<
  BadgeVariant,
  { bg: string; border: string; text: string }
> = {
  brand: {
    bg: SikaColors.accentWash16,
    border: SikaColors.accentWash40,
    text: SikaColors.accentLight,
  },
  neutral: {
    bg: SikaColors.elevated,
    border: SikaColors.border,
    text: SikaColors.secondaryText,
  },
  success: {
    bg: SikaColors.successBg,
    border: SikaColors.successBorder,
    text: SikaColors.success,
  },
  warning: {
    bg: SikaColors.warningBg,
    border: SikaColors.warningBorder,
    text: SikaColors.warning,
  },
  error: {
    bg: SikaColors.errorBg,
    border: SikaColors.errorBorder,
    text: SikaColors.error,
  },
};

export function Badge({ label, variant = "neutral", icon, style }: BadgeProps) {
  const palette = VARIANT_MAP[variant];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    paddingHorizontal: SikaSpace.sm + 2,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
