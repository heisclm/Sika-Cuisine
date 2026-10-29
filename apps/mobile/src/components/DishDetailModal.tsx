import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import { MenuItemDTO, MenuItemOptionDTO, formatPesewasToGhs } from "@sika/shared";
import { SelectedOptionChoice } from "../context/CartContext";

interface DishDetailModalProps {
  visible: boolean;
  dish: MenuItemDTO | null;
  onClose: () => void;
  onAddToCart: (
    dish: MenuItemDTO,
    quantity: number,
    selectedOptions: SelectedOptionChoice[],
    specialInstructions?: string
  ) => void;
}

export function DishDetailModal({
  visible,
  dish,
  onClose,
  onAddToCart,
}: DishDetailModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<
    Record<string, MenuItemOptionDTO>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState<string>("");

  // Reset state whenever a new dish is opened
  useEffect(() => {
    if (dish) {
      setQuantity(1);
      setSpecialInstructions("");
      const initialSelections: Record<string, MenuItemOptionDTO> = {};

      if (dish.optionGroups && dish.optionGroups.length > 0) {
        dish.optionGroups.forEach((group) => {
          if (group.options.length > 0) {
            // Default to the first available option in each group
            const firstAvailable = group.options.find((opt) => opt.isAvailable) || group.options[0];
            initialSelections[group.id] = firstAvailable;
          }
        });
      }
      setSelectedOptionsMap(initialSelections);
    }
  }, [dish]);

  // Compute total in pesewas
  const lineTotalPesewas = useMemo(() => {
    if (!dish) return 0;
    const optionsDelta = Object.values(selectedOptionsMap).reduce(
      (sum, opt) => sum + opt.priceDeltaPesewas,
      0
    );
    return (dish.basePricePesewas + optionsDelta) * quantity;
  }, [dish, selectedOptionsMap, quantity]);

  if (!dish) return null;

  const handleSelectOption = (groupId: string, option: MenuItemOptionDTO) => {
    setSelectedOptionsMap((prev) => ({
      ...prev,
      [groupId]: option,
    }));
  };

  const handleIncrement = () => {
    if (quantity < 20) setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleConfirmAddToCart = () => {
    const chosenOptions: SelectedOptionChoice[] = Object.values(
      selectedOptionsMap
    ).map((opt) => ({
      optionId: opt.id,
      optionName: opt.name,
      priceDeltaPesewas: opt.priceDeltaPesewas,
    }));

    onAddToCart(dish, quantity, chosenOptions, specialInstructions.trim() || undefined);
    onClose();
  };

  const spiceLabels = ["Not Spicy", "Mild", "Medium", "Spicy 🔥", "Fiery 🔥🔥"];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Top Bar Indicator & Close Button */}
          <View style={styles.headerBar}>
            <View style={styles.dragHandle} />
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close dish modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Dish Badges */}
            <View style={styles.badgeRow}>
              {dish.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>CHEF RECOMMENDATION</Text>
                </View>
              )}
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>⏱ {dish.preparationTimeMinutes} MINS PREP</Text>
              </View>
              {dish.spiceLevel > 0 && (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>
                    🌶️ {spiceLabels[dish.spiceLevel] || "Spicy"}
                  </Text>
                </View>
              )}
            </View>

            {/* Title & Description */}
            <Text style={styles.dishTitle}>{dish.name}</Text>
            <Text style={styles.dishDescription}>{dish.description}</Text>

            {/* Option Groups */}
            {dish.optionGroups && dish.optionGroups.length > 0 && (
              <View style={styles.optionsSection}>
                {dish.optionGroups.map((group) => (
                  <View key={group.id} style={styles.groupContainer}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupTitle}>{group.name}</Text>
                      {group.isRequired && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                        </View>
                      )}
                    </View>

                    {group.options.map((opt) => {
                      const isSelected = selectedOptionsMap[group.id]?.id === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          activeOpacity={0.7}
                          onPress={() => handleSelectOption(group.id, opt)}
                          style={[
                            styles.optionRow,
                            isSelected && styles.optionRowSelected,
                          ]}
                        >
                          <View style={styles.optionRadioWrapper}>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected,
                              ]}
                            >
                              {isSelected && <View style={styles.radioInner} />}
                            </View>
                            <Text
                              style={[
                                styles.optionName,
                                isSelected && styles.optionNameSelected,
                              ]}
                            >
                              {opt.name}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.optionPrice,
                              isSelected && styles.optionPriceSelected,
                            ]}
                          >
                            {opt.priceDeltaPesewas > 0
                              ? `+${formatPesewasToGhs(opt.priceDeltaPesewas)}`
                              : "Included"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* Special Instructions Input */}
            <View style={styles.instructionsSection}>
              <Text style={styles.inputLabel}>SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Less spicy, pack stew separately, extra shito..."
                placeholderTextColor="#6b7280"
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                maxLength={200}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>PORTION QUANTITY</Text>
              <View style={styles.counterControl}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  disabled={quantity <= 1}
                  style={[
                    styles.counterButton,
                    quantity <= 1 && styles.counterButtonDisabled,
                  ]}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityValueText}>{quantity}</Text>
                </View>

                <TouchableOpacity
                  onPress={handleIncrement}
                  disabled={quantity >= 20}
                  style={[
                    styles.counterButton,
                    quantity >= 20 && styles.counterButtonDisabled,
                  ]}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Modal Bottom Action */}
          <View style={styles.footerAction}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirmAddToCart}
              style={styles.addToCartButton}
            >
              <Text style={styles.addToCartButtonText}>
                Add to Cart • {formatPesewasToGhs(lineTotalPesewas)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#13141b",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingBottom: 24,
  },
  headerBar: {
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginLeft: "auto",
    marginRight: "auto",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
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
  },
  metaBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaBadgeText: {
    color: "#d1d5db",
    fontSize: 10,
    fontWeight: "600",
  },
  dishTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    lineHeight: 28,
  },
  dishDescription: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  optionsSection: {
    marginBottom: 18,
  },
  groupContainer: {
    marginBottom: 16,
    backgroundColor: "#1a1b24",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  groupTitle: {
    color: "#f3f4f6",
    fontSize: 14,
    fontWeight: "700",
  },
  requiredBadge: {
    backgroundColor: "rgba(225, 29, 72, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredBadgeText: {
    color: "#e11d48",
    fontSize: 9,
    fontWeight: "800",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  optionRowSelected: {
    backgroundColor: "rgba(225, 29, 72, 0.1)",
  },
  optionRadioWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#4b5563",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#e11d48",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#e11d48",
  },
  optionName: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "500",
  },
  optionNameSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  optionPrice: {
    color: "#9ca3af",
    fontSize: 13,
  },
  optionPriceSelected: {
    color: "#e11d48",
    fontWeight: "700",
  },
  instructionsSection: {
    marginBottom: 18,
  },
  inputLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#1a1b24",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 12,
    color: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 58,
    textAlignVertical: "top",
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  quantityLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  counterControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1b24",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#252733",
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  counterButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValueText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  footerAction: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  addToCartButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  addToCartButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
