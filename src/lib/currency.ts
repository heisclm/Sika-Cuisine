/**
 * Currency utilities for Sika Cuisine.
 * Monetary amounts are represented strictly as integer pesewas (100 pesewas = 1 GHS).
 */

export interface FormatCurrencyOptions {
  showSymbol?: boolean;
  useCode?: boolean;
}

export function formatPesewasToGhs(
  pesewas: number,
  options: FormatCurrencyOptions = {}
): string {
  if (!Number.isFinite(pesewas)) {
    throw new TypeError(`Invalid pesewas amount: ${pesewas}`);
  }

  const roundedPesewas = Math.round(pesewas);
  const isNegative = roundedPesewas < 0;
  const absPesewas = Math.abs(roundedPesewas);

  const cedis = Math.floor(absPesewas / 100);
  const remainingPesewas = absPesewas % 100;
  const pesewasString = remainingPesewas.toString().padStart(2, "0");
  const cedisFormatted = cedis.toLocaleString("en-GH");

  const sign = isNegative ? "-" : "";
  const prefix = options.showSymbol === false 
    ? "" 
    : options.useCode 
      ? "GHS " 
      : "GH₵";

  return `${sign}${prefix}${cedisFormatted}.${pesewasString}`;
}

export function parseGhsToPesewas(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      throw new TypeError(`Cannot convert non-finite number to pesewas: ${input}`);
    }
    return Math.round(input * 100);
  }

  const sanitized = input.replace(/[GH₵ghsGHS,\s]/g, "").trim();
  if (!sanitized) {
    throw new Error(`Invalid GHS monetary string: "${input}"`);
  }

  const parts = sanitized.split(".");
  if (parts.length > 2) {
    throw new Error(`Multiple decimal points in monetary string: "${input}"`);
  }

  const isNegative = parts[0].startsWith("-");
  const wholePart = Math.abs(parseInt(parts[0], 10) || 0);
  let decimalPart = 0;

  if (parts.length === 2) {
    const rawDecimal = parts[1].slice(0, 2).padEnd(2, "0");
    decimalPart = parseInt(rawDecimal, 10);
    if (Number.isNaN(decimalPart)) {
      throw new Error(`Invalid decimal fraction in monetary string: "${input}"`);
    }
  }

  const totalPesewas = wholePart * 100 + decimalPart;
  return isNegative ? -totalPesewas : totalPesewas;
}

export function pesewasToDecimalString(pesewas: number): string {
  const rounded = Math.round(pesewas);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const cedis = Math.floor(abs / 100);
  const cents = (abs % 100).toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}${cedis}.${cents}`;
}

export function calculateLineTotalPesewas(
  unitPricePesewas: number,
  quantity: number,
  optionsDeltaPesewas: number = 0
): number {
  if (quantity < 1 || !Number.isInteger(quantity)) {
    throw new Error(`Invalid quantity: ${quantity}. Must be a positive integer.`);
  }
  const itemEffectivePrice = unitPricePesewas + optionsDeltaPesewas;
  return Math.round(itemEffectivePrice * quantity);
}

export function calculateOrderTotalPesewas(params: {
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  discountPesewas?: number;
}): number {
  const discount = params.discountPesewas ?? 0;
  const total = params.subtotalPesewas + params.deliveryFeePesewas - discount;
  return Math.max(0, Math.round(total));
}

/**
 * Maps integer pesewas to Paystack's GHS subunit requirements.
 */
export function pesewasToPaystackAmount(pesewas: number): number {
  const safePesewas = Math.round(pesewas);
  if (safePesewas < 100) {
    throw new Error(
      `Paystack amount must be at least 100 pesewas (GH₵1.00). Received: ${safePesewas}`
    );
  }
  return safePesewas;
}

/**
 * Maps Paystack webhook or verification response amount (pesewas) back to internal pesewas.
 */
export function paystackAmountToPesewas(paystackAmount: number): number {
  return Math.round(paystackAmount);
}
