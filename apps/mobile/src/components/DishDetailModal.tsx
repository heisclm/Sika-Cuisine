import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Clock, Flame, Minus, Plus, X } from "lucide-react-native";
import { MenuItemDTO, MenuItemOptionDTO, formatPesewasToGhs } from "@sika/shared";
import { SelectedOptionChoice } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { MOBILE_IMAGE_ASSETS, resolveDishImageSource } from "../data/dish-images";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

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

const SPICE_LABELS = ["Not Spicy", "Mild Heat", "Medium Heat", "Spicy", "Fiery"];

/**
 * Full dish customization modal with dish photography, option group selection,
 * kitchen notes, quantity stepper (1–20), and integer pesewas price calculation.
 */
export function DishDetailModal({
  visible,
  dish,
  onClose,
  onAddToCart,
}: DishDetailModalProps) {
  const { success } = useToast();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<
    Record<string, MenuItemOptionDTO>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (dish) {
      setQuantity(1);
      setSpecialInstructions("");
      setImgFailed(false);
      const initial: Record<string, MenuItemOptionDTO> = {};
      if (dish.optionGroups?.length) {
        dish.optionGroups.forEach((group) => {
          if (group.options.length > 0) {
            initial[group.id] =
              group.options.find((opt) => opt.isAvailable) || group.options[0];
          }
        });
      }
      setSelectedOptionsMap(initial);
    }
  }, [dish]);

  const lineTotalPesewas = useMemo(() => {
    if (!dish) return 0;
    const optionsDelta = Object.values(selectedOptionsMap).reduce(
      (sum, opt) => sum + opt.priceDeltaPesewas,
      0
    );
    return (dish.basePricePesewas + optionsDelta) * quantity;
  }, [dish, selectedOptionsMap, quantity]);

  if (!dish) return null;

  const handleConfirm = () => {
    if (!dish.isAvailable) return;
    const chosen: SelectedOptionChoice[] = Object.values(selectedOptionsMap).map(
      (opt) => ({
        optionId: opt.id,
        optionName: opt.name,
        priceDeltaPesewas: opt.priceDeltaPesewas,
      })
    );
    onAddToCart(dish, quantity, chosen, specialInstructions.trim() || undefined);
    success("Added to Tray", `${quantity}x ${dish.name}`);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Photographic Banner */}
            <View style={styles.heroWrap}>
              <Image
                source={
                  imgFailed
                    ? MOBILE_IMAGE_ASSETS.heroPlate
                    : resolveDishImageSource(dish.imageUrl)
                }
                onError={() => setImgFailed(true)}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(16,16,16,0.2)", "rgba(16,16,16,0.45)", "#1C1C1C"]}
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFill}
              />

              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close dish details"
                style={styles.closeBtn}
              >
                <X size={18} color={SikaColors.warmWhite} />
              </Pressable>

              <View style={styles.heroBadges}>
                {dish.isFeatured ? <Badge label="Signature" variant="brand" /> : null}
                {!dish.isAvailable ? <Badge label="Sold Out" variant="error" /> : null}
              </View>
            </View>

            {/* Dish Header Info */}
            <View style={styles.body}>
              <Text style={styles.title}>{dish.name}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={14} color={SikaColors.accentLight} />
                  <Text style={styles.metaText}>{dish.preparationTimeMinutes} mins prep</Text>
                </View>
                <View style={styles.metaItem}>
                  <Flame size={14} color={SikaColors.accentLight} />
                  <Text style={styles.metaText}>
                    {SPICE_LABELS[Math.min(dish.spiceLevel, 4)]}
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>{dish.description}</Text>

              {/* Option Groups */}
              {dish.optionGroups && dish.optionGroups.length > 0 ? (
                <View style={styles.groupsSection}>
                  {dish.optionGroups.map((group) => (
                    <View key={group.id} style={styles.groupCard}>
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>{group.name}</Text>
                        <Badge
                          label={group.isRequired ? "Required" : "Optional"}
                          variant={group.isRequired ? "brand" : "neutral"}
                        />
                      </View>
                      {group.description ? (
                        <Text style={styles.groupDesc}>{group.description}</Text>
                      ) : null}

                      <View style={styles.optionsList}>
                        {group.options.map((opt) => {
                          const selected = selectedOptionsMap[group.id]?.id === opt.id;
                          return (
                            <Pressable
                              key={opt.id}
                              disabled={!opt.isAvailable}
                              onPress={() =>
                                setSelectedOptionsMap((prev) => ({
                                  ...prev,
                                  [group.id]: opt,
                                }))
                              }
                              style={[
                                styles.optionRow,
                                selected && styles.optionRowSelected,
                                !opt.isAvailable && styles.optionDisabled,
                              ]}
                            >
                              <View style={styles.optionLeft}>
                                <View
                                  style={[
                                    styles.radioCircle,
                                    selected && styles.radioCircleSelected,
                                  ]}
                                >
                                  {selected ? (
                                    <Check size={12} color={SikaColors.text} />
                                  ) : null}
                                </View>
                                <Text style={styles.optionName}>
                                  {opt.name}
                                  {!opt.isAvailable ? " (Out)" : ""}
                                </Text>
                              </View>
                              <Text style={styles.optionDelta}>
                                {opt.priceDeltaPesewas > 0
                                  ? `+${formatPesewasToGhs(opt.priceDeltaPesewas)}`
                                  : "Included"}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Kitchen Instructions */}
              <View style={styles.notesWrap}>
                <Text style={styles.sectionLabel}>Kitchen Instructions (Optional)</Text>
                <TextInput
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  maxLength={250}
                  multiline
                  numberOfLines={2}
                  placeholder="Less pepper, separate shito, well-done fish..."
                  placeholderTextColor={SikaColors.muted}
                  style={styles.notesInput}
                />
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Stepper & CTA */}
          <View style={styles.footer}>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                style={styles.stepBtn}
              >
                <Minus size={16} color={SikaColors.warmWhite} />
              </Pressable>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <Pressable
                onPress={() => setQuantity((q) => Math.min(20, q + 1))}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                style={styles.stepBtn}
              >
                <Plus size={16} color={SikaColors.warmWhite} />
              </Pressable>
            </View>

            <Button
              title={
                dish.isAvailable
                  ? `Add ${formatPesewasToGhs(lineTotalPesewas)}`
                  : "Currently Sold Out"
              }
              variant="primary"
              size="lg"
              disabled={!dish.isAvailable}
              onPress={handleConfirm}
              style={styles.addBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    backgroundColor: SikaColors.surface,
    borderTopLeftRadius: SikaRadius.xl,
    borderTopRightRadius: SikaRadius.xl,
    borderTopWidth: 1,
    borderColor: SikaColors.border,
    maxHeight: "90%",
    overflow: "hidden",
  },
  heroWrap: {
    height: 220,
    width: "100%",
    backgroundColor: SikaColors.elevated,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: SikaSpace.lg,
    right: SikaSpace.lg,
    width: 38,
    height: 38,
    borderRadius: SikaRadius.pill,
    backgroundColor: "rgba(16,16,16,0.75)",
    borderWidth: 1,
    borderColor: SikaColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadges: {
    position: "absolute",
    bottom: SikaSpace.md,
    left: SikaSpace.lg,
    flexDirection: "row",
    gap: SikaSpace.sm,
  },
  body: {
    paddingHorizontal: SikaSpace.xl,
    paddingBottom: SikaSpace.xl,
  },
  title: {
    color: SikaColors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: "row",
    gap: SikaSpace.lg,
    marginTop: SikaSpace.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    color: SikaColors.secondaryText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: SikaSpace.md,
  },
  groupsSection: {
    marginTop: SikaSpace.xl,
    gap: SikaSpace.lg,
  },
  groupCard: {
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.background,
    padding: SikaSpace.md,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  groupTitle: {
    color: SikaColors.warmWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  groupDesc: {
    color: SikaColors.muted,
    fontSize: 12,
    marginBottom: SikaSpace.sm,
  },
  optionsList: {
    gap: SikaSpace.sm,
    marginTop: SikaSpace.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: SikaSpace.md,
  },
  optionRowSelected: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash12,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: SikaColors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accent,
  },
  optionName: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "600",
  },
  optionDelta: {
    color: SikaColors.accentLight,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  notesWrap: {
    marginTop: SikaSpace.xl,
  },
  sectionLabel: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SikaSpace.sm,
  },
  notesInput: {
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    color: SikaColors.warmWhite,
    padding: SikaSpace.md,
    fontSize: 13,
    minHeight: 68,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.md,
    paddingHorizontal: SikaSpace.xl,
    paddingVertical: SikaSpace.lg,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    backgroundColor: SikaColors.background,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    height: 50,
    paddingHorizontal: 6,
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "800",
    minWidth: 26,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  addBtn: {
    flex: 1,
  },
});
