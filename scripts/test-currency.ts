/**
 * Verification test suite for Sika Cuisine Currency Engine
 */
import {
  formatPesewasToGhs,
  parseGhsToPesewas,
  pesewasToDecimalString,
  calculateLineTotalPesewas,
  calculateOrderTotalPesewas,
  pesewasToPaystackAmount,
} from "../src/lib/currency";

function assertEqual(actual: unknown, expected: unknown, testName: string) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${testName} - Expected: ${expected}, Got: ${actual}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${testName} => ${actual}`);
}

console.log("=== Running Sika Cuisine Currency Engine Tests ===");

// 1. Formatting tests
assertEqual(formatPesewasToGhs(5000), "GH₵50.00", "5000 pesewas -> GH₵50.00");
assertEqual(formatPesewasToGhs(12550), "GH₵125.50", "12550 pesewas -> GH₵125.50");
assertEqual(formatPesewasToGhs(100), "GH₵1.00", "100 pesewas -> GH₵1.00");
assertEqual(formatPesewasToGhs(0), "GH₵0.00", "0 pesewas -> GH₵0.00");
assertEqual(formatPesewasToGhs(150000), "GH₵1,500.00", "150000 pesewas -> GH₵1,500.00 with comma");
assertEqual(formatPesewasToGhs(5000, { useCode: true }), "GHS 50.00", "Format with GHS code");

// 2. Parsing tests
assertEqual(parseGhsToPesewas("50.00"), 5000, "Parse '50.00' -> 5000 pesewas");
assertEqual(parseGhsToPesewas("GH₵50.00"), 5000, "Parse 'GH₵50.00' -> 5000 pesewas");
assertEqual(parseGhsToPesewas("125.50"), 12550, "Parse '125.50' -> 12550 pesewas");
assertEqual(parseGhsToPesewas("GH₵125.50"), 12550, "Parse 'GH₵125.50' -> 12550 pesewas");
assertEqual(parseGhsToPesewas("1.00"), 100, "Parse '1.00' -> 100 pesewas");
assertEqual(parseGhsToPesewas("GH₵1.00"), 100, "Parse 'GH₵1.00' -> 100 pesewas");
assertEqual(parseGhsToPesewas("1,500.00"), 150000, "Parse '1,500.00' -> 150000 pesewas");
assertEqual(parseGhsToPesewas(50), 5000, "Parse number 50 -> 5000 pesewas");

// 3. Decimal string conversion
assertEqual(pesewasToDecimalString(5000), "50.00", "Decimal string 5000 -> '50.00'");
assertEqual(pesewasToDecimalString(12550), "125.50", "Decimal string 12550 -> '125.50'");
assertEqual(pesewasToDecimalString(100), "1.00", "Decimal string 100 -> '1.00'");

// 4. Line total calculation
assertEqual(calculateLineTotalPesewas(4500, 2, 500), 10000, "Line total: (4500 + 500) * 2 = 10000 pesewas");

// 5. Order total calculation
assertEqual(
  calculateOrderTotalPesewas({
    subtotalPesewas: 10000,
    deliveryFeePesewas: 1500,
    discountPesewas: 500,
  }),
  11000,
  "Order total: 10000 + 1500 - 500 = 11000 pesewas (GH₵110.00)"
);

// 6. Paystack mapping verification
assertEqual(pesewasToPaystackAmount(5000), 5000, "Paystack amount mapping: 5000 pesewas");

console.log("\n🎉 ALL CURRENCY TESTS PASSED WITH 100% ACCURACY!");
