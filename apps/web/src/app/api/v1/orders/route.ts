/**
 * @file apps/web/src/app/api/v1/orders/route.ts
 * @description Primary order placement route handler for web and mobile clients.
 *
 * CYBERSECURITY & TRANSACTION ARCHITECTURE:
 * 1. Server-Authoritative Pricing: Completely discards client-submitted prices. Re-computes item subtotals,
 *    option group deltas, and delivery fees directly from PostgreSQL catalog data in integer pesewas.
 * 2. Atomic Persistence: Employs prisma.$transaction to guarantee order header, order items, delivery address,
 *    and initial status history are created atomically or rolled back entirely upon error.
 * 3. Payment Gateway Dispatch: When paymentMethod === 'PAYSTACK', initializes a secure Paystack transaction
 *    and attaches the payment reference to the order record.
 */

import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import {
  buildOrderStatusHistoryNote,
  createOrderSchema,
  calculateLineTotalPesewas,
  calculateOrderTotalPesewas,
  calculateDeliveryFeePesewas,
} from "@sika/shared";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import {
  hasGuestReceiptAccess,
  setGuestReceiptCookie,
} from "@/lib/auth/guest-receipt";
import { initializePaystackTransaction } from "@/lib/paystack";
import {
  buildPaystackCallbackUrl,
  resolvePaystackBaseOrigin,
} from "@/lib/payments";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { notifyOrderCreated } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`order-create:${ip}`, {
      limit: 15,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many order requests. Please wait a minute before retrying.",
        },
        { status: 429 }
      );
    }

    const idempotencyKey =
      req.headers.get("idempotency-key")?.trim() || null;

    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: {
          items: true,
          deliveryAddress: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
          paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      if (existingOrder) {
        const callerSession = await getAuthUser(req).catch(() => null);
        const callerHasGuestReceipt = await hasGuestReceiptAccess(
          existingOrder.orderNumber
        ).catch(() => false);
        const isAuthorizedForExisting =
          (existingOrder.customerId &&
            callerSession?.id === existingOrder.customerId) ||
          (callerSession &&
            ["ADMIN", "STAFF_CASHIER"].includes(callerSession.role)) ||
          callerHasGuestReceipt ||
          (!existingOrder.customerId && !callerSession);

        if (!isAuthorizedForExisting) {
          return NextResponse.json(
            {
              success: false,
              error: "Duplicate request key. Please refresh checkout and try again.",
            },
            { status: 409 }
          );
        }

        const latestAttempt = existingOrder.paymentAttempts[0];
        const meta =
          latestAttempt?.providerMetadata &&
          typeof latestAttempt.providerMetadata === "object"
            ? (latestAttempt.providerMetadata as Record<string, unknown>)
            : null;
        let existingAuthUrl =
          typeof meta?.authorizationUrl === "string"
            ? meta.authorizationUrl
            : undefined;
        const storedPlatform =
          meta?.clientPlatform === "mobile" ? "mobile" : "web";

        if (
          existingOrder.paymentMethod === "PAYSTACK" &&
          existingOrder.paymentStatus !== "PAID" &&
          !existingAuthUrl &&
          latestAttempt &&
          existingOrder.guestEmail
        ) {
          try {
            const baseOrigin = resolvePaystackBaseOrigin(req);
            const callbackUrl = buildPaystackCallbackUrl({
              baseOrigin,
              orderNumber: existingOrder.orderNumber,
              reference: latestAttempt.reference,
              clientPlatform: storedPlatform,
            });
            const paystackInit = await initializePaystackTransaction({
              email: existingOrder.guestEmail,
              amountPesewas: existingOrder.totalPesewas,
              reference: latestAttempt.reference,
              callbackUrl,
              metadata: {
                orderNumber: existingOrder.orderNumber,
                orderId: existingOrder.id,
                fulfilmentType: existingOrder.fulfilmentType,
              },
            });
            if (paystackInit.status && paystackInit.data?.authorization_url) {
              existingAuthUrl = paystackInit.data.authorization_url;
              await prisma.paymentAttempt.update({
                where: { id: latestAttempt.id },
                data: {
                  providerMetadata: {
                    ...(meta || {}),
                    authorizationUrl: existingAuthUrl,
                    accessCode: paystackInit.data.access_code,
                    clientPlatform: storedPlatform,
                  },
                },
              });
            }
          } catch {
          }
        }

        if (storedPlatform !== "mobile") {
          await setGuestReceiptCookie(existingOrder.orderNumber).catch(() => {});
        }

        return NextResponse.json(
          {
            success: true,
            deduplicated: true,
            order: existingOrder,
            orderId: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            fulfilmentType: existingOrder.fulfilmentType,
            fulfilmentStatus: existingOrder.fulfilmentStatus,
            subtotalPesewas: existingOrder.subtotalPesewas,
            deliveryFeePesewas: existingOrder.deliveryFeePesewas,
            totalPesewas: existingOrder.totalPesewas,
            authorizationUrl: existingAuthUrl,
            paymentReference: latestAttempt?.reference,
            redirectUrl: `/orders/${existingOrder.orderNumber}`,
          },
          { status: 200 }
        );
      }
    }

    const body = await req.json();
    const validated = createOrderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = validated.data;
    const session = await getAuthUser(req);

    // Enforce live kitchen operating & fulfilment toggles from PostgreSQL
    try {
      const settings = await prisma.restaurantSettings.findUnique({
        where: { id: "default" },
      });
      if (settings && !settings.isAcceptingOrders) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Sika Cuisine kitchen is currently closed for new online orders. Please check back during operating hours.",
          },
          { status: 403 }
        );
      }
      if (input.fulfilmentType === "DELIVERY" && settings && !settings.isDeliveryEnabled) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Sunyani rider delivery is temporarily paused. Please choose Restaurant Pickup.",
          },
          { status: 403 }
        );
      }
      if (
        input.fulfilmentType === "COLLECTION" &&
        settings &&
        !settings.isCollectionEnabled
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Restaurant pickup is temporarily paused. Please choose Sunyani Delivery.",
          },
          { status: 403 }
        );
      }
    } catch (settingsErr) {
      console.warn("[API v1 Orders] RestaurantSettings lookup failed:", settingsErr);
    }

    // 1. Authoritative Server Verification: Query database for real dish prices and options
    const menuItemIds = input.items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: {
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    const menuMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    let calculatedSubtotalPesewas = 0;
    const authoritativeItems: {
      menuItemId: string;
      itemNameSnapshot: string;
      unitPricePesewas: number;
      quantity: number;
      subtotalPesewas: number;
      selectedOptionsSnapshot: any[];
      specialInstructions?: string;
    }[] = [];

    const unavailableItems: Array<{
      menuItemId: string;
      name: string;
      reason: "SOLD_OUT" | "REMOVED";
    }> = [];

    for (const itemInput of input.items) {
      const dbItem = menuMap.get(itemInput.menuItemId);
      if (!dbItem) {
        unavailableItems.push({
          menuItemId: itemInput.menuItemId,
          name: "Selected dish",
          reason: "REMOVED",
        });
        continue;
      }

      if (!dbItem.isAvailable) {
        unavailableItems.push({
          menuItemId: dbItem.id,
          name: dbItem.name,
          reason: "SOLD_OUT",
        });
      }
    }

    if (unavailableItems.length > 0) {
      const uniqueIds = Array.from(new Set(unavailableItems.map((u) => u.menuItemId)));
      const names = Array.from(new Set(unavailableItems.map((u) => u.name)));
      const errorText =
        names.length === 1
          ? unavailableItems[0].reason === "REMOVED"
            ? "One of the dishes in your tray is no longer on the menu."
            : `Sorry, "${names[0]}" just sold out.`
          : `Sorry, ${names.length} dishes in your tray are no longer available (${names.join(", ")}).`;

      return NextResponse.json(
        {
          success: false,
          code: "ITEMS_UNAVAILABLE",
          error: errorText,
          unavailableItemIds: uniqueIds,
          unavailableItems,
        },
        { status: 422 }
      );
    }

    for (const itemInput of input.items) {
      const dbItem = menuMap.get(itemInput.menuItemId)!;

      // Map options
      const availableOptionsMap = new Map<string, { name: string; priceDeltaPesewas: number }>();
      for (const group of dbItem.optionGroups) {
        for (const opt of group.options) {
          if (opt.isAvailable) {
            availableOptionsMap.set(opt.id, {
              name: opt.name,
              priceDeltaPesewas: opt.priceDeltaPesewas,
            });
          }
        }
      }

      let optionsDeltaPesewas = 0;
      const optionsSnapshot: any[] = [];

      for (const optId of itemInput.selectedOptionIds) {
        const option = availableOptionsMap.get(optId);
        if (option) {
          optionsDeltaPesewas += option.priceDeltaPesewas;
          optionsSnapshot.push({
            optionId: optId,
            optionName: option.name,
            priceDeltaPesewas: option.priceDeltaPesewas,
          });
        }
      }

      const unitPricePesewas = dbItem.basePricePesewas + optionsDeltaPesewas;
      const lineTotalPesewas = calculateLineTotalPesewas(
        dbItem.basePricePesewas,
        itemInput.quantity,
        optionsDeltaPesewas
      );

      calculatedSubtotalPesewas += lineTotalPesewas;

      authoritativeItems.push({
        menuItemId: dbItem.id,
        itemNameSnapshot: dbItem.name,
        unitPricePesewas,
        quantity: itemInput.quantity,
        subtotalPesewas: lineTotalPesewas,
        selectedOptionsSnapshot: optionsSnapshot,
        specialInstructions: itemInput.specialInstructions,
      });
    }

    // 2. Authoritative Delivery Fee: 0 pesewas for COLLECTION; active DB zone or shared matrix for DELIVERY
    let deliveryFeePesewas = calculateDeliveryFeePesewas(
      input.fulfilmentType,
      input.deliveryAddress?.areaLocality
    );

    if (input.fulfilmentType === "DELIVERY" && input.deliveryAddress?.areaLocality) {
      const localityLower = input.deliveryAddress.areaLocality.trim().toLowerCase();
      try {
        const dbZones = await prisma.deliveryZone.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        });
        const matchedDbZone = dbZones.find(
          (z) =>
            z.slug.toLowerCase() === localityLower ||
            z.name.toLowerCase() === localityLower ||
            z.description.toLowerCase().includes(localityLower) ||
            z.localities.some(
              (loc) =>
                loc.toLowerCase() === localityLower ||
                localityLower.includes(loc.toLowerCase())
            )
        );
        if (matchedDbZone) {
          deliveryFeePesewas = matchedDbZone.feePesewas;
        }
      } catch (zoneError) {
        console.warn("[API v1 Orders] Falling back to shared delivery zones:", zoneError);
      }
    }

    const grandTotalPesewas = calculateOrderTotalPesewas({
      subtotalPesewas: calculatedSubtotalPesewas,
      deliveryFeePesewas,
      discountPesewas: 0,
    });

    // 3. Generate Collision-Resistant Unique Order Reference
    const currentYear = new Date().getFullYear();
    const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    const orderNumber = `SIKA-${currentYear}-${randomSuffix}`;
    const paymentReference = `SIKA_${orderNumber}_${Date.now()}`;

    // 4. Atomic Database Transaction: Save order, items, status history, and payment record
    const createdOrder = await prisma.$transaction(async (tx) => {
      let deliveryAddressId: string | undefined = undefined;

      if (input.fulfilmentType === "DELIVERY" && input.deliveryAddress) {
        const address = await tx.deliveryAddress.create({
          data: {
            customerId: session?.id || null,
            recipientName: input.deliveryAddress.recipientName,
            recipientPhone: input.deliveryAddress.recipientPhone,
            alternatePhone: input.deliveryAddress.alternatePhone,
            streetAddress: input.deliveryAddress.streetAddress,
            areaLocality: input.deliveryAddress.areaLocality,
            landmark: input.deliveryAddress.landmark,
            city: input.deliveryAddress.city || "Sunyani",
            deliveryNotes: input.deliveryAddress.deliveryNotes,
          },
        });
        deliveryAddressId = address.id;
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: session?.id || null,
          guestEmail: input.customerInfo.email,
          guestPhone: input.customerInfo.phone,
          guestName: input.customerInfo.fullName,
          fulfilmentType: input.fulfilmentType,
          fulfilmentStatus: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: input.paymentMethod,
          subtotalPesewas: calculatedSubtotalPesewas,
          deliveryFeePesewas,
          discountPesewas: 0,
          totalPesewas: grandTotalPesewas,
          customerNotes: input.customerNotes,
          deliveryAddressId,
          idempotencyKey,
          items: {
            create: authoritativeItems.map((item) => ({
              menuItemId: item.menuItemId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPricePesewas: item.unitPricePesewas,
              quantity: item.quantity,
              subtotalPesewas: item.subtotalPesewas,
              selectedOptionsSnapshot: item.selectedOptionsSnapshot,
              specialInstructions: item.specialInstructions,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "PENDING",
              note: buildOrderStatusHistoryNote("PENDING", {
                paymentMethod: input.paymentMethod,
                fulfilmentType: input.fulfilmentType,
              }),
              changedByUserId: session?.id || null,
            },
          },
          paymentAttempts: {
            create: {
              reference: paymentReference,
              amountPesewas: grandTotalPesewas,
              currency: "GHS",
              status: "INITIALIZED",
              provider: input.paymentMethod,
              providerMetadata: {
                clientPlatform: input.clientPlatform,
              },
            },
          },
        },
        include: {
          items: true,
          deliveryAddress: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      });

      return order;
    });

    await recordAuditLog({
      userId: session?.id ?? null,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: createdOrder.id,
      metadata: {
        orderNumber: createdOrder.orderNumber,
        fulfilmentType: createdOrder.fulfilmentType,
        totalPesewas: createdOrder.totalPesewas,
      },
      req,
    });

    if (input.paymentMethod !== "PAYSTACK") {
      void notifyOrderCreated(createdOrder).catch(() => {});
    }

    if (input.clientPlatform !== "mobile") {
      await setGuestReceiptCookie(createdOrder.orderNumber).catch(() => {});
    }

    logInfo("order.created", {
      route: "/api/v1/orders",
      orderNumber: createdOrder.orderNumber,
      fulfilmentType: createdOrder.fulfilmentType,
      paymentMethod: input.paymentMethod,
      totalPesewas: createdOrder.totalPesewas,
      userId: session?.id ?? undefined,
    });

    // 5. Payment Handling
    let authorizationUrl: string | undefined = undefined;
    if (input.paymentMethod === "PAYSTACK") {
      const baseOrigin = resolvePaystackBaseOrigin(req);
      const callbackUrl = buildPaystackCallbackUrl({
        baseOrigin,
        orderNumber,
        reference: paymentReference,
        clientPlatform: input.clientPlatform,
        mobileReturnUrl: input.mobileReturnUrl,
      });

      try {
        const paystackInit = await initializePaystackTransaction({
          email: input.customerInfo.email,
          amountPesewas: grandTotalPesewas,
          reference: paymentReference,
          callbackUrl,
          metadata: {
            orderNumber,
            orderId: createdOrder.id,
            fulfilmentType: input.fulfilmentType,
            clientPlatform: input.clientPlatform,
          },
        });

        if (!paystackInit.status || !paystackInit.data?.authorization_url) {
          throw new Error("Paystack did not return a checkout authorization URL.");
        }
        authorizationUrl = paystackInit.data.authorization_url;

        await prisma.paymentAttempt.update({
          where: { reference: paymentReference },
          data: {
            providerMetadata: {
              clientPlatform: input.clientPlatform,
              authorizationUrl,
              accessCode: paystackInit.data.access_code,
            },
          },
        });
      } catch (paystackError: any) {
        logWarn("paystack.initialize.failed", {
          route: "/api/v1/orders",
          orderNumber,
          error: paystackError?.message || "Paystack initialization error",
        });
        return NextResponse.json(
          {
            success: false,
            error:
              paystackError?.message ||
              "Unable to initialize Paystack checkout. Please retry or select Cash.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: createdOrder,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        fulfilmentType: createdOrder.fulfilmentType,
        fulfilmentStatus: createdOrder.fulfilmentStatus,
        subtotalPesewas: createdOrder.subtotalPesewas,
        deliveryFeePesewas: createdOrder.deliveryFeePesewas,
        totalPesewas: createdOrder.totalPesewas,
        authorizationUrl,
        paymentReference: input.paymentMethod === "PAYSTACK" ? paymentReference : undefined,
        redirectUrl: `/orders/${orderNumber}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logError("order.create.error", {
      route: "/api/v1/orders",
      error: error?.message || String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: "Unable to process order. Please try again or contact Sika Cuisine Sunyani.",
      },
      { status: 500 }
    );
  }
}
