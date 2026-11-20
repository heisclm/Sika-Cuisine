import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { UtensilsCrossed } from "lucide-react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        {icon || <UtensilsCrossed size={24} color={SikaColors.accentLight} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <Button title={actionLabel} onPress={onAction} variant="primary" size="md" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.xl,
    paddingVertical: SikaSpace.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SikaSpace.lg,
  },
  title: {
    color: SikaColors.warmWhite,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: SikaSpace.sm,
    maxWidth: 300,
  },
  actionWrap: {
    marginTop: SikaSpace.xl,
  },
});
