/**
 * @file prisma/seed.ts
 * @description Idempotent PostgreSQL seed script for Sika Cuisine (Sunyani, Ghana).
 * Seeds operational role accounts, restaurant settings, Sunyani delivery zones,
 * the full 9-category / 36-dish menu catalog, and sample orders for kitchen & rider views.
 */

import {
  FulfilmentStatus,
  FulfilmentType,
  PaymentAttemptStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  FALLBACK_MENU_CATEGORIES,
  FALLBACK_MENU_ITEMS,
} from "../apps/web/src/lib/menu-catalog";
import { SUNYANI_DELIVERY_ZONES } from "../packages/shared/src/utils/delivery-zones";

const prisma = new PrismaClient();

async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function seedUsers() {
  const isProd = process.env.NODE_ENV === "production";
  const allowDemoSeed = process.env.ALLOW_DEMO_SEED === "true";

  if (isProd && !allowDemoSeed) {
    const adminPass = process.env.SEED_ADMIN_PASSWORD?.trim();
    const adminEmail =
      process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || "admin@sikacuisine.com";
    const usersByEmail = new Map<string, { id: string; email: string }>();

    if (!adminPass || adminPass.length < 12) {
      console.warn(
        "Skipping user creation in production seed: set SEED_ADMIN_PASSWORD (>= 12 chars) or provision accounts via Admin."
      );
      return usersByEmail;
    }

    const passwordHash = await hashPassword(adminPass);
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { fullName: "Sika Administrator", role: Role.ADMIN, isActive: true },
      create: {
        email: adminEmail,
        passwordHash,
        fullName: "Sika Administrator",
        phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "0533376760",
        role: Role.ADMIN,
        isActive: true,
      },
      select: { id: true, email: true },
    });
    usersByEmail.set(adminEmail, adminUser);
    return usersByEmail;
  }

  const accounts: Array<{
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: Role;
  }> = [
    {
      email: "admin@sikacuisine.com",
      password: process.env.SEED_ADMIN_PASSWORD || "Admin123!@#",
      fullName: "Sika Administrator",
      phone: "0533376760",
      role: Role.ADMIN,
    },
    {
      email: "staff@sikacuisine.com",
      password: process.env.SEED_STAFF_PASSWORD || "Staff123!@#",
      fullName: "Sika Kitchen Lead",
      phone: "0240000002",
      role: Role.STAFF_KITCHEN,
    },
    {
      email: "cashier@sikacuisine.com",
      password: process.env.SEED_CASHIER_PASSWORD || "Cashier123!@#",
      fullName: "Sika Cashier",
      phone: "0240000003",
      role: Role.STAFF_CASHIER,
    },
    {
      email: "rider@sikacuisine.com",
      password: process.env.SEED_RIDER_PASSWORD || "Rider123!@#",
      fullName: "Kofi Rider",
      phone: "0240000004",
      role: Role.DELIVERY_RIDER,
    },
    {
      email: "customer@sikacuisine.com",
      password: process.env.SEED_CUSTOMER_PASSWORD || "Customer123!@#",
      fullName: "Ama Serwaa",
      phone: "0244123456",
      role: Role.CUSTOMER,
    },
  ];

  const usersByEmail = new Map<string, { id: string; email: string }>();

  for (const account of accounts) {
    const passwordHash = await hashPassword(account.password);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        fullName: account.fullName,
        phone: account.phone,
        role: account.role,
      },
      create: {
        email: account.email,
        passwordHash,
        fullName: account.fullName,
        phone: account.phone,
        role: account.role,
      },
      select: { id: true, email: true },
    });
    usersByEmail.set(account.email, user);
  }

  return usersByEmail;
}

async function seedRestaurantAndZones() {
  await prisma.restaurantSettings.upsert({
    where: { id: "default" },
    update: {
      name: process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Sika Cuisine",
      phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "0533376760",
      whatsapp: process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || "+233533376760",
      address:
        process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS ||
        "Commercial Street, Sunyani Central, Bono Region, Ghana",
    },
    create: {
      id: "default",
      name: process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Sika Cuisine",
      tagline: "Sunyani, Ghana",
      phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "0533376760",
      whatsapp: process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || "+233533376760",
      address:
        process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS ||
        "Commercial Street, Sunyani Central, Bono Region, Ghana",
      isAcceptingOrders: true,
      isDeliveryEnabled: true,
      isCollectionEnabled: true,
      weekdayHours: "10:00 AM - 10:00 PM",
      sundayHours: "12:00 PM - 9:00 PM",
    },
  });

  for (let i = 0; i < SUNYANI_DELIVERY_ZONES.length; i += 1) {
    const zone = SUNYANI_DELIVERY_ZONES[i];
    await prisma.deliveryZone.upsert({
      where: { slug: zone.id },
      update: {
        name: zone.name,
        description: zone.description,
        feePesewas: zone.feePesewas,
        estimatedMinutes: zone.estimatedMinutes,
        localities: zone.localities,
        isActive: true,
        sortOrder: i + 1,
      },
      create: {
        id: zone.id,
        slug: zone.id,
        name: zone.name,
        description: zone.description,
        feePesewas: zone.feePesewas,
        estimatedMinutes: zone.estimatedMinutes,
        localities: zone.localities,
        isActive: true,
        sortOrder: i + 1,
      },
    });
  }
}

async function seedMenuCatalog() {
  const categoryIdsBySlug = new Map<string, string>();

  for (const cat of FALLBACK_MENU_CATEGORIES) {
    const savedCat = await prisma.menuCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
    });
    categoryIdsBySlug.set(cat.slug, savedCat.id);
  }

  for (const item of FALLBACK_MENU_ITEMS) {
    const categoryId = categoryIdsBySlug.get(item.category.slug) ?? item.categoryId;
    const savedItem = await prisma.menuItem.upsert({
      where: { slug: item.slug },
      update: {
        categoryId,
        name: item.name,
        description: item.description,
        basePricePesewas: item.basePricePesewas,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        spiceLevel: item.spiceLevel,
        preparationTimeMinutes: item.preparationTimeMinutes,
        sortOrder: item.sortOrder,
      },
      create: {
        id: item.id,
        categoryId,
        name: item.name,
        slug: item.slug,
        description: item.description,
        basePricePesewas: item.basePricePesewas,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        spiceLevel: item.spiceLevel,
        preparationTimeMinutes: item.preparationTimeMinutes,
        sortOrder: item.sortOrder,
      },
    });

    for (const group of item.optionGroups) {
      const savedGroup = await prisma.menuItemOptionGroup.upsert({
        where: { id: group.id },
        update: {
          menuItemId: savedItem.id,
          name: group.name,
          description: group.description,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          isRequired: group.isRequired,
        },
        create: {
          id: group.id,
          menuItemId: savedItem.id,
          name: group.name,
          description: group.description,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          isRequired: group.isRequired,
        },
      });

      for (const opt of group.options) {
        await prisma.menuItemOption.upsert({
          where: { id: opt.id },
          update: {
            optionGroupId: savedGroup.id,
            name: opt.name,
            priceDeltaPesewas: opt.priceDeltaPesewas,
            isAvailable: opt.isAvailable,
          },
          create: {
            id: opt.id,
            optionGroupId: savedGroup.id,
            name: opt.name,
            priceDeltaPesewas: opt.priceDeltaPesewas,
            isAvailable: opt.isAvailable,
          },
        });
      }
    }
  }
}

async function seedSampleOrders(
  usersByEmail: Map<string, { id: string; email: string }>
) {
  const customer = usersByEmail.get("customer@sikacuisine.com");
  const rider = usersByEmail.get("rider@sikacuisine.com");
  const staff = usersByEmail.get("staff@sikacuisine.com");

  const jollofDish =
    FALLBACK_MENU_ITEMS.find((i) => i.slug === "pkg-grilled-chicken-jollof-rice") ??
    FALLBACK_MENU_ITEMS[0];
  const tilapiaExtra =
    FALLBACK_MENU_ITEMS.find((i) => i.slug === "extra-grilled-tilapia") ??
    FALLBACK_MENU_ITEMS[1];

  // Sample Order 1: Paid Paystack order actively in kitchen preparation
  const existing1 = await prisma.order.findUnique({
    where: { orderNumber: "SIKA-2026-1001" },
  });

  if (!existing1 && jollofDish) {
    const address1 = await prisma.deliveryAddress.create({
      data: {
        customerId: customer?.id ?? null,
        recipientName: "Ama Serwaa",
        recipientPhone: "0244123456",
        streetAddress: "Plot 14, UENR Hostel Road",
        areaLocality: "Fiapre",
        landmark: "Near UENR Main Gate",
        city: "Sunyani",
      },
    });

    const subtotal = jollofDish.basePricePesewas * 2;
    const deliveryFee = SUNYANI_DELIVERY_ZONES[0].feePesewas; // Zone 1 (800 pesewas)
    const total = subtotal + deliveryFee;

    await prisma.order.create({
      data: {
        orderNumber: "SIKA-2026-1001",
        customerId: customer?.id ?? null,
        guestEmail: "customer@sikacuisine.com",
        guestPhone: "0244123456",
        guestName: "Ama Serwaa",
        fulfilmentType: FulfilmentType.DELIVERY,
        fulfilmentStatus: FulfilmentStatus.PREPARING,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.PAYSTACK,
        subtotalPesewas: subtotal,
        deliveryFeePesewas: deliveryFee,
        discountPesewas: 0,
        totalPesewas: total,
        deliveryAddressId: address1.id,
        estimatedDeliveryMinutes: 30,
        customerNotes: "Extra shito on the side please.",
        items: {
          create: [
            {
              menuItemId: jollofDish.id,
              itemNameSnapshot: jollofDish.name,
              unitPricePesewas: jollofDish.basePricePesewas,
              quantity: 2,
              subtotalPesewas: subtotal,
              selectedOptionsSnapshot: [],
            },
          ],
        },
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: FulfilmentStatus.PENDING,
              note: "Order submitted via web storefront.",
              changedByUserId: customer?.id ?? null,
            },
            {
              fromStatus: FulfilmentStatus.PENDING,
              toStatus: FulfilmentStatus.PREPARING,
              note: "Payment confirmed and kitchen began preparation.",
              changedByUserId: staff?.id ?? null,
            },
          ],
        },
        paymentAttempts: {
          create: [
            {
              provider: PaymentMethod.PAYSTACK,
              reference: "SIKA-SEED-PAY-1001",
              amountPesewas: total,
              currency: "GHS",
              status: PaymentAttemptStatus.SUCCESS,
              channel: "mobile_money",
            },
          ],
        },
      },
    });
  }

  // Sample Order 2: Ready for dispatch, pre-assigned to seeded delivery rider
  const existing2 = await prisma.order.findUnique({
    where: { orderNumber: "SIKA-2026-1002" },
  });

  if (!existing2 && tilapiaExtra) {
    const address2 = await prisma.deliveryAddress.create({
      data: {
        customerId: customer?.id ?? null,
        recipientName: "Kwaku Mensah",
        recipientPhone: "0248881234",
        streetAddress: "Block C, Sunyani Estates",
        areaLocality: "Estate",
        landmark: "Opposite Presby School",
        city: "Sunyani",
      },
    });

    const subtotal = tilapiaExtra.basePricePesewas;
    const deliveryFee = SUNYANI_DELIVERY_ZONES[1].feePesewas; // Zone 2 (1200 pesewas)
    const total = subtotal + deliveryFee;

    await prisma.order.create({
      data: {
        orderNumber: "SIKA-2026-1002",
        customerId: customer?.id ?? null,
        guestEmail: "kwaku.mensah@example.com",
        guestPhone: "0248881234",
        guestName: "Kwaku Mensah",
        fulfilmentType: FulfilmentType.DELIVERY,
        fulfilmentStatus: FulfilmentStatus.READY_FOR_DISPATCH,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        subtotalPesewas: subtotal,
        deliveryFeePesewas: deliveryFee,
        discountPesewas: 0,
        totalPesewas: total,
        deliveryAddressId: address2.id,
        assignedRiderId: rider?.id ?? null,
        estimatedDeliveryMinutes: 40,
        customerNotes: "Call upon reaching gate.",
        items: {
          create: [
            {
              menuItemId: tilapiaExtra.id,
              itemNameSnapshot: tilapiaExtra.name,
              unitPricePesewas: tilapiaExtra.basePricePesewas,
              quantity: 1,
              subtotalPesewas: subtotal,
              selectedOptionsSnapshot: [],
            },
          ],
        },
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: FulfilmentStatus.PENDING,
              note: "Order received for delivery.",
            },
            {
              fromStatus: FulfilmentStatus.PENDING,
              toStatus: FulfilmentStatus.READY_FOR_DISPATCH,
              note: "Prepared and assigned to rider for dispatch.",
              changedByUserId: staff?.id ?? null,
            },
          ],
        },
      },
    });
  }
}

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const allowDemoSeed = process.env.ALLOW_DEMO_SEED === "true";

  console.log("Seeding Sika Cuisine database...");
  const usersByEmail = await seedUsers();
  await seedRestaurantAndZones();
  await seedMenuCatalog();
  if (!isProd || allowDemoSeed) {
    await seedSampleOrders(usersByEmail);
  } else {
    console.log("Skipping demo sample orders in production mode.");
  }
  console.log(
    `Seed complete: ${FALLBACK_MENU_CATEGORIES.length} categories, ${FALLBACK_MENU_ITEMS.length} dishes, ${SUNYANI_DELIVERY_ZONES.length} Sunyani zones.`
  );
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
