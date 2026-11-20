import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Unified tactile Sika mobile button with native-driver spring compression feedback.
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      damping: 22,
      stiffness: 320,
      useNativeDriver: true,
    }).start();
  };

  const containerVariant =
    variant === "primary"
      ? styles.primaryBg
      : variant === "secondary"
      ? styles.secondaryBg
      : variant === "danger"
      ? styles.dangerBg
      : styles.ghostBg;

  const textColor =
    variant === "primary"
      ? SikaColors.text
      : variant === "danger"
      ? "#FDA4AF"
      : SikaColors.warmWhite;

  const sizeStyle =
    size === "sm" ? styles.smSize : size === "lg" ? styles.lgSize : styles.mdSize;
  const fontSize = size === "sm" ? 12 : size === "lg" ? 15 : 14;

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth ? styles.fullWidth : undefined,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => !isDisabled && animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.base,
          containerVariant,
          sizeStyle,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? SikaColors.text : SikaColors.warmWhite}
          />
        ) : (
          <View style={styles.innerRow}>
            {leadingIcon ? <View style={styles.leadingWrap}>{leadingIcon}</View> : null}
            <Text style={[styles.label, { color: textColor, fontSize }]} numberOfLines={1}>
              {title}
            </Text>
            {trailingIcon ? <View style={styles.trailingWrap}>{trailingIcon}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
  },
  fullWidth: {
    width: "100%",
  },
  primaryBg: {
    backgroundColor: SikaColors.accent,
    borderColor: SikaColors.accent,
  },
  secondaryBg: {
    backgroundColor: SikaColors.elevated,
    borderColor: SikaColors.border,
  },
  ghostBg: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  dangerBg: {
    backgroundColor: SikaColors.errorBg,
    borderColor: SikaColors.errorBorder,
  },
  smSize: {
    height: 36,
    paddingHorizontal: SikaSpace.md,
    borderRadius: SikaRadius.sm,
  },
  mdSize: {
    height: 44,
    paddingHorizontal: SikaSpace.lg,
  },
  lgSize: {
    height: 50,
    paddingHorizontal: SikaSpace.xl,
    borderRadius: SikaRadius.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leadingWrap: {
    marginRight: SikaSpace.sm,
  },
  trailingWrap: {
    marginLeft: SikaSpace.sm,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
