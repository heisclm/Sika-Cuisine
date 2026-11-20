import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react-native";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { Button } from "./Button";

export type MenuSortOption = "featured" | "price-asc" | "price-desc" | "prep-time";
export type SpiceFilterOption = "all" | 0 | 1 | 2 | 3;

export interface MenuFilterState {
  sortBy: MenuSortOption;
  maxSpice: SpiceFilterOption;
  availableOnly: boolean;
}

export const DEFAULT_MENU_FILTERS: MenuFilterState = {
  sortBy: "featured",
  maxSpice: "all",
  availableOnly: false,
};

interface FilterSheetProps {
  visible: boolean;
  value: MenuFilterState;
  onClose: () => void;
  onApply: (next: MenuFilterState) => void;
}

const SORT_OPTIONS: Array<{ id: MenuSortOption; label: string }> = [
  { id: "featured", label: "Featured First" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "prep-time", label: "Fastest Prep" },
];

const SPICE_OPTIONS: Array<{ id: SpiceFilterOption; label: string }> = [
  { id: "all", label: "Any Spice" },
  { id: 0, label: "No Heat" },
  { id: 1, label: "Mild (1/3)" },
  { id: 2, label: "Medium (2/3)" },
  { id: 3, label: "Hot (3+)" },
];

/**
 * Interactive bottom-sheet modal allowing menu sorting, spice ceiling,
 * and availability filtering across both Home and Menu screens.
 */
export function FilterSheet({ visible, value, onClose, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState<MenuFilterState>(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <SlidersHorizontal size={18} color={SikaColors.accentLight} />
              <Text style={styles.title}>Sort &amp; Filter Dishes</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filter sheet"
              style={styles.closeBtn}
            >
              <X size={18} color={SikaColors.secondaryText} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Sort Section */}
            <Text style={styles.sectionLabel}>Sort Dishes By</Text>
            <View style={styles.chipsWrap}>
              {SORT_OPTIONS.map((opt) => {
                const selected = draft.sortBy === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setDraft((prev) => ({ ...prev, sortBy: opt.id }))}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Spice Section */}
            <Text style={styles.sectionLabel}>Maximum Spice Level</Text>
            <View style={styles.chipsWrap}>
              {SPICE_OPTIONS.map((opt) => {
                const selected = draft.maxSpice === opt.id;
                return (
                  <Pressable
                    key={String(opt.id)}
                    onPress={() => setDraft((prev) => ({ ...prev, maxSpice: opt.id }))}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Availability Toggle */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>In-Stock Dishes Only</Text>
                <Text style={styles.switchSubtitle}>
                  Hide temporarily sold-out items from results
                </Text>
              </View>
              <Switch
                value={draft.availableOnly}
                onValueChange={(nextVal) =>
                  setDraft((prev) => ({ ...prev, availableOnly: nextVal }))
                }
                trackColor={{ false: SikaColors.elevated, true: SikaColors.accent }}
                thumbColor={SikaColors.text}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Reset"
              variant="secondary"
              size="md"
              leadingIcon={<RotateCcw size={14} color={SikaColors.warmWhite} />}
              onPress={() => setDraft(DEFAULT_MENU_FILTERS)}
              style={styles.resetBtn}
            />
            <Button
              title="Apply Filters"
              variant="primary"
              size="md"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={styles.applyBtn}
            />
          </View>
        </View>
      </View>
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
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    backgroundColor: SikaColors.surface,
    borderTopLeftRadius: SikaRadius.xl,
    borderTopRightRadius: SikaRadius.xl,
    borderTopWidth: 1,
    borderColor: SikaColors.border,
    paddingHorizontal: SikaSpace.xl,
    paddingTop: SikaSpace.md,
    paddingBottom: SikaSpace.xxl,
    maxHeight: "78%",
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: SikaColors.border,
    alignSelf: "center",
    marginBottom: SikaSpace.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: SikaSpace.md,
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  title: {
    color: SikaColors.warmWhite,
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
    borderRadius: SikaRadius.pill,
    backgroundColor: SikaColors.elevated,
  },
  scrollBody: {
    paddingVertical: SikaSpace.lg,
  },
  sectionLabel: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: SikaSpace.sm,
    marginTop: SikaSpace.sm,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SikaSpace.sm,
    marginBottom: SikaSpace.lg,
  },
  chip: {
    paddingHorizontal: SikaSpace.md,
    paddingVertical: SikaSpace.sm,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
  },
  chipActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash16,
  },
  chipText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: SikaColors.warmWhite,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    padding: SikaSpace.lg,
    marginTop: SikaSpace.xs,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: SikaSpace.md,
  },
  switchTitle: {
    color: SikaColors.warmWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  switchSubtitle: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    gap: SikaSpace.md,
    paddingTop: SikaSpace.md,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
  },
  resetBtn: {
    flex: 1,
  },
  applyBtn: {
    flex: 2,
  },
});
