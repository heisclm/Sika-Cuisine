import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface OfflineBannerProps {
  isOffline: boolean;
  lastSynchronizedAt?: string | null;
}

export function OfflineBanner({ isOffline, lastSynchronizedAt }: OfflineBannerProps) {
  if (!isOffline && !lastSynchronizedAt) {
    return null;
  }

  const formattedTime = lastSynchronizedAt
    ? new Date(lastSynchronizedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.pulseDot} />
      <Text style={styles.bannerText}>
        {isOffline
          ? `Offline Mode — Viewing cached data${formattedTime ? ` from ${formattedTime}` : ""}. Live updates paused.`
          : `Cached Data — Last synced at ${formattedTime || "recently"}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: "rgba(180, 83, 9, 0.95)", // Amber-700
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fef3c7",
    marginRight: 8,
  },
  bannerText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
