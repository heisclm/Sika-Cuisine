export type UserRole =
  | "CUSTOMER"
  | "STAFF_CASHIER"
  | "STAFF_KITCHEN"
  | "DELIVERY_RIDER"
  | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface RiderShiftStats {
  todayCompletedCount: number;
  activeCount: number;
  totalCodCollectedPesewas: number;
  earnedCommissionPesewas: number;
  onDuty: boolean;
}

export interface RiderDeliveryTask {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  recipientAddress: string;
  locality: string;
  landmark?: string;
  deliveryFeePesewas: number;
  totalPesewas: number;
  paymentMethod: "PAYSTACK" | "CASH_ON_DELIVERY";
  paymentStatus: "PAID" | "PENDING";
  itemsSummary: string;
  createdAt: string;
  estimatedDeliveryMinutes: number;
  customerNotes?: string;
  status: "ASSIGNED" | "PICKED_UP" | "DELIVERED";
}
