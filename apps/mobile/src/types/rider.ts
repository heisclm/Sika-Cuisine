import { FulfilmentStatus } from "@sika/shared";

/**
 * Assigned courier delivery order payload returned by `GET /api/v1/rider/orders`.
 */
export interface RiderOrder {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  guestPhone?: string | null;
  fulfilmentStatus: FulfilmentStatus;
  paymentMethod: string;
  paymentStatus: string;
  totalPesewas: number;
  customerNotes?: string | null;
  createdAt: string;
  deliveryAddress?: {
    recipientName: string;
    recipientPhone: string;
    streetAddress: string;
    areaLocality: string;
    landmark?: string | null;
    deliveryNotes?: string | null;
  } | null;
  items: Array<{
    id: string;
    itemNameSnapshot: string;
    quantity: number;
  }>;
}
