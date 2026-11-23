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

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUND_PENDING"
  | "REFUNDED";

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
  imageUrl?: string | null;
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
  primaryImageUrl?: string | null;
  latestPaymentReference?: string | null;

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
  paymentMethod?: PaymentMethod;
  totalPesewas?: number;
  latestPaymentReference?: string | null;
  primaryImageUrl?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
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

export interface ReorderItemDTO {
  menuItem: {
    id: string;
    categoryId: string;
    categoryName?: string;
    name: string;
    slug: string;
    description: string;
    basePricePesewas: number;
    imageUrl: string;
    isAvailable: boolean;
    isFeatured: boolean;
    spiceLevel: number;
    preparationTimeMinutes: number;
    sortOrder: number;
  };
  quantity: number;
  selectedOptions: SelectedOptionDTO[];
  specialInstructions?: string;
  liveUnitPricePesewas: number;
  liveLineTotalPesewas: number;
  priceChanged: boolean;
}

export interface ReorderResponseDTO {
  success: boolean;
  orderNumber: string;
  itemsToAdd: ReorderItemDTO[];
  unavailableItems: Array<{ itemName: string; reason: string }>;
  adjustedOptions: Array<{ itemName: string; droppedOption: string }>;
}

export interface InAppNotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  orderNumber?: string | null;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}
