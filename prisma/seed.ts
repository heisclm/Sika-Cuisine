/**
 * Sika Cuisine Database Seed Script
 * Location: Sunyani, Bono Region, Ghana
 *
 * NOTE: All monetary amounts are stored strictly as integer pesewas (1 GHS = 100 pesewas).
 * All menu items are realistic Ghanaian dishes clearly designated as placeholders
 * until finalized business assets are provided.
 */

import { PrismaClient, Role, FulfilmentType, FulfilmentStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Sika Cuisine Database Seed (Sunyani, Ghana)...");

  // 1. Clean existing records in referential order
  await prisma.auditLog.deleteMany();
  await prisma.paystackWebhookEvent.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.deliveryAddress.deleteMany();
  await prisma.menuItemOption.deleteMany();
  await prisma.menuItemOptionGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared existing database tables.");

  // 2. Seed Users
  const passwordSalt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("Admin123!@#", passwordSalt);
  const staffPasswordHash = await bcrypt.hash("Staff123!@#", passwordSalt);
  const customerPasswordHash = await bcrypt.hash("Customer123!@#", passwordSalt);

  const admin = await prisma.user.create({
    data: {
      email: "admin@sikacuisine.com",
      passwordHash: adminPasswordHash,
      fullName: "Sika Cuisine Administrator",
      phone: "+233 24 100 0001",
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@sikacuisine.com",
      passwordHash: staffPasswordHash,
      fullName: "Kitchen Staff Sunyani",
      phone: "+233 24 100 0002",
      role: Role.STAFF,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@sikacuisine.com",
      passwordHash: customerPasswordHash,
      fullName: "Kwame Mensah",
      phone: "+233 20 555 1234",
      role: Role.CUSTOMER,
    },
  });

  console.log("👤 Created initial users: Admin, Staff, and Customer.");

  // 3. Seed Sunyani Delivery Address for demo customer
  const customerAddress = await prisma.deliveryAddress.create({
    data: {
      customerId: customer.id,
      recipientName: "Kwame Mensah",
      recipientPhone: "+233 20 555 1234",
      streetAddress: "House No. 42, UENR Main Road",
      areaLocality: "Fiapre",
      landmark: "Opposite UENR Main Campus Gate",
      city: "Sunyani",
      deliveryNotes: "Call when you reach the gate security post.",
    },
  });

  // 4. Seed Menu Categories
  const catTraditional = await prisma.menuCategory.create({
    data: {
      name: "Traditional Ghanaian Mains",
      slug: "traditional-mains",
      description: "Authentic, hearty Ghanaian dishes prepared with slow-simmered spices and premium local ingredients.",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catGrills = await prisma.menuCategory.create({
    data: {
      name: "Appetizers & Street Grills",
      slug: "street-grills",
      description: "Irresistible small chops, skewered meats, and spiced delicacies straight off the charcoal grill.",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catSoups = await prisma.menuCategory.create({
    data: {
      name: "Soups & Stews",
      slug: "soups-stews",
      description: "Rich, aromatic Ghanaian stews and slow-simmered soups served with choice of traditional swallows.",
      sortOrder: 3,
      isActive: true,
    },
  });

  const catDrinks = await prisma.menuCategory.create({
    data: {
      name: "Chilled Local Beverages",
      slug: "local-beverages",
      description: "Refreshing, natural hand-crafted Ghanaian drinks infused with ginger, hibiscus, and tropical fruits.",
      sortOrder: 4,
      isActive: true,
    },
  });

  console.log("📂 Created 4 menu categories.");

  // 5. Seed Menu Items & Option Groups (Strictly Integer Pesewas)
  
  // Item 1: Sika Jollof Special (GH₵65.00 = 6500 pesewas)
  const itemJollof = await prisma.menuItem.create({
    data: {
      categoryId: catTraditional.id,
      name: "Sika Signature Jollof Special",
      slug: "sika-signature-jollof-special",
      description: "Fragrant jasmine rice slow-cooked in rich spiced tomato-rosemary stew, served with sweet fried plantain and homemade black shito.",
      basePricePesewas: 6500, // GH₵65.00
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 1,
      optionGroups: {
        create: [
          {
            name: "Choice of Protein",
            description: "Select your preferred grilled protein",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Charcoal Grilled Tilapia Half", priceDeltaPesewas: 2000, isAvailable: true }, // +GH₵20.00
                { name: "Spicy Fried Quarter Chicken", priceDeltaPesewas: 1500, isAvailable: true }, // +GH₵15.00
                { name: "Crispy Fried Red Fish", priceDeltaPesewas: 1800, isAvailable: true },       // +GH₵18.00
                { name: "Braised Spicy Goat Meat", priceDeltaPesewas: 2500, isAvailable: true },     // +GH₵25.00
              ],
            },
          },
          {
            name: "Pepper Sauce Level",
            minSelect: 0,
            maxSelect: 1,
            isRequired: false,
            options: {
              create: [
                { name: "Mild Shito", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Extra Spicy Black Shito", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Fresh Ground Green Chili Sauce", priceDeltaPesewas: 300, isAvailable: true }, // +GH₵3.00
              ],
            },
          },
        ],
      },
    },
  });

  // Item 2: Waakye Royale (GH₵60.00 = 6000 pesewas)
  await prisma.menuItem.create({
    data: {
      categoryId: catTraditional.id,
      name: "Waakye Royale Feast",
      slug: "waakye-royale-feast",
      description: "Traditional red sorghum-infused rice and black-eyed beans, served with talia (spaghetti), gari foto, boiled egg, tender wele, and dark shito.",
      basePricePesewas: 6000, // GH₵60.00
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 2,
      preparationTimeMinutes: 20,
      sortOrder: 2,
      optionGroups: {
        create: [
          {
            name: "Add Extra Meat",
            minSelect: 0,
            maxSelect: 2,
            isRequired: false,
            options: {
              create: [
                { name: "Fried Fish Cutlet", priceDeltaPesewas: 1500, isAvailable: true },
                { name: "Tender Stewed Beef Chunks", priceDeltaPesewas: 1800, isAvailable: true },
                { name: "Extra Soft Boiled Egg", priceDeltaPesewas: 500, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  // Item 3: Banku with Fresh Tilapia (GH₵75.00 = 7500 pesewas)
  await prisma.menuItem.create({
    data: {
      categoryId: catTraditional.id,
      name: "Banku with Grilled Tilapia & Hot Pepper",
      slug: "banku-with-grilled-tilapia",
      description: "Two steaming hot dumplings of fermented corn and cassava dough, served with whole seasoned grilled tilapia, freshly ground green hot pepper, and sliced onions.",
      basePricePesewas: 7500, // GH₵75.00
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 3,
      preparationTimeMinutes: 30,
      sortOrder: 3,
    },
  });

  // Item 4: Fufu with Light Goat Soup (GH₵80.00 = 8000 pesewas)
  await prisma.menuItem.create({
    data: {
      categoryId: catSoups.id,
      name: "Pounded Fufu with Light Goat Soup",
      slug: "fufu-with-light-goat-soup",
      description: "Silky pounded plantain and cassava swallow submerged in a rich, deeply aromatic spiced tomato soup with generous cuts of tender local goat meat.",
      basePricePesewas: 8000, // GH₵80.00
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 1,
    },
  });

  // Item 5: Kelewele (GH₵25.00 = 2500 pesewas)
  await prisma.menuItem.create({
    data: {
      categoryId: catGrills.id,
      name: "Golden Spiced Kelewele",
      slug: "golden-spiced-kelewele",
      description: "Bite-sized cubes of ripe plantain marinated in freshly crushed ginger, cayenne chili pepper, cloves, and nutmeg, fried to golden perfection and paired with roasted peanuts.",
      basePricePesewas: 2500, // GH₵25.00
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 15,
      sortOrder: 1,
    },
  });

  // Item 6: Suya Beef Skewers (GH₵45.00 = 4500 pesewas)
  await prisma.menuItem.create({
    data: {
      categoryId: catGrills.id,
      name: "Charcoal Suya Beef Skewers (Chichinga)",
      slug: "suya-beef-skewers",
      description: "Four skewers of thinly sliced beef flank rubbed with northern Yaji spice blend, flash-grilled over charcoal embers and garnished with sharp red onions.",
      basePricePesewas: 4500, // GH₵45.00
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 3,
      preparationTimeMinutes: 20,
      sortOrder: 2,
    },
  });

  // Item 7: House Special Iced Sobolo (GH₵15.00 = 1500 pesewas)
  await prisma.menuItem.create({
    data: {
      categoryId: catDrinks.id,
      name: "House Special Chilled Sobolo",
      slug: "house-special-chilled-sobolo",
      description: "Deep ruby hibiscus flower brew steeped with fiery ginger, sweet pineapple juice, cloves, and mint leaves, served cold over ice.",
      basePricePesewas: 1500, // GH₵15.00
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 1,
      preparationTimeMinutes: 5,
      sortOrder: 1,
    },
  });

  // Item 8: Fresh Creamy Asaana (GH₵18.00 = 1800 pesewas)
  await prisma.menuItem.create({
    data: {
      categoryId: catDrinks.id,
      name: "Sunyani Chilled Asaana with Milk",
      slug: "sunyani-chilled-asaana",
      description: "Traditional fermented crushed corn nectar naturally caramelized and chilled, served with creamy evaporated milk.",
      basePricePesewas: 1800, // GH₵18.00
      imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 0,
      preparationTimeMinutes: 5,
      sortOrder: 2,
    },
  });

  console.log("🍲 Seeded 8 authentic Ghanaian menu items with options.");

  // 6. Seed a sample order with status history for customer
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: "SIKA-2026-1001",
      customerId: customer.id,
      guestEmail: customer.email,
      guestPhone: customer.phone,
      guestName: customer.fullName,
      fulfilmentType: FulfilmentType.DELIVERY,
      fulfilmentStatus: FulfilmentStatus.PREPARING,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.PAYSTACK,
      subtotalPesewas: 8500,      // GH₵85.00 (Jollof GH₵65 + Grilled Tilapia GH₵20)
      deliveryFeePesewas: 1500,   // GH₵15.00 (Sunyani Fiapre zone)
      discountPesewas: 0,
      totalPesewas: 10000,        // GH₵100.00
      customerNotes: "Please make the shito very spicy.",
      deliveryAddressId: customerAddress.id,
      estimatedDeliveryMinutes: 35,
      items: {
        create: [
          {
            menuItemId: itemJollof.id,
            itemNameSnapshot: "Sika Signature Jollof Special",
            unitPricePesewas: 6500,
            quantity: 1,
            subtotalPesewas: 8500,
            selectedOptionsSnapshot: [
              {
                optionGroupId: "opt-protein",
                groupName: "Choice of Protein",
                optionId: "opt-tilapia",
                optionName: "Charcoal Grilled Tilapia Half",
                priceDeltaPesewas: 2000,
              },
              {
                optionGroupId: "opt-pepper",
                groupName: "Pepper Sauce Level",
                optionId: "opt-extra-shito",
                optionName: "Extra Spicy Black Shito",
                priceDeltaPesewas: 0,
              },
            ],
            specialInstructions: "Pack shito in separate cup.",
          },
        ],
      },
      statusHistory: {
        create: [
          {
            fromStatus: null,
            toStatus: FulfilmentStatus.PENDING_CONFIRMATION,
            note: "Order placed online by customer.",
          },
          {
            fromStatus: FulfilmentStatus.PENDING_CONFIRMATION,
            toStatus: FulfilmentStatus.CONFIRMED,
            note: "Order confirmed by Sunyani kitchen staff.",
            changedByUserId: staff.id,
          },
          {
            fromStatus: FulfilmentStatus.CONFIRMED,
            toStatus: FulfilmentStatus.PREPARING,
            note: "Chef started grilling tilapia and assembling jollof pack.",
            changedByUserId: staff.id,
          },
        ],
      },
      paymentAttempts: {
        create: [
          {
            reference: "PSK_TEST_SIKA_1001",
            amountPesewas: 10000,
            currency: "GHS",
            status: "SUCCESS",
            channel: "mobile_money",
            providerMetadata: {
              gateway_response: "Successful",
              channel: "mobile_money",
              brand: "MTN",
            },
          },
        ],
      },
    },
  });

  console.log(`📦 Seeded sample active order: ${sampleOrder.orderNumber}`);
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
