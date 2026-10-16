/**
 * Currency Utility Module for Sika Cuisine (Sunyani, Ghana)
 *
 * CRITICAL RULE:
 * Monetary amounts are stored as integer pesewas, NEVER floating-point numbers.
 * - 1 GHS (Ghana Cedi) = 100 pesewas.
 * - GH₵50.00 = 5000 pesewas.
 * - GH₵125.50 = 12550 pesewas.
 * - GH₵1.00 = 100 pesewas.
 * - 50 cedis is 5000 pesewas, NOT 50000 pesewas.
 */

export interface FormatCurrencyOptions {
  /** Include the currency symbol (defaults to true) */
  showSymbol?: boolean;
  /** Use the 3-letter currency code (GHS) instead of symbol (GH₵) */
  useCode?: boolean;
}

/**
 * Formats an integer pesewas amount into a user-facing GHS display string.
 *
 * @example
 * formatPesewasToGhs(5000) => "GH₵50.00"
 * formatPesewasToGhs(12550) => "GH₵125.50"
 * formatPesewasToGhs(100) => "GH₵1.00"
 * formatPesewasToGhs(5000, { useCode: true }) => "GHS 50.00"
 */
export function formatPesewasToGhs(
  pesewas: number,
  options: FormatCurrencyOptions = {}
): string {
  if (!Number.isFinite(pesewas)) {
    throw new TypeError(`Invalid pesewas amount: ${pesewas}`);
  }

  // Ensure safe integer arithmetic
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

/**
 * Safely parses a string or number input into integer pesewas without floating-point drift.
 * Handles user inputs such as "50", "50.00", "GH₵125.50", "1,250.75".
 *
 * @example
 * parseGhsToPesewas("50.00") => 5000
 * parseGhsToPesewas("125.50") => 12550
 * parseGhsToPesewas("GH₵1.00") => 100
 */
export function parseGhsToPesewas(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      throw new TypeError(`Cannot convert non-finite number to pesewas: ${input}`);
    }
    return Math.round(input * 100);
  }

  // Sanitize string input: remove currency symbols, spaces, commas
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
    // Take only up to 2 decimal digits, right-pad with zero if single digit (e.g., .5 => 50 pesewas)
    const rawDecimal = parts[1].slice(0, 2).padEnd(2, "0");
    decimalPart = parseInt(rawDecimal, 10);
    if (Number.isNaN(decimalPart)) {
      throw new Error(`Invalid decimal fraction in monetary string: "${input}"`);
    }
  }

  const totalPesewas = wholePart * 100 + decimalPart;
  return isNegative ? -totalPesewas : totalPesewas;
}

/**
 * Converts integer pesewas to a standard two-decimal string representation.
 * Useful for form inputs or third-party gateways that expect "50.00".
 *
 * @example
 * pesewasToDecimalString(5000) => "50.00"
 */
export function pesewasToDecimalString(pesewas: number): string {
  const rounded = Math.round(pesewas);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const cedis = Math.floor(abs / 100);
  const cents = (abs % 100).toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}${cedis}.${cents}`;
}

/**
 * Calculates line-item total in integer pesewas.
 */
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

/**
 * Calculates final order grand total in integer pesewas.
 */
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
 * Maps internal integer pesewas to Paystack's API amount parameter.
 *
 * NOTE: For GHS currency, Paystack expects the transaction amount in pesewas
 * (the subunit of GHS, exactly like kobo for NGN or cents for USD).
 *
 * @param pesewas Integer amount in pesewas
 * @returns Amount formatted for Paystack payload (integer pesewas)
 */
export function pesewasToPaystackAmount(pesewas: number): number {
  const safePesewas = Math.round(pesewas);
  // Paystack minimum charge for GHS is typically 100 pesewas (GH₵1.00)
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
