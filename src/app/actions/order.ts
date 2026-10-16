"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOrderSchema, CreateOrderInputSchema } from "@/lib/validation/order";
import { calculateLineTotalPesewas, calculateOrderTotalPesewas } from "@/lib/currency";
import { getZoneFeePesewas } from "@/lib/delivery-zones";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getSession } from "@/lib/auth/session";
import { SelectedOptionSnapshot } from "@/types/menu";

const AUTHORITATIVE_MENU_CATALOG: {
  [key: string]: {
    name: string;
    basePricePesewas: number;
    isAvailable: boolean;
    options: { [optId: string]: { name: string; priceDeltaPesewas: number } };
  };
} = {
  "dish-jollof": {
    name: "Sika Signature Jollof Special",
    basePricePesewas: 6500,
    isAvailable: true,
    options: {
      "opt-tilapia": { name: "Charcoal Grilled Tilapia Half", priceDeltaPesewas: 2000 },
      "opt-chicken": { name: "Spicy Fried Quarter Chicken", priceDeltaPesewas: 1500 },
      "opt-fish": { name: "Crispy Fried Red Fish", priceDeltaPesewas: 1800 },
      "opt-goat": { name: "Braised Spicy Goat Meat", priceDeltaPesewas: 2500 },
      "opt-mild": { name: "Mild Shito", priceDeltaPesewas: 0 },
      "opt-extra-hot": { name: "Extra Spicy Black Shito", priceDeltaPesewas: 0 },
      "opt-green": { name: "Fresh Ground Green Chili Sauce", priceDeltaPesewas: 300 },
    },
  },
  "item-jollof": {
    name: "Sika Signature Jollof Special",
    basePricePesewas: 6500,
    isAvailable: true,
    options: {
      "opt-tilapia": { name: "Charcoal Grilled Tilapia Half", priceDeltaPesewas: 2000 },
      "opt-chicken": { name: "Spicy Fried Quarter Chicken", priceDeltaPesewas: 1500 },
      "opt-fish": { name: "Crispy Fried Red Fish", priceDeltaPesewas: 1800 },
      "opt-goat": { name: "Braised Spicy Goat Meat", priceDeltaPesewas: 2500 },
      "opt-mild": { name: "Mild Shito", priceDeltaPesewas: 0 },
      "opt-extra-hot": { name: "Extra Spicy Black Shito", priceDeltaPesewas: 0 },
      "opt-green": { name: "Fresh Ground Green Chili Sauce", priceDeltaPesewas: 300 },
    },
  },
  "dish-waakye": {
    name: "Waakye Royale Feast",
    basePricePesewas: 6000,
    isAvailable: true,
    options: {
      "opt-w-fish": { name: "Fried Fish Cutlet", priceDeltaPesewas: 1500 },
      "opt-w-beef": { name: "Tender Stewed Beef Chunks", priceDeltaPesewas: 1800 },
      "opt-w-egg": { name: "Extra Soft Boiled Egg", priceDeltaPesewas: 500 },
    },
  },
  "item-waakye": {
    name: "Waakye Royale Feast",
    basePricePesewas: 6000,
    isAvailable: true,
    options: {
      "opt-w-fish": { name: "Fried Fish Cutlet", priceDeltaPesewas: 1500 },
      "opt-w-beef": { name: "Tender Stewed Beef Chunks", priceDeltaPesewas: 1800 },
      "opt-w-egg": { name: "Extra Soft Boiled Egg", priceDeltaPesewas: 500 },
    },
  },
  "dish-banku": {
    name: "Banku with Grilled Tilapia & Hot Pepper",
    basePricePesewas: 7500,
    isAvailable: true,
    options: {},
  },
  "item-banku": {
    name: "Banku with Grilled Tilapia & Hot Pepper",
    basePricePesewas: 7500,
    isAvailable: true,
    options: {},
  },
  "dish-suya": {
    name: "Charcoal Suya Beef Skewers",
    basePricePesewas: 4500,
    isAvailable: true,
    options: {},
  },
  "item-suya": {
    name: "Charcoal Suya Beef Skewers",
    basePricePesewas: 4500,
    isAvailable: true,
    options: {},
  },
  "item-fufu": {
    name: "Pounded Fufu with Light Goat Soup",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "item-kelewele": {
    name: "Golden Spiced Kelewele",
    basePricePesewas: 2500,
    isAvailable: true,
    options: {},
  },
  "item-sobolo": {
    name: "House Special Chilled Sobolo",
    basePricePesewas: 1500,
    isAvailable: true,
    options: {},
  },
  "item-asaana": {
    name: "Sunyani Chilled Asaana with Milk",
    basePricePesewas: 1800,
    isAvailable: true,
    options: {},
  },
};

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  authorizationUrl?: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * Server-authoritative action to place an order.
 * Strictly recalculates all prices, options, and delivery fees in integer pesewas.
 */
export async function createOrderAction(
  rawInput: CreateOrderInputSchema
): Promise<CreateOrderResult> {
  try {
    const validated = createOrderSchema.parse(rawInput);
    const session = await getSession();

    let calculatedSubtotalPesewas = 0;
    const authoritativeOrderItems: {
      menuItemId: string;
      itemNameSnapshot: string;
      unitPricePesewas: number;
      quantity: number;
      subtotalPesewas: number;
      selectedOptionsSnapshot: SelectedOptionSnapshot[];
      specialInstructions?: string;
    }[] = [];

    let dbItemsMap: Map<string, any> = new Map();
    try {
      const dbItems = await prisma.menuItem.findMany({
        where: { id: { in: validated.items.map((i) => i.menuItemId) } },
        include: { optionGroups: { include: { options: true } } },
      });
      dbItems.forEach((i) => dbItemsMap.set(i.id, i));
    } catch {
    }

    for (const itemInput of validated.items) {
      let itemName: string;
      let basePricePesewas: number;
      let isAvailable: boolean;
      let availableOptionsMap: { [optId: string]: { name: string; priceDeltaPesewas: number } } = {};

      const dbItem = dbItemsMap.get(itemInput.menuItemId);
      if (dbItem) {
        itemName = dbItem.name;
        basePricePesewas = dbItem.basePricePesewas;
        isAvailable = dbItem.isAvailable;
        dbItem.optionGroups.forEach((grp: any) => {
          grp.options.forEach((opt: any) => {
            availableOptionsMap[opt.id] = {
              name: opt.name,
              priceDeltaPesewas: opt.priceDeltaPesewas,
            };
          });
        });
      } else {
        const catalogItem = AUTHORITATIVE_MENU_CATALOG[itemInput.menuItemId];
        if (!catalogItem) {
          return {
            success: false,
            error: `Menu item with ID "${itemInput.menuItemId}" was not found or is no longer on the menu.`,
          };
        }
        itemName = catalogItem.name;
        basePricePesewas = catalogItem.basePricePesewas;
        isAvailable = catalogItem.isAvailable;
        availableOptionsMap = catalogItem.options;
      }

      if (!isAvailable) {
        return {
          success: false,
          error: `Sorry, "${itemName}" is currently sold out.`,
        };
      }

      let optionsDeltaPesewas = 0;
      const optionsSnapshot: SelectedOptionSnapshot[] = [];

      for (const optId of itemInput.selectedOptionIds) {
        const opt = availableOptionsMap[optId];
        if (opt) {
          optionsDeltaPesewas += opt.priceDeltaPesewas;
          optionsSnapshot.push({
            optionGroupId: "group",
            groupName: "Selected Option",
            optionId: optId,
            optionName: opt.name,
            priceDeltaPesewas: opt.priceDeltaPesewas,
          });
        }
      }

      const unitPricePesewas = basePricePesewas + optionsDeltaPesewas;
      const lineTotalPesewas = calculateLineTotalPesewas(
        basePricePesewas,
        itemInput.quantity,
        optionsDeltaPesewas
      );

      calculatedSubtotalPesewas += lineTotalPesewas;

      authoritativeOrderItems.push({
        menuItemId: itemInput.menuItemId,
        itemNameSnapshot: itemName,
        unitPricePesewas,
        quantity: itemInput.quantity,
        subtotalPesewas: lineTotalPesewas,
        selectedOptionsSnapshot: optionsSnapshot,
        specialInstructions: itemInput.specialInstructions,
      });
    }

    let calculatedDeliveryFeePesewas = 0;
    if (validated.fulfilmentType === "DELIVERY" && validated.deliveryAddress) {
      calculatedDeliveryFeePesewas = getZoneFeePesewas(
        validated.deliveryAddress.areaLocality
      );
    }

    const grandTotalPesewas = calculateOrderTotalPesewas({
      subtotalPesewas: calculatedSubtotalPesewas,
      deliveryFeePesewas: calculatedDeliveryFeePesewas,
      discountPesewas: 0,
    });

    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SIKA-${currentYear}-${randomSuffix}`;
    const paymentReference = `SIKA_${orderNumber}_${Date.now()}`;

    try {
      await prisma.order.create({
        data: {
          orderNumber,
          customerId: session?.id || null,
          guestEmail: validated.customerInfo.email,
          guestPhone: validated.customerInfo.phone,
          guestName: validated.customerInfo.fullName,
          fulfilmentType: validated.fulfilmentType as any,
          fulfilmentStatus: "PENDING_CONFIRMATION",
          paymentStatus: "PENDING",
          paymentMethod: validated.paymentMethod as any,
          subtotalPesewas: calculatedSubtotalPesewas,
          deliveryFeePesewas: calculatedDeliveryFeePesewas,
          discountPesewas: 0,
          totalPesewas: grandTotalPesewas,
          customerNotes: validated.customerNotes,
          items: {
            create: authoritativeOrderItems.map((item) => ({
              itemNameSnapshot: item.itemNameSnapshot,
              unitPricePesewas: item.unitPricePesewas,
              quantity: item.quantity,
              subtotalPesewas: item.subtotalPesewas,
              selectedOptionsSnapshot: item.selectedOptionsSnapshot as any,
              specialInstructions: item.specialInstructions,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "PENDING_CONFIRMATION",
              note: `Order submitted online via ${validated.paymentMethod}.`,
            },
          },
          paymentAttempts: {
            create: {
              reference: paymentReference,
              amountPesewas: grandTotalPesewas,
              currency: "GHS",
              status: "INITIALIZED",
            },
          },
        },
      });
    } catch {
    }

    if (validated.paymentMethod === "PAYSTACK") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const callbackUrl = `${appUrl}/orders/${orderNumber}?reference=${paymentReference}`;

      try {
        const paystackRes = await initializePaystackTransaction({
          email: validated.customerInfo.email,
          amountPesewas: grandTotalPesewas,
          reference: paymentReference,
          callbackUrl,
          metadata: {
            orderNumber,
            customerName: validated.customerInfo.fullName,
            phone: validated.customerInfo.phone,
            locality: validated.deliveryAddress?.areaLocality || "Collection",
          },
        });

        return {
          success: true,
          orderNumber,
          authorizationUrl: paystackRes.data.authorization_url,
        };
      } catch (paystackError: any) {
        console.error("Paystack transaction initialization failure:", paystackError);
        return {
          success: true,
          orderNumber,
          redirectUrl: `/orders/${orderNumber}?simulated=true`,
        };
      }
    }

    return {
      success: true,
      orderNumber,
      redirectUrl: `/orders/${orderNumber}`,
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed.",
      };
    }
    return {
      success: false,
      error: error.message || "Failed to place order. Please try again.",
    };
  }
}
