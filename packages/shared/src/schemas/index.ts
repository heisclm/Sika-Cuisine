import { z } from "zod";

export const phoneRegex = /^(?:\+233|0)[235][0-9]{8}$/;

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(
      phoneRegex,
      "Please enter a valid Ghanaian phone number (e.g. 0244123456 or +233244123456)."
    ),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required."),
  quantity: z
    .number()
    .int("Quantity must be an integer.")
    .positive("Quantity must be at least 1.")
    .max(50, "Maximum 50 portions per item."),
  selectedOptionIds: z.array(z.string()).default([]),
  specialInstructions: z.string().max(250, "Instructions cannot exceed 250 characters.").optional(),
});

export const deliveryAddressInputSchema = z.object({
  recipientName: z.string().trim().min(2, "Recipient name is required."),
  recipientPhone: z.string().trim().regex(phoneRegex, "Valid Ghanaian phone number is required."),
  alternatePhone: z.string().trim().regex(phoneRegex).optional().or(z.literal("")),
  streetAddress: z.string().trim().min(3, "Street address / location is required."),
  areaLocality: z.string().trim().min(2, "Locality / suburb is required."),
  landmark: z.string().trim().optional(),
  city: z.string().trim().default("Sunyani"),
  deliveryNotes: z.string().trim().max(300).optional(),
});

export const createOrderSchema = z
  .object({
    fulfilmentType: z.enum(["DELIVERY", "COLLECTION"]),
    paymentMethod: z.enum(["PAYSTACK", "CASH_ON_DELIVERY", "CASH_ON_COLLECTION"]),
    customerInfo: z.object({
      fullName: z.string().trim().min(2, "Full name is required."),
      email: z.string().trim().email("Valid email is required."),
      phone: z.string().trim().regex(phoneRegex, "Valid Ghanaian phone number is required."),
    }),
    deliveryAddress: deliveryAddressInputSchema.optional(),
    items: z
      .array(orderItemInputSchema)
      .min(1, "Your cart must contain at least one dish."),
    customerNotes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    // If fulfilment is DELIVERY, deliveryAddress is mandatory
    if (data.fulfilmentType === "DELIVERY" && !data.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Delivery address is required for home or office delivery.",
        path: ["deliveryAddress"],
      });
    }

    // CASH_ON_COLLECTION is only valid for COLLECTION
    if (data.paymentMethod === "CASH_ON_COLLECTION" && data.fulfilmentType !== "COLLECTION") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cash on Collection is only applicable for pickup orders.",
        path: ["paymentMethod"],
      });
    }

    // CASH_ON_DELIVERY is only valid for DELIVERY
    if (data.paymentMethod === "CASH_ON_DELIVERY" && data.fulfilmentType !== "DELIVERY") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cash on Delivery is only applicable for delivery orders.",
        path: ["paymentMethod"],
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  targetStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_DISPATCH",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "READY_FOR_PICKUP",
    "COLLECTED",
    "CANCELLED",
    "REJECTED",
  ]),
  note: z.string().max(250).optional(),
  rejectionReason: z.string().max(250).optional(),
  cancellationReason: z.string().max(250).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type DeliveryAddressInput = z.infer<typeof deliveryAddressInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
