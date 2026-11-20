import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Cloud, WifiOff } from "lucide-react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface OfflineBannerProps {
  isOffline: boolean;
  lastSynchronizedAt?: string | null;
}

/**
 * Displays connection and cache staleness status transparently without fabricating live updates.
 */
export function OfflineBanner({ isOffline, lastSynchronizedAt }: OfflineBannerProps) {
  if (!isOffline && !lastSynchronizedAt) {
    return null;
  }

  const formattedTime = lastSynchronizedAt
    ? new Date(lastSynchronizedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <View style={[styles.banner, isOffline ? styles.offlineBanner : styles.cachedBanner]}>
      {isOffline ? (
        <WifiOff size={15} color={SikaColors.warning} style={styles.icon} />
      ) : (
        <Cloud size={15} color={SikaColors.success} style={styles.icon} />
      )}
      <Text
        style={[
          styles.bannerText,
          { color: isOffline ? SikaColors.warning : SikaColors.warmWhite },
        ]}
        numberOfLines={2}
      >
        {isOffline
          ? `Offline Mode — Viewing cached data${
              formattedTime ? ` from ${formattedTime}` : ""
            }. Live updates paused.`
          : `Synced with Sunyani kitchen at ${formattedTime || "recently"}`}
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
  cachedBanner: {
    backgroundColor: SikaColors.surface,
    borderBottomColor: SikaColors.border,
  },
  icon: {
    marginRight: SikaSpace.sm,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
    borderRadius: SikaRadius.sm,
  },
});
