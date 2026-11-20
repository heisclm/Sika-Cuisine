import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load content",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <AlertCircle size={24} color={SikaColors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.retryWrap}>
          <Button
            title="Try Again"
            onPress={onRetry}
            variant="secondary"
            size="sm"
            leadingIcon={<RefreshCw size={14} color={SikaColors.warmWhite} />}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.xl,
    paddingVertical: SikaSpace.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: SikaRadius.md,
    backgroundColor: SikaColors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SikaSpace.md,
  },
  title: {
    color: SikaColors.warmWhite,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: SikaSpace.xs + 2,
    maxWidth: 300,
  },
  retryWrap: {
    marginTop: SikaSpace.lg,
  },
});
