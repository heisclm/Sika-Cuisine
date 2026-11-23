"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { resolveCartOwnerTransition } from "@sika/shared";
import { MenuItem, SelectedOptionSnapshot } from "@/types/menu";
import { calculateLineTotalPesewas } from "@/lib/currency";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string;
  basePricePesewas: number;
  optionsDeltaPesewas: number;
  unitPricePesewas: number;
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

export type UnavailableReason = "SOLD_OUT" | "REMOVED";

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
  clearCartOnSignOut: () => void;
  syncCartSession: (nextUserId: string | null) => number;
  selectedFulfilmentType: "DELIVERY" | "COLLECTION";
  setSelectedFulfilmentType: (type: "DELIVERY" | "COLLECTION") => void;
  selectedZoneId: string;
  setSelectedZoneId: (zoneId: string) => void;
  unavailableMenuItemIds: Record<string, UnavailableReason>;
  unavailableCount: number;
  checkingAvailability: boolean;
  refreshCartAvailability: () => Promise<Record<string, UnavailableReason>>;
  markItemsUnavailable: (menuItemIds: string[], reason?: UnavailableReason) => void;
  removeUnavailableItems: () => void;
  flyingItems: FlyingItem[];
  removeFlyingItem: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "sika_cuisine_cart_v1";
const USER_CART_STORAGE_PREFIX = "sika_cuisine_cart_v1:user:";

interface StoredCartEnvelope {
  ownerUserId: string | null;
  items: CartItem[];
  fulfilmentType?: "DELIVERY" | "COLLECTION";
  zoneId?: string;
}

function readUserCartSnapshot(userId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(`${USER_CART_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeUserCartSnapshot(userId: string, cartItems: CartItem[]) {
  try {
    localStorage.setItem(`${USER_CART_STORAGE_PREFIX}${userId}`, JSON.stringify(cartItems));
  } catch {
  }
}

function parseActiveCartEnvelope(raw: string | null): StoredCartEnvelope {
  if (!raw) return { ownerUserId: null, items: [] };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { ownerUserId: null, items: parsed as CartItem[] };
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return {
        ownerUserId: typeof parsed.ownerUserId === "string" ? parsed.ownerUserId : null,
        items: parsed.items as CartItem[],
        fulfilmentType:
          parsed.fulfilmentType === "COLLECTION" ? "COLLECTION" : "DELIVERY",
        zoneId: typeof parsed.zoneId === "string" ? parsed.zoneId : undefined,
      };
    }
  } catch {
  }
  return { ownerUserId: null, items: [] };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [selectedFulfilmentType, setSelectedFulfilmentType] = useState<
    "DELIVERY" | "COLLECTION"
  >("DELIVERY");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [unavailableMenuItemIds, setUnavailableMenuItemIds] = useState<
    Record<string, UnavailableReason>
  >({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const itemsRef = useRef<CartItem[]>(items);
  const ownerUserIdRef = useRef<string | null>(ownerUserId);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    ownerUserIdRef.current = ownerUserId;
  }, [ownerUserId]);

  const syncCartSession = useCallback((nextUserId: string | null): number => {
    const currentItems = itemsRef.current;
    const currentOwnerId = ownerUserIdRef.current;
    const nextUserSavedItems = nextUserId ? readUserCartSnapshot(nextUserId) : [];

    const transition = resolveCartOwnerTransition<CartItem>({
      currentOwnerId,
      nextOwnerId: nextUserId,
      currentItems,
      nextUserSavedItems,
    });

    if (transition.shouldPersistOutOwnerId) {
      writeUserCartSnapshot(transition.shouldPersistOutOwnerId, currentItems);
    }

    ownerUserIdRef.current = transition.nextOwnerId;
    itemsRef.current = transition.nextItems;
    setOwnerUserId(transition.nextOwnerId);
    setItems(transition.nextItems);

    if (transition.nextOwnerId) {
      writeUserCartSnapshot(transition.nextOwnerId, transition.nextItems);
    }

    try {
      const envelope: StoredCartEnvelope = {
        ownerUserId: transition.nextOwnerId,
        items: transition.nextItems,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(envelope));
    } catch {
    }

    return transition.nextItems.reduce((sum, item) => sum + item.quantity, 0);
  }, []);

  useEffect(() => {
    const initial = parseActiveCartEnvelope(localStorage.getItem(LOCAL_STORAGE_KEY));
    ownerUserIdRef.current = initial.ownerUserId;
    itemsRef.current = initial.items;
    setOwnerUserId(initial.ownerUserId);
    setItems(initial.items);
    if (initial.fulfilmentType) {
      setSelectedFulfilmentType(initial.fulfilmentType);
    }
    if (initial.zoneId) {
      setSelectedZoneId(initial.zoneId);
    }
    setIsHydrated(true);

    let active = true;
    fetch("/api/v1/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const serverUserId =
          data?.success && typeof data?.user?.id === "string" ? data.user.id : null;
        syncCartSession(serverUserId);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [syncCartSession]);

  useEffect(() => {
    if (isHydrated) {
      try {
        const envelope: StoredCartEnvelope = {
          ownerUserId,
          items,
          fulfilmentType: selectedFulfilmentType,
          zoneId: selectedZoneId || undefined,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(envelope));
        if (ownerUserId) {
          writeUserCartSnapshot(ownerUserId, items);
        }
      } catch {
      }
    }
  }, [items, ownerUserId, selectedFulfilmentType, selectedZoneId, isHydrated]);

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
      const optionsDelta = selectedOptions.reduce(
        (sum, opt) => sum + opt.priceDeltaPesewas,
        0
      );
      const unitPrice = item.basePricePesewas + optionsDelta;

      const optionKey = selectedOptions
        .map((o) => o.optionId)
        .sort()
        .join("-");
      const cartItemId = `${item.id}_${optionKey}_${specialInstructions || ""}`;

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
    setUnavailableMenuItemIds({});
  }, []);

  const clearCartOnSignOut = useCallback(() => {
    if (ownerUserIdRef.current) {
      writeUserCartSnapshot(ownerUserIdRef.current, []);
    }
    ownerUserIdRef.current = null;
    itemsRef.current = [];
    setOwnerUserId(null);
    setItems([]);
    setUnavailableMenuItemIds({});
    setIsCartOpen(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
    }
  }, []);

  const markItemsUnavailable = useCallback(
    (menuItemIds: string[], reason: UnavailableReason = "SOLD_OUT") => {
      if (!menuItemIds.length) return;
      setUnavailableMenuItemIds((prev) => {
        const next = { ...prev };
        menuItemIds.forEach((id) => {
          if (id) next[id] = reason;
        });
        return next;
      });
    },
    []
  );

  const removeUnavailableItems = useCallback(() => {
    setItems((prev) => prev.filter((item) => !unavailableMenuItemIds[item.menuItemId]));
    setUnavailableMenuItemIds({});
  }, [unavailableMenuItemIds]);

  const refreshCartAvailability = useCallback(async (): Promise<
    Record<string, UnavailableReason>
  > => {
    const snapshot = itemsRef.current;
    if (snapshot.length === 0) {
      setUnavailableMenuItemIds({});
      return {};
    }

    setCheckingAvailability(true);
    try {
      const res = await fetch("/api/v1/menu/items?includeUnavailable=true", {
        cache: "no-store",
      });
      if (!res.ok) return unavailableMenuItemIds;
      const payload = await res.json();
      if (!payload?.success || !Array.isArray(payload.items)) {
        return unavailableMenuItemIds;
      }

      const liveById = new Map<
        string,
        { id: string; isAvailable: boolean; basePricePesewas: number; name?: string; imageUrl?: string }
      >(payload.items.map((m: { id: string; isAvailable: boolean; basePricePesewas: number; name?: string; imageUrl?: string }) => [m.id, m]));

      const nextUnavailable: Record<string, UnavailableReason> = {};
      let priceOrMetaChanged = false;

      const updatedItems = itemsRef.current.map((cartItem) => {
        const live = liveById.get(cartItem.menuItemId);
        if (!live) {
          nextUnavailable[cartItem.menuItemId] = "REMOVED";
          return cartItem;
        }
        if (!live.isAvailable) {
          nextUnavailable[cartItem.menuItemId] = "SOLD_OUT";
        }
        if (
          live.basePricePesewas !== cartItem.basePricePesewas ||
          (live.imageUrl && live.imageUrl !== cartItem.imageUrl) ||
          (live.name && live.name !== cartItem.name)
        ) {
          priceOrMetaChanged = true;
          const nextUnitPrice = live.basePricePesewas + cartItem.optionsDeltaPesewas;
          return {
            ...cartItem,
            name: live.name || cartItem.name,
            imageUrl: live.imageUrl || cartItem.imageUrl,
            basePricePesewas: live.basePricePesewas,
            unitPricePesewas: nextUnitPrice,
            lineTotalPesewas: calculateLineTotalPesewas(
              live.basePricePesewas,
              cartItem.quantity,
              cartItem.optionsDeltaPesewas
            ),
          };
        }
        return cartItem;
      });

      if (priceOrMetaChanged) {
        itemsRef.current = updatedItems;
        setItems(updatedItems);
      }

      setUnavailableMenuItemIds(nextUnavailable);
      return nextUnavailable;
    } catch {
      return unavailableMenuItemIds;
    } finally {
      setCheckingAvailability(false);
    }
  }, [unavailableMenuItemIds]);

  const unavailableCount = useMemo(
    () => items.filter((item) => Boolean(unavailableMenuItemIds[item.menuItemId])).length,
    [items, unavailableMenuItemIds]
  );

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
        clearCartOnSignOut,
        syncCartSession,
        selectedFulfilmentType,
        setSelectedFulfilmentType,
        selectedZoneId,
        setSelectedZoneId,
        unavailableMenuItemIds,
        unavailableCount,
        checkingAvailability,
        refreshCartAvailability,
        markItemsUnavailable,
        removeUnavailableItems,
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
