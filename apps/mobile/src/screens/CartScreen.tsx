import React from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowRight,
  Minus,
  Plus,
  Trash2,
} from "lucide-react-native";
import { RestaurantClocheIcon } from "../components/icons/RestaurantClocheIcon";
import { formatPesewasToGhs } from "@sika/shared";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
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
    cartSubtotalPesewas,
    totalItemCount,
  } = useCart();
  const { info } = useToast();

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all dishes from your tray?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearCart();
            info("Tray Cleared", "All dishes removed from your order.");
          },
        },
      ]
    );
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
          <View>
            <Text style={styles.headerTitle}>Your Tray</Text>
            <Text style={styles.headerSubtitle}>
              {totalItemCount} {totalItemCount === 1 ? "portion" : "portions"} ready
            </Text>
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

        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.topRow}>
                <Image
                  source={resolveDishImageSource(item.menuItem.imageUrl)}
                  style={styles.thumb}
                  resizeMode="cover"
                />

                <View style={styles.infoCol}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.menuItem.name}
                    </Text>
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
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity of ${item.menuItem.name}`}
                    style={styles.stepBtn}
                  >
                    <Plus size={14} color={SikaColors.warmWhite} />
                  </Pressable>
                </View>

                <Text style={styles.lineTotal}>
                  {formatPesewasToGhs(item.subtotalPesewas)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Checkout Summary */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Food Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatPesewasToGhs(cartSubtotalPesewas)}
          </Text>
        </View>
        <Text style={styles.feeHint}>
          Delivery zone fees or free pickup are finalized on the next step.
        </Text>

        <Button
          title="Proceed to Checkout"
          variant="primary"
          size="lg"
          fullWidth
          trailingIcon={<ArrowRight size={17} color={SikaColors.text} />}
          onPress={onNavigateToCheckout}
        />
      </View>
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
    marginBottom: SikaSpace.lg,
  },
  headerTitle: {
    color: SikaColors.text,
    fontSize: 22,
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
  itemCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.md,
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
    paddingBottom: SikaSpace.xl,
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
