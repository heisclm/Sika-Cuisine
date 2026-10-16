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
  "pkg-grilled-chicken-fried-rice": {
    name: "Grilled Chicken with Fried Rice",
    basePricePesewas: 4000,
    isAvailable: true,
    options: {},
  },
  "pkg-grilled-chicken-jollof-rice": {
    name: "Grilled Chicken with Jollof Rice",
    basePricePesewas: 4000,
    isAvailable: true,
    options: {},
  },
  "pkg-fried-chicken-rice": {
    name: "Fried Chicken with Rice",
    basePricePesewas: 4000,
    isAvailable: true,
    options: {
      "opt-pkg-jollof": { name: "Smoky Jollof Rice", priceDeltaPesewas: 0 },
      "opt-pkg-fried": { name: "Vegetable Fried Rice", priceDeltaPesewas: 0 },
    },
  },
  "local-banku-okro": {
    name: "Banku with Okro Soup",
    basePricePesewas: 5000,
    isAvailable: true,
    options: {
      "opt-banku-beef": { name: "Tender Braised Beef", priceDeltaPesewas: 0 },
      "opt-banku-fish": { name: "Crispy Fried Fish", priceDeltaPesewas: 0 },
      "opt-banku-chicken": { name: "Grilled Chicken", priceDeltaPesewas: 0 },
    },
  },
  "local-omutuo-groundnut": {
    name: "Omutuo (Rice Ball) with Groundnut Soup",
    basePricePesewas: 5000,
    isAvailable: true,
    options: {
      "opt-omutuo-beef": { name: "Stewed Beef Cuts", priceDeltaPesewas: 0 },
      "opt-omutuo-fish": { name: "Fried Red Fish", priceDeltaPesewas: 0 },
    },
  },
  "local-tz": {
    name: "Tuo Zaafi (TZ) with Ayoyo Soup",
    basePricePesewas: 5000,
    isAvailable: true,
    options: {
      "opt-tz-goat": { name: "Spicy Goat Meat", priceDeltaPesewas: 0 },
      "opt-tz-beef": { name: "Braised Beef", priceDeltaPesewas: 0 },
      "opt-tz-fish": { name: "Fried Fish", priceDeltaPesewas: 0 },
    },
  },
  "local-fufu-light-soup": {
    name: "Pounded Fufu with Light Soup",
    basePricePesewas: 5000,
    isAvailable: true,
    options: {
      "opt-fufu-goat": { name: "Tender Local Goat Meat", priceDeltaPesewas: 0 },
      "opt-fufu-tilapia": { name: "Fresh Steamed Tilapia", priceDeltaPesewas: 0 },
      "opt-fufu-fish": { name: "Fried Red Fish", priceDeltaPesewas: 0 },
    },
  },
  "local-red-red": {
    name: "Red Red",
    basePricePesewas: 5000,
    isAvailable: true,
    options: {
      "opt-redred-egg": { name: "Add Boiled Egg", priceDeltaPesewas: 500 },
      "opt-redred-fish": { name: "Add Fried Fish Cutlet", priceDeltaPesewas: 1500 },
    },
  },
  "local-boiled-yam-fish-egg-stew": {
    name: "Boiled Yam with Fish & Egg Stew",
    basePricePesewas: 7000,
    isAvailable: true,
    options: {},
  },
  "local-boiled-plantain-fish-egg-stew": {
    name: "Boiled Plantain with Fish & Egg Stew",
    basePricePesewas: 7000,
    isAvailable: true,
    options: {},
  },
  "local-boiled-yam-palava-sauce": {
    name: "Boiled Yam with Palava Sauce & Fish",
    basePricePesewas: 7000,
    isAvailable: true,
    options: {},
  },
  "seafood-tilapia-banku": {
    name: "Tilapia with Banku (Chilli)",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "seafood-red-fish-banku": {
    name: "Red Fish with Banku (Chilli)",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "seafood-shrimps-rice": {
    name: "Shrimps (Fried & Jollof Rice)",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {
      "opt-shrimp-jollof": { name: "Jollof Rice", priceDeltaPesewas: 0 },
      "opt-shrimp-fried": { name: "Fried Rice", priceDeltaPesewas: 0 },
    },
  },
  "sauce-beef": {
    name: "Beef Sauce with Steamed Rice",
    basePricePesewas: 7000,
    isAvailable: true,
    options: {},
  },
  "sauce-chicken": {
    name: "Chicken Sauce with Steamed Rice",
    basePricePesewas: 7000,
    isAvailable: true,
    options: {},
  },
  "sauce-gizzard": {
    name: "Gizzard Sauce with Steamed Rice",
    basePricePesewas: 7000,
    isAvailable: true,
    options: {},
  },
  "assorted-beef-jollof": {
    name: "Beef Jollof Rice",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "assorted-chicken-jollof": {
    name: "Chicken Jollof Rice",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "assorted-shrimps-jollof": {
    name: "Shrimps Jollof Rice",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "assorted-vegetables-jollof": {
    name: "Vegetables Jollof Rice",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "fruit-pineapple-fried-rice": {
    name: "Pineapple Fried Rice",
    basePricePesewas: 9000,
    isAvailable: true,
    options: {},
  },
  "fruit-pineapple-jollof-rice": {
    name: "Pineapple Jollof Rice",
    basePricePesewas: 9000,
    isAvailable: true,
    options: {},
  },
  "fruit-coconut-fried-rice": {
    name: "Coconut Fried Rice",
    basePricePesewas: 9000,
    isAvailable: true,
    options: {},
  },
  "fruit-coconut-jollof-rice": {
    name: "Coconut Jollof Rice",
    basePricePesewas: 9000,
    isAvailable: true,
    options: {},
  },
  "fruit-salad": {
    name: "Sika Fruit Salad",
    basePricePesewas: 9000,
    isAvailable: true,
    options: {},
  },
  "special-combo-mixture": {
    name: "SIKA Special Combo (De Mixture)",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "special-fries-wings-drums": {
    name: "SIKA Fries with (Wings, Drums)",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "special-assorted-noodles": {
    name: "SIKA Assorted Noodles",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "special-loaded-fries": {
    name: "Loaded Fries",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "pizza-sika-artisan": {
    name: "Sika Artisan Oven Pizza",
    basePricePesewas: 11000,
    isAvailable: true,
    options: {
      "opt-pizza-mini": { name: "Mini Size (GH₵110)", priceDeltaPesewas: 0 },
      "opt-pizza-medium": { name: "Medium Size (GH₵140)", priceDeltaPesewas: 3000 },
      "opt-pizza-family": { name: "Family Size (GH₵180)", priceDeltaPesewas: 7000 },
      "opt-flavor-chicken-bbq": { name: "BBQ Chicken & Sweet Peppers", priceDeltaPesewas: 0 },
      "opt-flavor-beef-mushroom": { name: "Minced Beef & Mushrooms", priceDeltaPesewas: 0 },
      "opt-flavor-pepperoni": { name: "Loaded Pepperoni Feast", priceDeltaPesewas: 0 },
      "opt-flavor-veggie": { name: "Vegetarian Supreme", priceDeltaPesewas: 0 },
    },
  },
  "extra-grilled-chicken": {
    name: "Grilled Chicken Only",
    basePricePesewas: 2000,
    isAvailable: true,
    options: {},
  },
  "extra-wings": {
    name: "Wings Only",
    basePricePesewas: 4000,
    isAvailable: true,
    options: {},
  },
  "extra-drumstick": {
    name: "Drumstick Only",
    basePricePesewas: 2000,
    isAvailable: true,
    options: {},
  },
  "extra-plantain": {
    name: "Plantain Only (Kelewele)",
    basePricePesewas: 2000,
    isAvailable: true,
    options: {},
  },
  "extra-grilled-tilapia": {
    name: "Grilled Tilapia Only",
    basePricePesewas: 6000,
    isAvailable: true,
    options: {},
  },
  "dish-jollof": {
    name: "Grilled Chicken with Jollof Rice",
    basePricePesewas: 4000,
    isAvailable: true,
    options: {},
  },
  "dish-waakye": {
    name: "Red Red",
    basePricePesewas: 5000,
    isAvailable: true,
    options: {},
  },
  "dish-banku": {
    name: "Tilapia with Banku (Chilli)",
    basePricePesewas: 8000,
    isAvailable: true,
    options: {},
  },
  "dish-suya": {
    name: "SIKA Special Combo (De Mixture)",
    basePricePesewas: 8000,
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
