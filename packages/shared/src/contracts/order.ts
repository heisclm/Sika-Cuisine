export type Role =
  | "CUSTOMER"
  | "STAFF_CASHIER"
  | "STAFF_KITCHEN"
  | "DELIVERY_RIDER"
  | "ADMIN";

export type FulfilmentType = "DELIVERY" | "COLLECTION";

export type FulfilmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_DISPATCH"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "READY_FOR_PICKUP"
  | "COLLECTED"
  | "CANCELLED"
  | "REJECTED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod =
  | "PAYSTACK"
  | "CASH_ON_DELIVERY"
  | "CASH_ON_COLLECTION";

export interface DeliveryAddressDTO {
  id?: string;
  recipientName: string;
  recipientPhone: string;
  alternatePhone?: string;
  streetAddress: string;
  areaLocality: string;
  landmark?: string;
  city: string;
  deliveryNotes?: string;
}

export interface SelectedOptionDTO {
  optionGroupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaPesewas: number;
}

export interface OrderItemDTO {
  id: string;
  orderId?: string;
  menuItemId?: string | null;
  itemNameSnapshot: string;
  unitPricePesewas: number;
  quantity: number;
  subtotalPesewas: number;
  selectedOptionsSnapshot: SelectedOptionDTO[];
  specialInstructions?: string | null;
}

export interface OrderStatusHistoryDTO {
  id: string;
  orderId: string;
  fromStatus: FulfilmentStatus | null;
  toStatus: FulfilmentStatus;
  note?: string | null;
  changedByUserId?: string | null;
  changedByName?: string | null;
  createdAt: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestName?: string | null;

  fulfilmentType: FulfilmentType;
  fulfilmentStatus: FulfilmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  subtotalPesewas: number;
  deliveryFeePesewas: number;
  discountPesewas: number;
  totalPesewas: number;

  customerNotes?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  estimatedDeliveryMinutes: number;

  deliveryAddress?: DeliveryAddressDTO | null;
  items: OrderItemDTO[];
  statusHistory?: OrderStatusHistoryDTO[];

  createdAt: string;
  updatedAt: string;
}

/**
 * Sanitized public order status payload for tracking without exposing PII
 */
export interface PublicOrderTrackingDTO {
  orderNumber: string;
  fulfilmentType: FulfilmentType;
  fulfilmentStatus: FulfilmentStatus;
  paymentStatus: PaymentStatus;
  estimatedDeliveryMinutes: number;
  createdAt: string;
  itemsSummary: {
    itemName: string;
    quantity: number;
  }[];
  timeline: {
    status: FulfilmentStatus;
    timestamp: string;
    note?: string | null;
  }[];
}
