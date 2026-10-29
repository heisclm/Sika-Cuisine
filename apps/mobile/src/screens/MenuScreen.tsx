import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MenuItemDTO, formatPesewasToGhs } from "@sika/shared";
import { DishCard } from "../components/DishCard";
import { DishDetailModal } from "../components/DishDetailModal";
import { OfflineBanner } from "../components/OfflineBanner";
import { useCart, SelectedOptionChoice } from "../context/CartContext";
import { DEFAULT_MENU_CATEGORIES, DEFAULT_MENU_ITEMS } from "../data/default-menu";
import { apiRequest } from "../services/api-client";

interface MenuScreenProps {
  onNavigateToCart: () => void;
}

export function MenuScreen({ onNavigateToCart }: MenuScreenProps) {
  const { addItem, cartSubtotalPesewas, totalItemCount } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>(DEFAULT_MENU_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalDish, setActiveModalDish] = useState<MenuItemDTO | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Fetch online menu items if server is available
  const fetchMenuFromApi = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; items: MenuItemDTO[] }>(
        "/menu/items"
      );
      if (response.success && response.data?.items && response.data.items.length > 0) {
        setMenuItems(response.data.items);
        setIsOffline(false);
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    }
  }, []);

  useEffect(() => {
    fetchMenuFromApi();
  }, [fetchMenuFromApi]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchMenuFromApi();
    setIsRefreshing(false);
  };

  const filteredDishes = useMemo(() => {
    return menuItems.filter((dish) => {
      const matchesCategory =
        selectedCategory === "all" || dish.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleOpenDishModal = (dish: MenuItemDTO) => {
    setActiveModalDish(dish);
  };

  const handleAddToCartFromModal = (
    dish: MenuItemDTO,
    quantity: number,
    selectedOptions: SelectedOptionChoice[],
    specialInstructions?: string
  ) => {
    addItem(dish, quantity, selectedOptions, specialInstructions);
  };

  return (
    <View style={styles.container}>
      {isOffline && (
        <OfflineBanner
          isOffline={true}
          lastSynchronizedAt={lastSyncTime}
        />
      )}

      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Ghanaian dishes, grills, pizzas..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Category Selector */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {DEFAULT_MENU_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dish List */}
      <FlatList
        data={filteredDishes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DishCard item={item} onPress={handleOpenDishModal} />
        )}
        contentContainerStyle={[
          styles.listContent,
          totalItemCount > 0 && styles.listContentWithCartBar,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#e11d48"
            colors={["#e11d48"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for another dish or choosing a different category.
            </Text>
          </View>
        }
      />

      {/* Floating Bottom Cart Bar */}
      {totalItemCount > 0 && (
        <View style={styles.cartBarWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cartBar}
            onPress={onNavigateToCart}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{totalItemCount}</Text>
              </View>
              <View>
                <Text style={styles.cartBarSubtotalLabel}>CART SUB-TOTAL</Text>
                <Text style={styles.cartBarSubtotalValue}>
                  {formatPesewasToGhs(cartSubtotalPesewas)}
                </Text>
              </View>
            </View>

            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarActionText}>Review Order →</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Customization Modal */}
      <DishDetailModal
        visible={activeModalDish !== null}
        dish={activeModalDish}
        onClose={() => setActiveModalDish(null)}
        onAddToCart={handleAddToCartFromModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0e12",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161720",
    borderRadius: 14,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },
  clearSearchText: {
    color: "#9ca3af",
    fontSize: 14,
    paddingHorizontal: 6,
  },
  categoryScrollWrapper: {
    height: 48,
    marginBottom: 4,
  },
  categoryList: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#161720",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: "#e11d48",
    borderColor: "#e11d48",
  },
  categoryText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  listContentWithCartBar: {
    paddingBottom: 90,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
  },
  cartBarWrapper: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
  },
  cartBar: {
    backgroundColor: "#161720",
    borderRadius: 18,
    borderColor: "rgba(225, 29, 72, 0.5)",
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemCountBadge: {
    backgroundColor: "#e11d48",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCountText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  cartBarSubtotalLabel: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cartBarSubtotalValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  cartBarRight: {
    backgroundColor: "#e11d48",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  cartBarActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
