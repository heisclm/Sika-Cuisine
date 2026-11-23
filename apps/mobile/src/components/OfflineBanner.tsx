import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface OfflineBannerProps {
  isOffline: boolean;
  lastSynchronizedAt?: string | null;
}

/**
 * Global shell-level connectivity alert.
 * Remains hidden during normal online operation (following standard mobile UX),
 * and surfaces once beneath the header only when offline / connection drops.
 */
export function OfflineBanner({
  isOffline,
  lastSynchronizedAt,
}: OfflineBannerProps) {
  if (!isOffline) {
    return null;
  }

  const formattedTime = lastSynchronizedAt
    ? new Date(lastSynchronizedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <View style={[styles.banner, styles.offlineBanner]} accessibilityRole="alert">
      <WifiOff size={15} color={SikaColors.warning} style={styles.icon} />
      <Text style={styles.bannerText} numberOfLines={2}>
        Offline Mode — Viewing cached data
        {formattedTime ? ` from ${formattedTime}` : ""}. Reconnecting automatically…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SikaSpace.sm,
    paddingHorizontal: SikaSpace.lg,
    borderBottomWidth: 1,
  },
  offlineBanner: {
    backgroundColor: SikaColors.warningBg,
    borderBottomColor: SikaColors.warningBorder,
  },
  icon: {
    marginRight: SikaSpace.sm,
  },
  bannerText: {
    color: SikaColors.warning,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
    borderRadius: SikaRadius.sm,
  },
});
