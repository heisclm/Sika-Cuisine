# Sika Cuisine — Paystack Payment Lifecycle & Integration Guide

## Overview

Sika Cuisine integrates Paystack as the primary online payment gateway for Ghana (GHS).

### Supported Payment Channels
- **MTN Mobile Money**
- **Telecel Cash**
- **AT Money**
- **Visa & Mastercard Debit/Credit Cards**

---

## 1. Currency Unit Mapping (Critical)

> [!IMPORTANT]
> For Ghanaian Cedi (`currency: "GHS"`), Paystack API expects the transaction amount in **integer pesewas** (the lowest currency denomination of GHS).
> - $\text{GH₵}50.00 = 5000\text{ pesewas}$.
> - $\text{GH₵}125.50 = 12550\text{ pesewas}$.
> - $\text{GH₵}1.00 = 100\text{ pesewas}$ (Paystack minimum transaction threshold).
>
> Sika Cuisine's internal integer pesewas format maps 1:1 with Paystack's API without floating-point conversion.

---

## 2. Payment Flow

1. Customer submits checkout details via `createOrderAction`.
2. Backend computes authoritative order total in integer pesewas.
3. Server invokes `initializePaystackTransaction`:
   - Endpoint: `POST https://api.paystack.co/transaction/initialize`
   - Headers: `Authorization: Bearer PAYSTACK_SECRET_KEY`
   - Body: `{ email, amount, currency: "GHS", reference, callback_url }`
4. Paystack returns `authorization_url`. Customer is redirected to complete payment.
5. Paystack delivers webhook to `/api/webhooks/paystack`.
6. Webhook verifies HMAC SHA512 signature and updates order to `paymentStatus: PAID`.
7. Customer browser callback verifies transaction and renders confirmation page.
