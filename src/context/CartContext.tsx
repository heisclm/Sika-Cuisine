"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { MenuItem, SelectedOptionSnapshot } from "@/types/menu";
import { calculateLineTotalPesewas } from "@/lib/currency";

export interface CartItem {
  id: string; // generated unique key for this combination of item + options
  menuItemId: string;
  name: string;
  imageUrl: string;
  basePricePesewas: number;
  optionsDeltaPesewas: number;
  unitPricePesewas: number; // base + optionsDelta
  quantity: number;
  selectedOptions: SelectedOptionSnapshot[];
  specialInstructions?: string;
  lineTotalPesewas: number;
}

export interface FlyingItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
}

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotalPesewas: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (
    item: MenuItem,
    selectedOptions?: SelectedOptionSnapshot[],
    quantity?: number,
    specialInstructions?: string,
    sourceElement?: HTMLElement | null
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  clearCart: () => void;
  flyingItems: FlyingItem[];
  removeFlyingItem: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "sika_cuisine_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // localStorage unavailable or corrupted
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // ignore storage errors
      }
    }
  }, [items, isHydrated]);

  const removeFlyingItem = useCallback((id: string) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addItem = useCallback(
    (
      item: MenuItem,
      selectedOptions: SelectedOptionSnapshot[] = [],
      quantity: number = 1,
      specialInstructions?: string,
      sourceElement?: HTMLElement | null
    ) => {
      // 1. Calculate integer options delta
      const optionsDelta = selectedOptions.reduce(
        (sum, opt) => sum + opt.priceDeltaPesewas,
        0
      );
      const unitPrice = item.basePricePesewas + optionsDelta;

      // Unique identifier for item + selected options combination
      const optionKey = selectedOptions
        .map((o) => o.optionId)
        .sort()
        .join("-");
      const cartItemId = `${item.id}_${optionKey}_${specialInstructions || ""}`;

      // 2. Trigger flying micro-animation if source element coordinates exist
      if (sourceElement && typeof window !== "undefined") {
        const rect = sourceElement.getBoundingClientRect();
        const flyingId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setFlyingItems((prev) => [
          ...prev,
          {
            id: flyingId,
            imageUrl: item.imageUrl,
            startX: rect.left + rect.width / 2,
            startY: rect.top + rect.height / 2,
          },
        ]);
      }

      // 3. Immediately update cart items in integer pesewas
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((i) => i.id === cartItemId);
        if (existingIndex > -1) {
          const updated = [...prevItems];
          const newQty = updated[existingIndex].quantity + quantity;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            lineTotalPesewas: calculateLineTotalPesewas(
              item.basePricePesewas,
              newQty,
              optionsDelta
            ),
          };
          return updated;
        } else {
          const newItem: CartItem = {
            id: cartItemId,
            menuItemId: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            basePricePesewas: item.basePricePesewas,
            optionsDeltaPesewas: optionsDelta,
            unitPricePesewas: unitPrice,
            quantity,
            selectedOptions,
            specialInstructions,
            lineTotalPesewas: calculateLineTotalPesewas(
              item.basePricePesewas,
              quantity,
              optionsDelta
            ),
          };
          return [...prevItems, newItem];
        }
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity: newQuantity,
            lineTotalPesewas: calculateLineTotalPesewas(
              item.basePricePesewas,
              newQuantity,
              item.optionsDeltaPesewas
            ),
          };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalPesewas = useMemo(
    () => items.reduce((sum, item) => sum + item.lineTotalPesewas, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotalPesewas,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        flyingItems,
        removeFlyingItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
