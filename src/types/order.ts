/**
 * Order Domain Contracts for Sika Cuisine (Sunyani, Ghana)
 */
import { SelectedOptionSnapshot } from "./menu";

export type FulfilmentType = "DELIVERY" | "COLLECTION";

export type FulfilmentStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_COLLECTION"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod =
  | "PAYSTACK"
  | "CASH_ON_DELIVERY"
  | "CASH_ON_COLLECTION";

export interface DeliveryAddress {
  id?: string;
  recipientName: string;
  recipientPhone: string;
  alternatePhone?: string;
  streetAddress: string;
  areaLocality: string; // e.g. "Fiapre", "Berlin Top", "Sunyani Central"
  landmark?: string;    // e.g. "Opposite UENR Main Gate", "Near Coronation Park"
  city: string;         // Defaults to "Sunyani"
  deliveryNotes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  /** Immutable snapshot of item name at time of order */
  itemNameSnapshot: string;
  /** Immutable unit price in integer pesewas at time of order */
  unitPricePesewas: number;
  quantity: number;
  /** Total line cost in integer pesewas */
  subtotalPesewas: number;
  /** Immutable snapshot of selected options and their price deltas */
  selectedOptionsSnapshot: SelectedOptionSnapshot[];
  specialInstructions?: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: FulfilmentStatus | null;
  toStatus: FulfilmentStatus;
  note?: string;
  changedByUserId?: string;
  changedByUserName?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "SIKA-2026-8942"
  customerId?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestName?: string | null;

  fulfilmentType: FulfilmentType;
  fulfilmentStatus: FulfilmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  /** Stored strictly in integer pesewas */
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  discountPesewas: number;
  totalPesewas: number;

  customerNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;

  deliveryAddress?: DeliveryAddress | null;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];

  paymentReference?: string;
  estimatedDeliveryMinutes?: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Payload sent by client when requesting order creation.
 * Notice: NO prices, discounts, or totals are accepted from the client.
 */
export interface CreateOrderInput {
  fulfilmentType: FulfilmentType;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  customerInfo: {
    fullName: string;
    phone: string;
    email: string;
  };
  deliveryAddress?: {
    recipientName: string;
    recipientPhone: string;
    streetAddress: string;
    areaLocality: string;
    landmark?: string;
    city?: string;
  };
  items: {
    menuItemId: string;
    quantity: number;
    selectedOptionIds: string[];
    specialInstructions?: string;
  }[];
}
