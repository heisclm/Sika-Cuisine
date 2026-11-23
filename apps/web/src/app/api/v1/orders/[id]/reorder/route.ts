import { NextRequest, NextResponse } from "next/server";
import {
  ReorderItemDTO,
  SelectedOptionDTO,
  calculateLineTotalPesewas,
} from "@sika/shared";
import { getAuthUser } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { hasGuestReceiptAccess } from "@/lib/auth/guest-receipt";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/v1/orders/[id]/reorder
 * Resolves items from a previous order against the live PostgreSQL catalog (`MenuItem` +
 * `MenuItemOption`) so unavailable dishes are flagged clearly and live prices are recomputed.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit(`order-reorder:${ip}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many reorder requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { id } = await params;
    const rawLookup = decodeURIComponent(id).trim();
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: rawLookup }, { orderNumber: rawLookup.toUpperCase() }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Original order not found." },
        { status: 404 }
      );
    }

    const [session, hasGuestCookie] = await Promise.all([
      getAuthUser(req).catch(() => null),
      hasGuestReceiptAccess(order.orderNumber).catch(() => false),
    ]);

    const canIncludeInstructions = Boolean(
      hasGuestCookie || (session && order.customerId && order.customerId === session.id)
    );

    const menuItemIds = Array.from(
      new Set(
        order.items
          .map((item) => item.menuItemId)
          .filter((val): val is string => Boolean(val))
      )
    );
    const itemNames = Array.from(
      new Set(order.items.map((item) => item.itemNameSnapshot))
    );

    const liveMenuItems = await prisma.menuItem.findMany({
      where: {
        OR: [
          ...(menuItemIds.length > 0 ? [{ id: { in: menuItemIds } }] : []),
          ...(itemNames.length > 0 ? [{ name: { in: itemNames } }] : []),
        ],
      },
      include: {
        category: { select: { name: true, isActive: true } },
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    const byId = new Map(liveMenuItems.map((m) => [m.id, m]));
    const byName = new Map(
      liveMenuItems.map((m) => [m.name.trim().toLowerCase(), m])
    );

    const itemsToAdd: ReorderItemDTO[] = [];
    const unavailableItems: Array<{ itemName: string; reason: string }> = [];
    const adjustedOptions: Array<{ itemName: string; droppedOption: string }> = [];

    for (const orderItem of order.items) {
      const liveItem =
        (orderItem.menuItemId ? byId.get(orderItem.menuItemId) : undefined) ??
        byName.get(orderItem.itemNameSnapshot.trim().toLowerCase());

      if (!liveItem || !liveItem.isAvailable || !liveItem.category?.isActive) {
        unavailableItems.push({
          itemName: orderItem.itemNameSnapshot,
          reason: "Currently sold out or unavailable on the menu",
        });
        continue;
      }

      const liveOptionLookup = new Map<
        string,
        { optionGroupId: string; groupName: string; optionId: string; optionName: string; priceDeltaPesewas: number }
      >();
      for (const group of liveItem.optionGroups) {
        for (const opt of group.options) {
          if (opt.isAvailable) {
            liveOptionLookup.set(opt.id, {
              optionGroupId: group.id,
              groupName: group.name,
              optionId: opt.id,
              optionName: opt.name,
              priceDeltaPesewas: opt.priceDeltaPesewas,
            });
          }
        }
      }

      const snapshotList = Array.isArray(orderItem.selectedOptionsSnapshot)
        ? (orderItem.selectedOptionsSnapshot as Array<{
            optionId?: string;
            optionName?: string;
          }>)
        : [];

      const validSelectedOptions: SelectedOptionDTO[] = [];
      for (const snapOpt of snapshotList) {
        if (snapOpt?.optionId && liveOptionLookup.has(snapOpt.optionId)) {
          validSelectedOptions.push(liveOptionLookup.get(snapOpt.optionId)!);
        } else if (snapOpt?.optionName) {
          adjustedOptions.push({
            itemName: liveItem.name,
            droppedOption: snapOpt.optionName,
          });
        }
      }

      const optionsDelta = validSelectedOptions.reduce(
        (sum, opt) => sum + opt.priceDeltaPesewas,
        0
      );
      const liveUnitPricePesewas = liveItem.basePricePesewas + optionsDelta;
      const liveLineTotalPesewas = calculateLineTotalPesewas(
        liveItem.basePricePesewas,
        orderItem.quantity,
        optionsDelta
      );

      itemsToAdd.push({
        menuItem: {
          id: liveItem.id,
          categoryId: liveItem.categoryId,
          categoryName: liveItem.category?.name,
          name: liveItem.name,
          slug: liveItem.slug,
          description: liveItem.description,
          basePricePesewas: liveItem.basePricePesewas,
          imageUrl: liveItem.imageUrl,
          isAvailable: liveItem.isAvailable,
          isFeatured: liveItem.isFeatured,
          spiceLevel: liveItem.spiceLevel,
          preparationTimeMinutes: liveItem.preparationTimeMinutes,
          sortOrder: liveItem.sortOrder,
        },
        quantity: orderItem.quantity,
        selectedOptions: validSelectedOptions,
        specialInstructions: canIncludeInstructions
          ? orderItem.specialInstructions ?? undefined
          : undefined,
        liveUnitPricePesewas,
        liveLineTotalPesewas,
        priceChanged: liveUnitPricePesewas !== orderItem.unitPricePesewas,
      });
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      itemsToAdd,
      unavailableItems,
      adjustedOptions,
    });
  } catch (error) {
    console.error("[API v1 Reorder Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to prepare reorder items." },
      { status: 500 }
    );
  }
}
