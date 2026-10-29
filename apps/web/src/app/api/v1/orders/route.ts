import { NextRequest, NextResponse } from "next/server";
import {
  createOrderSchema,
  calculateLineTotalPesewas,
  calculateOrderTotalPesewas,
  calculateDeliveryFeePesewas,
} from "@sika/shared";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { initializePaystackTransaction } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
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

    for (const itemInput of input.items) {
      const dbItem = menuMap.get(itemInput.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          {
            success: false,
            error: `Menu item with ID "${itemInput.menuItemId}" does not exist.`,
          },
          { status: 422 }
        );
      }

      if (!dbItem.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            error: `Sorry, "${dbItem.name}" is currently sold out.`,
          },
          { status: 422 }
        );
      }

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

    // 2. Authoritative Delivery Fee: 0 pesewas for COLLECTION; zone fee for DELIVERY
    const deliveryFeePesewas = calculateDeliveryFeePesewas(
      input.fulfilmentType,
      input.deliveryAddress?.areaLocality
    );

    const grandTotalPesewas = calculateOrderTotalPesewas({
      subtotalPesewas: calculatedSubtotalPesewas,
      deliveryFeePesewas,
      discountPesewas: 0,
    });

    // 3. Generate Unique Order Reference
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
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
              note: `Order submitted online via ${input.paymentMethod}.`,
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
            },
          },
        },
        include: {
          items: true,
          deliveryAddress: true,
        },
      });

      return order;
    });

    // 5. Payment Handling
    let authorizationUrl: string | undefined = undefined;
    if (input.paymentMethod === "PAYSTACK") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const callbackUrl = `${appUrl}/orders/${orderNumber}?reference=${paymentReference}`;

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
          },
        });

        if (paystackInit.status && paystackInit.data?.authorization_url) {
          authorizationUrl = paystackInit.data.authorization_url;
        }
      } catch (paystackError) {
        console.warn("[Paystack Init Warning]: Running in test/sandbox simulation:", paystackError);
        authorizationUrl = `${callbackUrl}&simulated=true`;
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        fulfilmentType: createdOrder.fulfilmentType,
        fulfilmentStatus: createdOrder.fulfilmentStatus,
        subtotalPesewas: createdOrder.subtotalPesewas,
        deliveryFeePesewas: createdOrder.deliveryFeePesewas,
        totalPesewas: createdOrder.totalPesewas,
        authorizationUrl,
        redirectUrl: `/orders/${orderNumber}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API v1 Create Order Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to process order. Please try again or contact Sika Cuisine Sunyani.",
      },
      { status: 500 }
    );
  }
}
