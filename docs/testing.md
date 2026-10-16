# Sika Cuisine — Testing & Verification Strategy

## 1. Automated Currency Unit Testing

The currency engine was verified via `scripts/test-currency.ts` ensuring:
- Integer pesewas to GHS formatting (`formatPesewasToGhs`)
- GHS string parsing to integer pesewas (`parseGhsToPesewas`)
- Decimal string generation (`pesewasToDecimalString`)
- Line total calculations with options deltas
- Order grand total arithmetic
- Paystack amount unit mapping

### Running the Test
```bash
node scripts/test-currency.ts
```
**Result:** 100% of currency test assertions passed.

---

## 2. Type Safety Verification

TypeScript static analysis is verified with zero errors:
```bash
npx tsc --noEmit
```
**Result:** Codebase compiles with zero type errors.

---

## 3. Production Build Compilation

Next.js Turbopack production build was compiled and verified:
```bash
npm run build
```
**Result:** All 10 application routes compiled and optimized successfully.
