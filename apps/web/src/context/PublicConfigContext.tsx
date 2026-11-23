"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  RESTAURANT_INFO,
  SUNYANI_DELIVERY_ZONES,
  calculateDeliveryFeePesewas,
  evaluateKitchenOpenStatus,
  KitchenScheduleMode,
} from "@sika/shared";

export interface PublicRestaurantConfig {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  isAcceptingOrders: boolean;
  kitchenScheduleMode: KitchenScheduleMode;
  isWithinScheduledHours: boolean;
  kitchenStatusReason: string;
  isDeliveryEnabled: boolean;
  isCollectionEnabled: boolean;
  weekdayHours: string;
  sundayHours: string;
}

export interface PublicDeliveryZone {
  id: string;
  name: string;
  description: string;
  feePesewas: number;
  estimatedMinutes: number;
  localities: string[];
}

interface PublicConfigContextValue {
  restaurant: PublicRestaurantConfig;
  deliveryZones: PublicDeliveryZone[];
  configLoaded: boolean;
  refreshConfig: () => Promise<void>;
  resolveZoneFeePesewas: (zoneIdOrNameOrLocality: string) => number;
}

const DEFAULT_RESTAURANT: PublicRestaurantConfig = {
  name: RESTAURANT_INFO.brandName,
  tagline: RESTAURANT_INFO.city,
  phone: RESTAURANT_INFO.primaryPhone,
  whatsapp: RESTAURANT_INFO.primaryPhoneIntl,
  address: RESTAURANT_INFO.address,
  isAcceptingOrders: true,
  kitchenScheduleMode: "AUTO",
  isWithinScheduledHours: true,
  kitchenStatusReason: "Kitchen is open (10:00 AM - 10:00 PM GMT).",
  isDeliveryEnabled: true,
  isCollectionEnabled: true,
  weekdayHours: "10:00 AM - 10:00 PM",
  sundayHours: "12:00 PM - 9:00 PM",
};

const PublicConfigContext = createContext<PublicConfigContextValue | undefined>(
  undefined
);

export function PublicConfigProvider({ children }: { children: React.ReactNode }) {
  const [restaurant, setRestaurant] = useState<PublicRestaurantConfig>(DEFAULT_RESTAURANT);
  const [deliveryZones, setDeliveryZones] =
    useState<PublicDeliveryZone[]>(SUNYANI_DELIVERY_ZONES);
  const [configLoaded, setConfigLoaded] = useState(false);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/config/public", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.success) return;

      if (data.restaurant) {
        setRestaurant((prev) => ({
          ...prev,
          ...data.restaurant,
        }));
      }
      if (Array.isArray(data.deliveryZones) && data.deliveryZones.length > 0) {
        setDeliveryZones(data.deliveryZones);
      }
    } catch {
      // Retain shared defaults cleanly if endpoint is temporarily unreachable
    } finally {
      setConfigLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Quietly re-sync restaurant status when browser regains focus or network reconnects
  useEffect(() => {
    const handleFocusOrOnline = () => {
      if (document.visibilityState === "visible") {
        void refreshConfig();
      }
    };
    window.addEventListener("online", handleFocusOrOnline);
    document.addEventListener("visibilitychange", handleFocusOrOnline);
    return () => {
      window.removeEventListener("online", handleFocusOrOnline);
      document.removeEventListener("visibilitychange", handleFocusOrOnline);
    };
  }, [refreshConfig]);

  // Automatically flip live kitchen open/closed status on the client when opening/closing time arrives
  useEffect(() => {
    const syncSchedule = () => {
      setRestaurant((prev) => {
        const status = evaluateKitchenOpenStatus({
          scheduleMode: prev.kitchenScheduleMode,
          isAcceptingOrders: prev.isAcceptingOrders,
          weekdayHours: prev.weekdayHours,
          sundayHours: prev.sundayHours,
        });
        if (
          prev.isAcceptingOrders === status.isOpen &&
          prev.isWithinScheduledHours === status.isWithinScheduledHours &&
          prev.kitchenStatusReason === status.reason
        ) {
          return prev;
        }
        return {
          ...prev,
          isAcceptingOrders: status.isOpen,
          kitchenScheduleMode: status.mode,
          isWithinScheduledHours: status.isWithinScheduledHours,
          kitchenStatusReason: status.reason,
        };
      });
    };

    syncSchedule();
    const timer = window.setInterval(syncSchedule, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const resolveZoneFeePesewas = useCallback(
    (zoneIdOrNameOrLocality: string): number => {
      const normalized = zoneIdOrNameOrLocality.trim().toLowerCase();
      if (!normalized) {
        return deliveryZones[0]?.feePesewas ?? calculateDeliveryFeePesewas("DELIVERY", "");
      }

      const match = deliveryZones.find(
        (z) =>
          z.id.toLowerCase() === normalized ||
          z.name.toLowerCase() === normalized ||
          z.description.toLowerCase().includes(normalized) ||
          z.localities.some(
            (loc) =>
              loc.toLowerCase() === normalized ||
              normalized.includes(loc.toLowerCase())
          )
      );

      if (match) return match.feePesewas;
      return calculateDeliveryFeePesewas("DELIVERY", zoneIdOrNameOrLocality);
    },
    [deliveryZones]
  );

  const value = useMemo(
    () => ({
      restaurant,
      deliveryZones,
      configLoaded,
      refreshConfig,
      resolveZoneFeePesewas,
    }),
    [restaurant, deliveryZones, configLoaded, refreshConfig, resolveZoneFeePesewas]
  );

  return (
    <PublicConfigContext.Provider value={value}>
      {children}
    </PublicConfigContext.Provider>
  );
}

export function usePublicConfig(): PublicConfigContextValue {
  const ctx = useContext(PublicConfigContext);
  if (!ctx) {
    throw new Error("usePublicConfig must be used inside a PublicConfigProvider.");
  }
  return ctx;
}
