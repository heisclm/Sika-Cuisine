import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { Badge, BadgeVariant } from "./Badge";
import { Button } from "./Button";

export interface SikaModalMetaRow {
  label: string;
  value: string;
  accent?: boolean;
}

export interface SikaModalProps {
  visible: boolean;
  icon: React.ReactNode;
  tone?: "brand" | "success" | "warning" | "error";
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  title: string;
  message: string;
  metaRows?: SikaModalMetaRow[];
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  onRequestClose?: () => void;
}

const ICON_BG: Record<"brand" | "success" | "warning" | "error", { bg: string; border: string }> = {
  brand: { bg: SikaColors.accentWash16, border: SikaColors.accentWash40 },
  success: { bg: SikaColors.successBg, border: SikaColors.successBorder },
  warning: { bg: SikaColors.warningBg, border: SikaColors.warningBorder },
  error: { bg: SikaColors.errorBg, border: SikaColors.errorBorder },
};

/**
 * Sika-branded dark modal dialog replacing native OS bright-white Alerts
 * so confirmations and status prompts stay 100% faithful to our Obsidian & Crimson UI.
 */
export function SikaModal({
  visible,
  icon,
  tone = "brand",
  badgeLabel,
  badgeVariant = "neutral",
  title,
  message,
  metaRows,
  primaryLabel,
  onPrimaryPress,
  primaryLoading = false,
  secondaryLabel,
  onSecondaryPress,
  onRequestClose,
}: SikaModalProps) {
  const iconPalette = ICON_BG[tone];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose || onSecondaryPress || onPrimaryPress}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: iconPalette.bg,
                borderColor: iconPalette.border,
              },
            ]}
          >
            {icon}
          </View>

          {badgeLabel ? (
            <View style={styles.badgeWrap}>
              <Badge label={badgeLabel} variant={badgeVariant} />
            </View>
          ) : null}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {metaRows && metaRows.length > 0 ? (
            <View style={styles.metaCard}>
              {metaRows.map((row, idx) => (
                <View
                  key={`${row.label}-${idx}`}
                  style={[
                    styles.metaRow,
                    idx < metaRows.length - 1 && styles.metaRowDivider,
                  ]}
                >
                  <Text style={styles.metaLabel}>{row.label}</Text>
                  <Text
                    style={[styles.metaValue, row.accent && styles.metaValueAccent]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={primaryLabel}
              variant="primary"
              size="lg"
              fullWidth
              loading={primaryLoading}
              onPress={onPrimaryPress}
            />
            {secondaryLabel && onSecondaryPress ? (
              <Button
                title={secondaryLabel}
                variant="secondary"
                size="md"
                fullWidth
                onPress={onSecondaryPress}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.80)",
    justifyContent: "center",
    padding: SikaSpace.lg,
  },
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.xl,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SikaSpace.md,
  },
  badgeWrap: {
    marginBottom: SikaSpace.sm,
  },
  title: {
    color: SikaColors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: SikaColors.secondaryText,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginTop: SikaSpace.sm,
  },
  metaCard: {
    width: "100%",
    marginTop: SikaSpace.lg,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: SikaSpace.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SikaSpace.md,
    paddingVertical: 10,
  },
  metaRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
  },
  metaLabel: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 0,
  },
  metaValue: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  metaValueAccent: {
    color: SikaColors.accentLight,
  },
  actions: {
    width: "100%",
    gap: SikaSpace.sm,
    marginTop: SikaSpace.lg,
  },
});
