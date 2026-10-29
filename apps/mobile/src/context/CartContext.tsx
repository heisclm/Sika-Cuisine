import React, { createContext, useContext, useState, useMemo } from "react";
import { MenuItemDTO, calculateLineTotalPesewas } from "@sika/shared";

export interface SelectedOptionChoice {
  optionId: string;
  optionName: string;
  priceDeltaPesewas: number;
}

export interface CartItem {
  id: string; // generated unique id based on item and options
  menuItem: MenuItemDTO;
  quantity: number;
  selectedOptions: SelectedOptionChoice[];
  specialInstructions?: string;
  unitPricePesewas: number;
  subtotalPesewas: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    item: MenuItemDTO,
    quantity: number,
    selectedOptions?: SelectedOptionChoice[],
    specialInstructions?: string
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartSubtotalPesewas: number;
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (
    item: MenuItemDTO,
    quantity: number = 1,
    selectedOptions: SelectedOptionChoice[] = [],
    specialInstructions?: string
  ) => {
    const optionsDelta = selectedOptions.reduce((acc, opt) => acc + opt.priceDeltaPesewas, 0);
    const unitPricePesewas = item.basePricePesewas + optionsDelta;
    const subtotalPesewas = calculateLineTotalPesewas(item.basePricePesewas, quantity, optionsDelta);

    const optionIdsKey = selectedOptions
      .map((o) => o.optionId)
      .sort()
      .join("-");
    const cartItemId = `${item.id}_${optionIdsKey}_${specialInstructions || ""}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotalPesewas: calculateLineTotalPesewas(item.basePricePesewas, newQty, optionsDelta),
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: cartItemId,
          menuItem: item,
          quantity,
          selectedOptions,
          specialInstructions,
          unitPricePesewas,
          subtotalPesewas,
        },
      ];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const optionsDelta = item.selectedOptions.reduce(
            (acc, opt) => acc + opt.priceDeltaPesewas,
            0
          );
          return {
            ...item,
            quantity: newQuantity,
            subtotalPesewas: calculateLineTotalPesewas(
              item.menuItem.basePricePesewas,
              newQuantity,
              optionsDelta
            ),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartSubtotalPesewas = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotalPesewas, 0);
  }, [items]);

  const totalItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartSubtotalPesewas,
        totalItemCount,
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
