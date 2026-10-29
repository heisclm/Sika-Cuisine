/**
 * SIKA CUISINE — FINANCIAL COMPUTATION ENGINE
 * All calculations are strictly performed in integer pesewas to guarantee zero floating-point drift.
 * 1 Ghanaian Cedi (GHS / GH₵) = 100 Pesewas.
 */

export function pesewasToGhs(pesewas: number): number {
  if (!Number.isInteger(pesewas)) {
    throw new TypeError(`pesewasToGhs expects integer pesewas, received: ${pesewas}`);
  }
  return pesewas / 100;
}

export function ghsToPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

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

export function calculateOrderTotalPesewas(params: {
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  discountPesewas?: number;
}): number {
  const discount = params.discountPesewas ?? 0;
  const total = params.subtotalPesewas + params.deliveryFeePesewas - discount;
  return Math.max(0, total);
}
