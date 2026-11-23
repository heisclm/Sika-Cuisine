"use client";

import React, { useState } from "react";
import { MessageCircle, Printer, RotateCcw } from "lucide-react";
import { RESTAURANT_INFO, ReorderResponseDTO } from "@sika/shared";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

interface OrderDetailActionsProps {
  orderNumber: string;
  isPastOrder: boolean;
}

/**
 * Interactive customer actions on `/orders/[orderNumber]`:
 * - 1-Tap Reorder (revalidates live menu availability & current prices before populating tray)
 * - Print / Save Receipt PDF (`window.print()`)
 * - WhatsApp Support deep link prefilled with `#SIKA-...`
 */
export function OrderDetailActions({
  orderNumber,
  isPastOrder,
}: OrderDetailActionsProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { success, info, error: toastError } = useToast();
  const [reordering, setReordering] = useState(false);

  const handleReorder = async () => {
    setReordering(true);
    try {
      const res = await fetch(
        `/api/v1/orders/${encodeURIComponent(orderNumber)}/reorder`,
        {
          method: "POST",
        }
      );
      const data: ReorderResponseDTO & { error?: string } = await res.json();

      if (!res.ok || !data.success) {
        toastError("Reorder Failed", data.error || "Unable to load items from this order.");
        return;
      }

      if (data.itemsToAdd.length === 0) {
        info(
          "Dishes Currently Sold Out",
          data.unavailableItems[0]?.itemName
            ? `${data.unavailableItems.map((u) => u.itemName).join(", ")} cannot be ordered right now.`
            : "Items from this order are currently unavailable."
        );
        return;
      }

      for (const entry of data.itemsToAdd) {
        addItem(
          entry.menuItem,
          entry.selectedOptions,
          entry.quantity,
          entry.specialInstructions
        );
      }

      const unavailableNote =
        data.unavailableItems.length > 0
          ? ` Unavailable skipped: ${data.unavailableItems
              .map((u) => u.itemName)
              .join(", ")}.`
          : "";
      const priceChangedNote = data.itemsToAdd.some((i) => i.priceChanged)
        ? " Current live menu pricing applied."
        : "";

      success(
        "Added to Tray",
        `Loaded ${data.itemsToAdd.length} ${
          data.itemsToAdd.length === 1 ? "dish" : "dishes"
        } from #${orderNumber}.${unavailableNote}${priceChangedNote}`
      );
      setIsCartOpen(true);
    } catch {
      toastError("Network Error", "Could not reach reorder service.");
    } finally {
      setReordering(false);
    }
  };

  const whatsappText = encodeURIComponent(
    `Hello Sika Cuisine Sunyani, I need help with Order #${orderNumber}.`
  );
  const whatsappUrl = `${RESTAURANT_INFO.whatsappBaseUrl}?text=${whatsappText}`;

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      {isPastOrder ? (
        <Button
          variant="primary"
          size="sm"
          loading={reordering}
          onClick={handleReorder}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Order Again</span>
        </Button>
      ) : null}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => window.print()}
      >
        <Printer className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Print / Save Receipt</span>
      </Button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#22C55E]/35 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 px-3.5 text-xs font-semibold text-[#4ADE80] transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>WhatsApp Help</span>
      </a>
    </div>
  );
}
