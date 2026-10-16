import { z } from "zod";

/**
 * Zod validation schema for customer delivery addresses in Sunyani, Ghana.
 */
export const deliveryAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "Recipient name must be at least 2 characters."),
  recipientPhone: z
    .string()
    .trim()
    .regex(
      /^(?:\+233|0)[235][0-9]{8}$/,
      "Enter a valid Ghanaian phone number (e.g., 0244123456 or +233244123456)."
    ),
  alternatePhone: z
    .string()
    .trim()
    .regex(/^(?:\+233|0)[235][0-9]{8}$/, "Invalid phone format.")
    .optional()
    .or(z.literal("")),
  streetAddress: z.string().trim().min(3, "Street / house address is required."),
  areaLocality: z.string().trim().min(2, "Sunyani locality is required (e.g., Fiapre, Berlin Top)."),
  landmark: z.string().trim().optional(),
  city: z.string().trim().default("Sunyani"),
  deliveryNotes: z.string().trim().max(300).optional(),
});

/**
 * Schema for an individual order item submitted by customer.
 * Note: Only IDs and quantity are submitted. The server looks up authoritative prices.
 */
export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required."),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").max(50, "Max 50 items per line."),
  selectedOptionIds: z.array(z.string()).default([]),
  specialInstructions: z.string().trim().max(250).optional(),
});

/**
 * Server-authoritative checkout input schema.
 * Rejects any client-submitted totals, line prices, discounts, or delivery fees.
 */
export const createOrderSchema = z.object({
  fulfilmentType: z.enum(["DELIVERY", "COLLECTION"]),
  paymentMethod: z.enum(["PAYSTACK", "CASH_ON_DELIVERY", "CASH_ON_COLLECTION"]),
  customerInfo: z.object({
    fullName: z.string().trim().min(2, "Full name is required."),
    phone: z
      .string()
      .trim()
      .regex(
        /^(?:\+233|0)[235][0-9]{8}$/,
        "Enter a valid Ghanaian phone number (e.g., 0244123456)."
      ),
    email: z.string().trim().email("Enter a valid email address for order receipt."),
  }),
  deliveryAddress: deliveryAddressSchema.optional(),
  items: z.array(orderItemInputSchema).min(1, "Cart cannot be empty."),
  customerNotes: z.string().trim().max(500).optional(),
}).refine(
  (data) => {
    // If delivery is chosen, a valid delivery address is mandatory
    if (data.fulfilmentType === "DELIVERY" && !data.deliveryAddress) {
      return false;
    }
    return true;
  },
  {
    message: "Delivery address is required when selecting Delivery fulfilment.",
    path: ["deliveryAddress"],
  }
);

export type CreateOrderInputSchema = z.infer<typeof createOrderSchema>;
