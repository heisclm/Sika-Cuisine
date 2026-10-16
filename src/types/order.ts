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
  areaLocality: string;
  landmark?: string;
  city: string;
  deliveryNotes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemNameSnapshot: string;
  unitPricePesewas: number;
  quantity: number;
  subtotalPesewas: number;
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
