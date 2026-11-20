import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";

function usePulseOpacity() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

export function DishCardSkeleton({
  cardWidth,
  compact = true,
}: {
  cardWidth?: number;
  compact?: boolean;
}) {
  const opacity = usePulseOpacity();

  return (
    <View
      style={[
        styles.dishCard,
        compact && styles.dishCardCompact,
        cardWidth ? { width: cardWidth } : undefined,
      ]}
      accessible={false}
    >
      <Animated.View
        style={[
          styles.imageBlock,
          compact && styles.imageBlockCompact,
          { opacity },
        ]}
      />
      <View style={[styles.body, compact && styles.bodyCompact]}>
        <Animated.View style={[styles.lineShort, { opacity }]} />
        <Animated.View style={[styles.lineTitle, { opacity }]} />
        <Animated.View style={[styles.lineFull, { opacity }]} />
        <View style={[styles.footerRow, compact && styles.footerRowCompact]}>
          <Animated.View
            style={[styles.priceBlock, compact && styles.priceBlockCompact, { opacity }]}
          />
          <Animated.View
            style={[styles.btnBlock, compact && styles.btnBlockCompact, { opacity }]}
          />
        </View>
      </View>
    </View>
  );
}

export function OrderRowSkeleton() {
  const opacity = usePulseOpacity();

  return (
    <View style={styles.orderCard} accessible={false}>
      <View style={styles.orderHeader}>
        <Animated.View style={[styles.lineTitle, { width: 130, opacity }]} />
        <Animated.View style={[styles.badgeBlock, { opacity }]} />
      </View>
      <Animated.View style={[styles.lineFull, { opacity }]} />
      <View style={styles.footerRow}>
        <Animated.View style={[styles.lineShort, { opacity }]} />
        <Animated.View style={[styles.priceBlock, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dishCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    overflow: "hidden",
    marginBottom: SikaSpace.lg,
  },
  dishCardCompact: {
    borderRadius: SikaRadius.lg,
    marginBottom: 10,
  },
  imageBlock: {
    height: 170,
    width: "100%",
    backgroundColor: SikaColors.elevated,
  },
  imageBlockCompact: {
    height: 118,
  },
  body: {
    padding: SikaSpace.lg,
    gap: SikaSpace.sm,
  },
  bodyCompact: {
    padding: 10,
    gap: 6,
  },
  lineShort: {
    height: 10,
    width: 72,
    borderRadius: SikaRadius.pill,
    backgroundColor: SikaColors.elevated,
  },
  lineTitle: {
    height: 16,
    width: "80%",
    borderRadius: SikaRadius.sm,
    backgroundColor: SikaColors.elevated,
  },
  lineFull: {
    height: 12,
    width: "92%",
    borderRadius: SikaRadius.sm,
    backgroundColor: SikaColors.elevated,
  },
  footerRow: {
    marginTop: SikaSpace.sm,
    paddingTop: SikaSpace.md,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerRowCompact: {
    marginTop: 6,
    paddingTop: 8,
  },
  priceBlock: {
    height: 20,
    width: 80,
    borderRadius: SikaRadius.sm,
    backgroundColor: SikaColors.elevated,
  },
  priceBlockCompact: {
    height: 16,
    width: 58,
  },
  btnBlock: {
    height: 36,
    width: 96,
    borderRadius: SikaRadius.md,
    backgroundColor: SikaColors.elevated,
  },
  btnBlockCompact: {
    height: 30,
    width: 58,
    borderRadius: SikaRadius.sm,
  },
  orderCard: {
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    gap: SikaSpace.md,
    marginBottom: SikaSpace.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeBlock: {
    height: 22,
    width: 88,
    borderRadius: SikaRadius.pill,
    backgroundColor: SikaColors.elevated,
  },
});
