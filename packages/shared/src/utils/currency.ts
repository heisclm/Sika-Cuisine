/**
 * @file packages/shared/src/utils/currency.ts
 * @description Authoritative currency conversion and financial math utilities for Sika Cuisine.
 *
 * CRITICAL FINANCIAL INVARIANT:
 * All monetary values (menu item prices, option deltas, delivery fees, sub-totals, and grand totals)
 * are calculated, stored, and exchanged exclusively as positive integer pesewas.
 *
 * Floating-point representation in standard IEEE 754 arithmetic introduces rounding drift:
 * e.g., 0.10 + 0.20 = 0.30000000000000004 GHS.
 * Operating in discrete integer pesewas guarantees mathematical precision across client and server.
 *
 * Currency Unit:
 * 1 Ghanaian Cedi (GHS / GH₵) = 100 Pesewas.
 */

/**
 * Converts an integer amount in pesewas to Ghanaian Cedis as a fractional float.
 * Used strictly at presentation or reporting boundaries.
 *
 * @param pesewas - Value in discrete pesewas (e.g., 4000)
 * @returns number - Value in Cedis (e.g., 40.00)
 * @throws TypeError - If input is not an integer to enforce calculation integrity
 */
export function pesewasToGhs(pesewas: number): number {
  if (!Number.isInteger(pesewas)) {
    throw new TypeError(`pesewasToGhs expects integer pesewas, received: ${pesewas}`);
  }
  return pesewas / 100;
}

/**
 * Converts a floating-point Cedi amount to discrete integer pesewas with rounding.
 * Used when sanitizing legacy decimal inputs before database persistence.
 *
 * @param ghs - Value in Cedis (e.g., 40.50)
 * @returns number - Value in integer pesewas (e.g., 4050)
 */
export function ghsToPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

/**
 * Formats an integer pesewa value into standard Ghanaian currency display format: "GH₵ XX.XX".
 * Employs Intl.NumberFormat localized to 'en-GH' with narrow currency symbol replacement.
 *
 * @example
 * formatPesewasToGhs(4000) // "GH₵ 40.00"
 * formatPesewasToGhs(850)  // "GH₵ 8.50"
 *
 * @param pesewas - Value in integer pesewas
 * @returns string - Formatted currency string
 */
export function formatPesewasToGhs(pesewas: number): string {
  const ghs = pesewas / 100;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(ghs)
    .replace("GHS", "GH₵");
}

/**
 * Calculates line-item total in pesewas for a dish, incorporating option deltas and portion quantity.
 *
 * Formula:
 * lineTotal = (basePricePesewas + optionsDeltaPesewas) * quantity
 *
 * @param basePricePesewas - Dish base price in pesewas
 * @param quantity - Positive integer portion count (>= 1)
 * @param optionsDeltaPesewas - Cumulative price adjustments for custom options (default: 0)
 * @returns number - Subtotal for this specific line item in pesewas
 * @throws Error - If quantity is non-positive or non-integer
 */
export function calculateLineTotalPesewas(
  basePricePesewas: number,
  quantity: number,
  optionsDeltaPesewas: number = 0
): number {
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error(`Quantity must be a positive integer, received: ${quantity}`);
  }
  const unitTotal = basePricePesewas + optionsDeltaPesewas;
  return unitTotal * quantity;
}

/**
 * Authoritatively computes final payable order total in pesewas.
 * Enforces a floor of 0 pesewas so discounts can never generate negative invoices.
 *
 * Formula:
 * grandTotal = max(0, subtotal + deliveryFee - discount)
 *
 * @param params - Line-item subtotal, delivery charge, and optional promotional discount
 * @returns number - Non-negative payable total in pesewas
 */
export function calculateOrderTotalPesewas(params: {
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  discountPesewas?: number;
}): number {
  const discount = params.discountPesewas ?? 0;
  const total = params.subtotalPesewas + params.deliveryFeePesewas - discount;
  return Math.max(0, total);
}
