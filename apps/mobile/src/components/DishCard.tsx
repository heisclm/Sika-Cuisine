import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Flame, Minus, Plus, SlidersHorizontal } from "lucide-react-native";
import { MenuItemDTO, formatPesewasToGhs } from "@sika/shared";
import { useCart } from "../context/CartContext";
import { MOBILE_IMAGE_ASSETS, resolveDishImageSource } from "../data/dish-images";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { triggerLightHaptic } from "../utils/haptics";
import { Badge } from "./ui/Badge";

export type EnrichedMenuItem = MenuItemDTO & {
  category?: { id: string; name: string; slug: string };
  categoryName?: string;
};

interface DishCardProps {
  dish: EnrichedMenuItem;
  categoryLabel?: string;
  cardWidth?: number;
  compact?: boolean;
  onPress: (dish: EnrichedMenuItem) => void;
  onQuickAdd: (dish: EnrichedMenuItem) => void;
}

const SPICE_NAMES = ["No Spice", "Mild", "Medium", "Hot", "Fiery"];

/**
 * Photographic Sika menu card supporting both compact 2-column mobile grid tiles
 * and full-width featured layout with tactile spring press feedback.
 */
export function DishCard({
  dish,
  categoryLabel,
  cardWidth,
  compact = true,
  onPress,
  onQuickAdd,
}: DishCardProps) {
  const { items, updateQuantity } = useCart();
  const scale = useRef(new Animated.Value(1)).current;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [dish.imageUrl]);
  const hasOptions = Boolean(dish.optionGroups && dish.optionGroups.length > 0);
  const spiceLabel =
    dish.spiceLevel > 0 ? SPICE_NAMES[Math.min(dish.spiceLevel, 4)] : null;

  const simpleCartItem = !hasOptions
    ? items.find(
        (i) =>
          i.menuItem.id === dish.id &&
          i.selectedOptions.length === 0 &&
          !i.specialInstructions
      )
    : undefined;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      damping: 22,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        compact ? styles.wrapperCompact : styles.wrapper,
        cardWidth ? { width: cardWidth } : undefined,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPress={() => onPress(dish)}
        onPressIn={() => animateScale(0.985)}
        onPressOut={() => animateScale(1)}
        accessibilityRole="button"
        accessibilityLabel={`${dish.name}, ${formatPesewasToGhs(dish.basePricePesewas)}`}
        style={[
          styles.card,
          compact && styles.cardCompact,
          !dish.isAvailable && styles.cardDimmed,
        ]}
      >
        <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
          <Image
            source={
              imgFailed
                ? MOBILE_IMAGE_ASSETS.heroPlate
                : resolveDishImageSource(dish.imageUrl)
            }
            onError={() => setImgFailed(true)}
            style={[styles.image, !dish.isAvailable && styles.imageSoldOut]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(16,16,16,0.12)", "rgba(16,16,16,0.35)", "rgba(16,16,16,0.92)"]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Badges */}
          <View style={[styles.topBadgeRow, compact && styles.topBadgeRowCompact]}>
            {!dish.isAvailable ? (
              <Badge label="Sold Out" variant="error" />
            ) : dish.isFeatured ? (
              <Badge label={compact ? "Top" : "Signature"} variant="brand" />
            ) : null}
          </View>

          {/* Bottom Scrim Overlay Meta */}
          <View style={[styles.imageFooterRow, compact && styles.imageFooterRowCompact]}>
            {!compact && categoryLabel ? (
              <Text style={styles.categoryEyebrow}>{categoryLabel}</Text>
            ) : spiceLabel ? (
              <View style={styles.spicePillCompact}>
                <Flame size={10} color={SikaColors.accentLight} />
                <Text style={styles.spicePillText}>{spiceLabel}</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={[styles.prepPill, compact && styles.prepPillCompact]}>
              <Clock size={compact ? 10 : 12} color={SikaColors.warmWhite} />
              <Text style={[styles.prepText, compact && styles.prepTextCompact]}>
                {dish.preparationTimeMinutes}m
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View>
            {!compact ? (
              <View style={styles.metaTopRow}>
                <Text style={styles.categoryLine} numberOfLines={1}>
                  {categoryLabel || "Sika Kitchen"}
                </Text>
                {spiceLabel ? (
                  <View style={styles.spiceRowInline}>
                    <Flame size={12} color={SikaColors.accentLight} />
                    <Text style={styles.spiceText}>{spiceLabel}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Text
              style={[styles.title, compact && styles.titleCompact]}
              numberOfLines={2}
            >
              {dish.name}
            </Text>
            <Text
              style={[styles.description, compact && styles.descriptionCompact]}
              numberOfLines={compact ? 1 : 2}
            >
              {dish.description}
            </Text>
          </View>

          <View style={[styles.footerRow, compact && styles.footerRowCompact]}>
            <Text
              style={[styles.price, compact && styles.priceCompact]}
              numberOfLines={1}
            >
              {formatPesewasToGhs(dish.basePricePesewas)}
            </Text>

            {dish.isAvailable && !hasOptions && simpleCartItem ? (
              <View style={[styles.stepperPill, compact && styles.stepperPillCompact]}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    triggerLightHaptic();
                    updateQuantity(simpleCartItem.id, simpleCartItem.quantity - 1);
                  }}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease quantity of ${dish.name}`}
                  style={[styles.stepperSide, compact && styles.stepperSideCompact]}
                >
                  <Minus size={compact ? 11 : 13} color={SikaColors.text} />
                </Pressable>
                <Text style={[styles.stepperCount, compact && styles.stepperCountCompact]}>
                  {simpleCartItem.quantity}
                </Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    triggerLightHaptic();
                    updateQuantity(simpleCartItem.id, simpleCartItem.quantity + 1);
                  }}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase quantity of ${dish.name}`}
                  style={[styles.stepperSide, compact && styles.stepperSideCompact]}
                >
                  <Plus size={compact ? 11 : 13} color={SikaColors.text} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  triggerLightHaptic();
                  if (!dish.isAvailable) {
                    onPress(dish);
                    return;
                  }
                  if (hasOptions) {
                    onPress(dish);
                  } else {
                    onQuickAdd(dish);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  !dish.isAvailable
                    ? `${dish.name} unavailable`
                    : hasOptions
                    ? `Customize ${dish.name}`
                    : `Add ${dish.name} to cart`
                }
                style={[
                  styles.actionBtn,
                  compact && styles.actionBtnCompact,
                  !dish.isAvailable && styles.actionBtnDisabled,
                ]}
              >
                {!dish.isAvailable ? (
                  <Text style={styles.actionBtnDisabledText}>
                    {compact ? "Out" : "Sold Out"}
                  </Text>
                ) : hasOptions ? (
                  <>
                    <SlidersHorizontal size={compact ? 12 : 14} color={SikaColors.text} />
                    <Text style={[styles.actionBtnText, compact && styles.actionBtnTextCompact]}>
                      Select
                    </Text>
                  </>
                ) : (
                  <>
                    <Plus size={compact ? 13 : 15} color={SikaColors.text} />
                    <Text style={[styles.actionBtnText, compact && styles.actionBtnTextCompact]}>
                      Add
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SikaSpace.lg,
  },
  wrapperCompact: {
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: SikaColors.surface,
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
    overflow: "hidden",
  },
  cardCompact: {
    borderRadius: SikaRadius.lg,
  },
  cardDimmed: {
    borderColor: SikaColors.borderSubtle,
  },
  imageContainer: {
    height: 194,
    width: "100%",
    backgroundColor: SikaColors.elevated,
  },
  imageContainerCompact: {
    height: 132,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageSoldOut: {
    opacity: 0.45,
  },
  topBadgeRow: {
    position: "absolute",
    top: SikaSpace.md,
    left: SikaSpace.md,
    flexDirection: "row",
    gap: SikaSpace.sm,
  },
  topBadgeRowCompact: {
    top: SikaSpace.xs,
    left: SikaSpace.xs,
  },
  imageFooterRow: {
    position: "absolute",
    bottom: SikaSpace.md,
    left: SikaSpace.md,
    right: SikaSpace.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageFooterRowCompact: {
    bottom: SikaSpace.xs,
    left: SikaSpace.xs,
    right: SikaSpace.xs,
  },
  categoryEyebrow: {
    color: SikaColors.warmWhite,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  prepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(28, 28, 28, 0.88)",
    borderWidth: 1,
    borderColor: SikaColors.border,
    paddingHorizontal: SikaSpace.sm + 2,
    paddingVertical: 4,
    borderRadius: SikaRadius.pill,
  },
  prepPillCompact: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  prepText: {
    color: SikaColors.warmWhite,
    fontSize: 11,
    fontWeight: "700",
  },
  prepTextCompact: {
    fontSize: 10,
  },
  spicePillCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(28, 28, 28, 0.88)",
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: SikaRadius.pill,
  },
  spicePillText: {
    color: SikaColors.warmWhite,
    fontSize: 9.5,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: SikaSpace.lg,
  },
  contentCompact: {
    padding: 12,
  },
  metaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 3,
  },
  categoryLine: {
    flex: 1,
    color: SikaColors.accentLight,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  categoryLineCompact: {
    fontSize: 9.5,
    letterSpacing: 0.7,
  },
  spiceRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  title: {
    color: SikaColors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 13.5,
    lineHeight: 17,
  },
  description: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: SikaSpace.xs + 2,
  },
  descriptionCompact: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  footerRow: {
    marginTop: SikaSpace.lg,
    paddingTop: SikaSpace.md,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  footerRowCompact: {
    marginTop: 10,
    paddingTop: 8,
  },
  price: {
    color: SikaColors.accentLight,
    fontSize: 17,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  priceCompact: {
    fontSize: 13.5,
    flexShrink: 1,
  },
  spiceText: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "600",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SikaColors.accent,
    paddingHorizontal: SikaSpace.lg,
    paddingVertical: 10,
    borderRadius: SikaRadius.md,
  },
  actionBtnCompact: {
    height: 30,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: SikaRadius.sm,
    gap: 4,
  },
  actionBtnDisabled: {
    backgroundColor: SikaColors.elevated,
    borderWidth: 1,
    borderColor: SikaColors.border,
  },
  actionBtnText: {
    color: SikaColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtnTextCompact: {
    fontSize: 11,
  },
  actionBtnDisabledText: {
    color: SikaColors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  stepperPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SikaColors.accent,
    borderRadius: SikaRadius.md,
    height: 36,
    overflow: "hidden",
  },
  stepperPillCompact: {
    height: 30,
    borderRadius: SikaRadius.sm,
  },
  stepperSide: {
    paddingHorizontal: 10,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperSideCompact: {
    paddingHorizontal: 8,
  },
  stepperCount: {
    color: SikaColors.text,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 18,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  stepperCountCompact: {
    fontSize: 11.5,
    minWidth: 16,
  },
});
