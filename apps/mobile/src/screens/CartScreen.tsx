import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
} from "lucide-react-native";
import { RestaurantClocheIcon } from "../components/icons/RestaurantClocheIcon";
import { formatPesewasToGhs } from "@sika/shared";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SikaModal } from "../components/ui/SikaModal";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { resolveDishImageSource } from "../data/dish-images";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface CartScreenProps {
  onNavigateToMenu: () => void;
  onNavigateToCheckout: () => void;
}

/**
 * Customer order tray screen supporting portion updates, thumbnail previews,
 * customization summaries, and confirmation before clearing all items.
 */
export function CartScreen({
  onNavigateToMenu,
  onNavigateToCheckout,
}: CartScreenProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    unavailableMenuItemIds,
    unavailableCount,
    refreshCartAvailability,
    removeUnavailableItems,
    cartSubtotalPesewas,
    totalItemCount,
  } = useCart();
  const { info } = useToast();
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const totalPopScale = useRef(new Animated.Value(1)).current;
  const prevSubtotalRef = useRef(cartSubtotalPesewas);

  useEffect(() => {
    if (items.length > 0) {
      void refreshCartAvailability();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (prevSubtotalRef.current !== cartSubtotalPesewas) {
      totalPopScale.setValue(0.92);
      Animated.spring(totalPopScale, {
        toValue: 1,
        damping: 14,
        stiffness: 320,
        useNativeDriver: true,
      }).start();
      prevSubtotalRef.current = cartSubtotalPesewas;
    }
  }, [cartSubtotalPesewas, totalPopScale]);

  const handleClearCart = () => {
    setClearModalVisible(true);
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          icon={<RestaurantClocheIcon size={28} color={SikaColors.accentLight} />}
          title="Your tray is empty"
          description="Select freshly grilled tilapia, jollof combinations, swallows, or pizza from the Sika Cuisine Sunyani menu."
          actionLabel="Browse Sika Menu"
          onAction={onNavigateToMenu}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={onNavigateToMenu}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back to menu"
              style={({ pressed }) => [
                styles.backPill,
                pressed && { opacity: 0.8 },
              ]}
            >
              <ArrowLeft size={14} color={SikaColors.warmWhite} />
              <Text style={styles.backPillText}>Menu</Text>
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Your Tray</Text>
              <Text style={styles.headerSubtitle}>
                {totalItemCount} {totalItemCount === 1 ? "portion" : "portions"} ready
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleClearCart}
            accessibilityRole="button"
            accessibilityLabel="Clear all items from tray"
            style={styles.clearBtn}
          >
            <Trash2 size={14} color={SikaColors.error} />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </Pressable>
        </View>

        {unavailableCount > 0 ? (
          <View style={styles.soldOutBanner}>
            <View style={styles.soldOutBannerTop}>
              <AlertCircle size={16} color={SikaColors.error} />
              <Text style={styles.soldOutBannerText}>
                {unavailableCount === 1
                  ? "1 dish in your tray is currently sold out."
                  : `${unavailableCount} dishes in your tray are no longer available.`}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                removeUnavailableItems();
                info("Tray Updated", "Sold-out dishes were removed from your tray.");
              }}
              style={({ pressed }) => [
                styles.removeSoldOutBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Trash2 size={13} color="#FDA4AF" />
              <Text style={styles.removeSoldOutText}>Remove Unavailable</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.itemsList}>
          {items.map((item) => {
            const unavailableReason = unavailableMenuItemIds[item.menuItem.id];
            const isUnavailable = Boolean(unavailableReason);
            return (
            <View
              key={item.id}
              style={[styles.itemCard, isUnavailable && styles.itemCardSoldOut]}
            >
              <View style={styles.topRow}>
                <Image
                  source={resolveDishImageSource(item.menuItem.imageUrl)}
                  style={[styles.thumb, isUnavailable && { opacity: 0.45 }]}
                  resizeMode="cover"
                />

                <View style={styles.infoCol}>
                  <View style={styles.titleRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.menuItem.name}
                      </Text>
                      {isUnavailable ? (
                        <View style={styles.soldOutPill}>
                          <Text style={styles.soldOutPillText}>
                            {unavailableReason === "REMOVED"
                              ? "NO LONGER ON MENU"
                              : "SOLD OUT"}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => removeItem(item.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.menuItem.name}`}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={15} color={SikaColors.secondaryText} />
                    </Pressable>
                  </View>

                  {item.selectedOptions?.length ? (
                    <Text style={styles.optionsText} numberOfLines={2}>
                      {item.selectedOptions
                        .map((opt) =>
                          opt.priceDeltaPesewas > 0
                            ? `${opt.optionName} (+${formatPesewasToGhs(
                                opt.priceDeltaPesewas
                              )})`
                            : opt.optionName
                        )
                        .join(" \u2022 ")}
                    </Text>
                  ) : null}

                  {item.specialInstructions ? (
                    <Text style={styles.notesText} numberOfLines={2}>
                      Note: &ldquo;{item.specialInstructions}&rdquo;
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.bottomRow}>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease quantity of ${item.menuItem.name}`}
                    style={styles.stepBtn}
                  >
                    <Minus size={14} color={SikaColors.warmWhite} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable
                    disabled={isUnavailable}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity of ${item.menuItem.name}`}
                    style={[styles.stepBtn, isUnavailable && { opacity: 0.35 }]}
                  >
                    <Plus size={14} color={SikaColors.warmWhite} />
                  </Pressable>
                </View>

                <Text style={styles.lineTotal}>
                  {formatPesewasToGhs(item.subtotalPesewas)}
                </Text>
              </View>
            </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Checkout Summary */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Food Subtotal</Text>
          <Animated.Text
            style={[
              styles.summaryValue,
              { transform: [{ scale: totalPopScale }] },
            ]}
          >
            {formatPesewasToGhs(cartSubtotalPesewas)}
          </Animated.Text>
        </View>
        <Text style={styles.feeHint}>
          Delivery zone fees or free pickup are finalized on the next step.
        </Text>

        <Button
          title={
            unavailableCount > 0
              ? "Remove Sold-Out Items to Checkout"
              : "Proceed to Checkout"
          }
          variant="primary"
          size="lg"
          fullWidth
          disabled={unavailableCount > 0}
          trailingIcon={
            unavailableCount > 0 ? undefined : (
              <ArrowRight size={17} color={SikaColors.text} />
            )
          }
          onPress={onNavigateToCheckout}
        />
      </View>

      {/* Branded Dark Clear Tray Confirmation Modal */}
      <SikaModal
        visible={clearModalVisible}
        tone="error"
        icon={<Trash2 size={24} color={SikaColors.error} />}
        badgeLabel="Clear Order Tray"
        badgeVariant="error"
        title="Remove All Dishes?"
        message="Are you sure you want to remove all dishes from your tray? You can always add them back from the Sika Cuisine menu."
        metaRows={[
          {
            label: "Portions in Tray",
            value: `${totalItemCount} ${totalItemCount === 1 ? "portion" : "portions"}`,
          },
          {
            label: "Food Subtotal",
            value: formatPesewasToGhs(cartSubtotalPesewas),
            accent: true,
          },
        ]}
        primaryLabel="Clear All Dishes"
        onPrimaryPress={() => {
          setClearModalVisible(false);
          clearCart();
          info("Tray Cleared", "All dishes removed from your order.");
        }}
        secondaryLabel="Keep My Tray"
        onSecondaryPress={() => setClearModalVisible(false)}
        onRequestClose={() => setClearModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: SikaColors.background,
    padding: SikaSpace.xl,
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SikaSpace.lg,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SikaSpace.sm,
    marginBottom: SikaSpace.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.md,
    flex: 1,
    minWidth: 0,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  backPillText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  headerTitle: {
    color: SikaColors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: SikaSpace.xs + 2,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
  },
  clearBtnText: {
    color: SikaColors.error,
    fontSize: 12,
    fontWeight: "700",
  },
  itemsList: {
    gap: SikaSpace.md,
  },
  soldOutBanner: {
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
    padding: SikaSpace.md,
    gap: 10,
    marginBottom: SikaSpace.md,
  },
  soldOutBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  soldOutBannerText: {
    flex: 1,
    color: "#FDA4AF",
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 17,
  },
  removeSoldOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: "rgba(251, 113, 133, 0.14)",
    paddingVertical: 8,
  },
  removeSoldOutText: {
    color: "#FDA4AF",
    fontSize: 12,
    fontWeight: "800",
  },
  itemCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.md,
  },
  itemCardSoldOut: {
    borderColor: SikaColors.errorBorder,
    opacity: 0.78,
  },
  soldOutPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soldOutPillText: {
    color: "#FDA4AF",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  topRow: {
    flexDirection: "row",
    gap: SikaSpace.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: SikaRadius.md,
    backgroundColor: SikaColors.elevated,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SikaSpace.sm,
  },
  itemName: {
    flex: 1,
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  deleteBtn: {
    padding: 4,
  },
  optionsText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  notesText: {
    color: SikaColors.muted,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 4,
  },
  bottomRow: {
    marginTop: SikaSpace.md,
    paddingTop: SikaSpace.md,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    height: 36,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    color: SikaColors.text,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 26,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  lineTotal: {
    color: SikaColors.accentLight,
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.xl,
    paddingTop: SikaSpace.lg,
    paddingBottom: 94,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    color: SikaColors.secondaryText,
    fontSize: 14,
    fontWeight: "600",
  },
  summaryValue: {
    color: SikaColors.text,
    fontSize: 19,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  feeHint: {
    color: SikaColors.muted,
    fontSize: 12,
    marginBottom: SikaSpace.lg,
  },
});
