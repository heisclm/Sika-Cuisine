import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { MenuItemDTO, formatPesewasToGhs } from "@sika/shared";

interface DishCardProps {
  item: MenuItemDTO;
  onPress: (item: MenuItemDTO) => void;
}

export function DishCard({ item, onPress }: DishCardProps) {
  const isAvailable = item.isAvailable;

  return (
    <TouchableOpacity
      activeOpacity={isAvailable ? 0.85 : 1}
      onPress={() => isAvailable && onPress(item)}
      style={[styles.card, !isAvailable && styles.cardDisabled]}
    >
      <View style={styles.cardHeader}>
        {/* Availability / Tag */}
        <View style={styles.tagRow}>
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>CHEF SPECIAL</Text>
            </View>
          )}
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{item.preparationTimeMinutes} MIN</Text>
          </View>
          {!isAvailable && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutBadgeText}>SOLD OUT</Text>
            </View>
          )}
        </View>

        {/* Dish Name */}
        <Text style={styles.dishName} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Description */}
        <Text style={styles.dishDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      {/* Footer: Price & Add Button */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.priceLabel}>PRICE</Text>
          <Text style={styles.priceValue}>
            {formatPesewasToGhs(item.basePricePesewas)}
          </Text>
        </View>

        <TouchableOpacity
          disabled={!isAvailable}
          onPress={() => onPress(item)}
          style={[styles.addButton, !isAvailable && styles.addButtonDisabled]}
        >
          <Text style={styles.addButtonText}>
            {isAvailable ? "+ Add to Cart" : "Unavailable"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#161720",
    borderRadius: 24,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardHeader: {
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  featuredBadge: {
    backgroundColor: "rgba(225, 29, 72, 0.15)",
    borderColor: "rgba(225, 29, 72, 0.4)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredBadgeText: {
    color: "#e11d48",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeBadgeText: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "600",
  },
  soldOutBadge: {
    backgroundColor: "rgba(185, 28, 28, 0.2)",
    borderColor: "rgba(220, 38, 38, 0.4)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soldOutBadgeText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "700",
  },
  dishName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 6,
    textAlign: "left",
  },
  dishDescription: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  priceLabel: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  priceValue: {
    color: "#e11d48",
    fontSize: 18,
    fontWeight: "900",
  },
  addButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  addButtonDisabled: {
    backgroundColor: "#374151",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
