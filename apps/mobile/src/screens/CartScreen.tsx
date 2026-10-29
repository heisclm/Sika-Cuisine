import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { formatPesewasToGhs } from "@sika/shared";
import { useCart, CartItem } from "../context/CartContext";

interface CartScreenProps {
  onNavigateToMenu: () => void;
  onNavigateToCheckout: () => void;
}

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

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all dishes from your order?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: clearCart },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIconText}>🛍️</Text>
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          You haven't selected any dishes yet. Discover Sika Cuisine's authentic
          Ghanaian delicacies, chef combos, and stone-baked pizzas.
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={onNavigateToMenu}
          activeOpacity={0.85}
        >
          <Text style={styles.browseButtonText}>Browse Sika Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Your Cart</Text>
            <Text style={styles.headerSubtitle}>
              {totalItemCount} {totalItemCount === 1 ? "portion" : "portions"} selected
            </Text>
          </View>
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearCartText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Item Cards */}
        <View style={styles.itemList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.menuItem.name}</Text>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <View style={styles.optionsWrap}>
                      {item.selectedOptions.map((opt) => (
                        <Text key={opt.optionId} style={styles.optionTag}>
                          • {opt.optionName}
                          {opt.priceDeltaPesewas > 0
                            ? ` (+${formatPesewasToGhs(opt.priceDeltaPesewas)})`
                            : ""}
                        </Text>
                      ))}
                    </View>
                  )}
                  {item.specialInstructions && (
                    <Text style={styles.specialInstructionsText}>
                      Note: "{item.specialInstructions}"
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={styles.deleteButton}
                  accessibilityLabel="Remove dish"
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Price & Quantity Controls */}
              <View style={styles.itemCardFooter}>
                <View>
                  <Text style={styles.pricePerItemText}>
                    {formatPesewasToGhs(item.unitPricePesewas)} each
                  </Text>
                  <Text style={styles.lineSubtotalText}>
                    {formatPesewasToGhs(item.subtotalPesewas)}
                  </Text>
                </View>

                <View style={styles.counterControl}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    style={styles.counterButton}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.quantityDisplay}>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    style={styles.counterButton}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Summary Breakdown */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>COST BREAKDOWN</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dishes Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatPesewasToGhs(cartSubtotalPesewas)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryNote}>Calculated at checkout</Text>
          </View>

          <View style={styles.pickupHighlight}>
            <Text style={styles.pickupHighlightText}>
              💡 Tip: Pickup & Takeaway orders always enjoy GH₵ 0.00 delivery fee.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.footerAction}>
        <View style={styles.footerTotalRow}>
          <Text style={styles.footerTotalLabel}>ORDER SUB-TOTAL</Text>
          <Text style={styles.footerTotalValue}>
            {formatPesewasToGhs(cartSubtotalPesewas)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onNavigateToCheckout}
          style={styles.checkoutButton}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0e12",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  clearCartText: {
    color: "#e11d48",
    fontSize: 13,
    fontWeight: "600",
  },
  itemList: {
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: "#161720",
    borderRadius: 20,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    padding: 16,
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  optionsWrap: {
    gap: 2,
    marginBottom: 4,
  },
  optionTag: {
    color: "#d1d5db",
    fontSize: 12,
  },
  specialInstructionsText: {
    color: "#e11d48",
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 2,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  itemCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  pricePerItemText: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "500",
  },
  lineSubtotalText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  counterControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1b24",
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#252733",
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  quantityDisplay: {
    paddingHorizontal: 12,
  },
  quantityText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: "#161720",
    borderRadius: 20,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    color: "#d1d5db",
    fontSize: 13,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  summaryNote: {
    color: "#9ca3af",
    fontSize: 12,
    fontStyle: "italic",
  },
  pickupHighlight: {
    backgroundColor: "rgba(225, 29, 72, 0.08)",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#e11d48",
  },
  pickupHighlightText: {
    color: "#fca5a5",
    fontSize: 12,
    lineHeight: 16,
  },
  footerAction: {
    backgroundColor: "#12141a",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  footerTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  footerTotalLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  footerTotalValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  checkoutButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#161720",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  browseButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
