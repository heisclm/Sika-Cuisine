import { PrismaClient, Role, FulfilmentType, FulfilmentStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Sika Cuisine database with official menu catalog...");

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

  const passwordSalt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("Admin123!@#", passwordSalt);
  const staffPasswordHash = await bcrypt.hash("Staff123!@#", passwordSalt);
  const customerPasswordHash = await bcrypt.hash("Customer123!@#", passwordSalt);

  await prisma.user.create({
    data: {
      email: "admin@sikacuisine.com",
      passwordHash: adminPasswordHash,
      fullName: "Sika Cuisine Administrator",
      phone: "+233 53 337 6760",
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@sikacuisine.com",
      passwordHash: staffPasswordHash,
      fullName: "Kitchen Staff Sunyani",
      phone: "+233 55 440 6681",
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

  const customerAddress = await prisma.deliveryAddress.create({
    data: {
      customerId: customer.id,
      recipientName: "Kwame Mensah",
      recipientPhone: "+233 20 555 1234",
      streetAddress: "House No. 42, UENR Main Road",
      areaLocality: "Fiapre & UENR Campus",
      landmark: "Opposite UENR Main Campus Gate",
      city: "Sunyani",
      deliveryNotes: "Call when you reach the gate security post.",
    },
  });

  const catPackages = await prisma.menuCategory.create({
    data: {
      name: "Package",
      slug: "packages",
      description: "Quick, fulfilling combinations of seasoned grilled or fried chicken with fragrant Ghanaian rice.",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catLocals = await prisma.menuCategory.create({
    data: {
      name: "Locals",
      slug: "locals",
      description: "Traditional Ghanaian comfort staples prepared with slow-simmered stews, soups, and authentic swallows.",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catSeafood = await prisma.menuCategory.create({
    data: {
      name: "Seafood",
      slug: "seafood",
      description: "Fresh daily catch grilled or fried to perfection, served with authentic sides and hot pepper.",
      sortOrder: 3,
      isActive: true,
    },
  });

  const catSauces = await prisma.menuCategory.create({
    data: {
      name: "Sauce",
      slug: "sauces",
      description: "Slow-simmered savory sauces packed with tender proteins, served with steamed rice.",
      sortOrder: 4,
      isActive: true,
    },
  });

  const catAssorted = await prisma.menuCategory.create({
    data: {
      name: "Sika Assorted",
      slug: "sika-assorted",
      description: "Signature Ghanaian jollof rice wok-infused with seasoned cuts of meat, seafood, and vegetables.",
      sortOrder: 5,
      isActive: true,
    },
  });

  const catFruitRice = await prisma.menuCategory.create({
    data: {
      name: "Sika Fruit Rice",
      slug: "sika-fruit-rice",
      description: "Exotic specialty rice creations combining sweet tropical fruits with savory spices.",
      sortOrder: 6,
      isActive: true,
    },
  });

  const catSpecials = await prisma.menuCategory.create({
    data: {
      name: "Sika Cuisine Special",
      slug: "sika-specials",
      description: "Chef's premier signature feasts, loaded platters, and house-special creations.",
      sortOrder: 7,
      isActive: true,
    },
  });

  const catPizza = await prisma.menuCategory.create({
    data: {
      name: "Pizza",
      slug: "pizza",
      description: "Stone-baked artisan pizzas with crispy hand-tossed dough and rich melted cheese toppings.",
      sortOrder: 8,
      isActive: true,
    },
  });

  const catExtras = await prisma.menuCategory.create({
    data: {
      name: "Extra (Sides)",
      slug: "extras",
      description: "A la carte portions of succulent grilled meats, tilapia, wings, and golden kelewele.",
      sortOrder: 9,
      isActive: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catPackages.id,
      name: "Grilled Chicken with Fried Rice",
      slug: "pkg-grilled-chicken-fried-rice",
      description: "Charcoal-grilled quarter chicken paired with fragrant vegetable fried rice and spicy shito.",
      basePricePesewas: 4000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 20,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catPackages.id,
      name: "Grilled Chicken with Jollof Rice",
      slug: "pkg-grilled-chicken-jollof-rice",
      description: "Charcoal-grilled spiced quarter chicken served alongside slow-simmered smoky Ghanaian jollof rice.",
      basePricePesewas: 4000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 2,
      preparationTimeMinutes: 20,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catPackages.id,
      name: "Fried Chicken with Rice",
      slug: "pkg-fried-chicken-rice",
      description: "Crispy seasoned fried chicken served with your choice of savory Ghanaian jollof or fried rice.",
      basePricePesewas: 4000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 20,
      sortOrder: 3,
      optionGroups: {
        create: [
          {
            name: "Choice of Rice",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Smoky Jollof Rice", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Vegetable Fried Rice", priceDeltaPesewas: 0, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Banku with Okro Soup",
      slug: "local-banku-okro",
      description: "Steaming hot corn and cassava dumplings served with rich, mucilaginous okro soup with your choice of protein.",
      basePricePesewas: 5000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 1,
      optionGroups: {
        create: [
          {
            name: "Choice of Protein",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Tender Braised Beef", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Crispy Fried Fish", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Grilled Chicken", priceDeltaPesewas: 0, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Omutuo (Rice Ball) with Groundnut Soup",
      slug: "local-omutuo-groundnut",
      description: "Silky soft pounded rice balls submerged in rich, savory roasted peanut soup.",
      basePricePesewas: 5000,
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 2,
      optionGroups: {
        create: [
          {
            name: "Choice of Protein",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Stewed Beef Cuts", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Fried Red Fish", priceDeltaPesewas: 0, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Tuo Zaafi (TZ) with Ayoyo Soup",
      slug: "local-tz",
      description: "Traditional northern millet swallow served with nutritious ayoyo greens and rich spiced meat sauce.",
      basePricePesewas: 5000,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 3,
      optionGroups: {
        create: [
          {
            name: "Choice of Protein",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Spicy Goat Meat", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Braised Beef", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Fried Fish", priceDeltaPesewas: 0, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Pounded Fufu with Light Soup",
      slug: "local-fufu-light-soup",
      description: "Freshly pounded cassava and plantain swallow in an aromatic spiced light tomato soup.",
      basePricePesewas: 5000,
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 4,
      optionGroups: {
        create: [
          {
            name: "Choice of Protein",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Tender Local Goat Meat", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Fresh Steamed Tilapia", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Fried Red Fish", priceDeltaPesewas: 0, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Red Red",
      slug: "local-red-red",
      description: "Slow-simmered black-eyed beans in spiced palm oil stew, paired with golden fried sweet plantains.",
      basePricePesewas: 5000,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 20,
      sortOrder: 5,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Boiled Yam with Fish & Egg Stew",
      slug: "local-boiled-yam-fish-egg-stew",
      description: "Tender boiled Pona yam slices served with garden egg and fresh tomato stew with fish.",
      basePricePesewas: 7000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 6,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Boiled Plantain with Fish & Egg Stew",
      slug: "local-boiled-plantain-fish-egg-stew",
      description: "Sweet boiled ripe/unripe plantain fingers served with savory egg and fish garden stew.",
      basePricePesewas: 7000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 7,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catLocals.id,
      name: "Boiled Yam with Palava Sauce & Fish",
      slug: "local-boiled-yam-palava-sauce",
      description: "Steamed yam chunks accompanied by rich kontomire (cocoyam leaves) and egusi melon seed sauce with fish.",
      basePricePesewas: 7000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 8,
    },
  });

  const itemTilapiaBanku = await prisma.menuItem.create({
    data: {
      categoryId: catSeafood.id,
      name: "Tilapia with Banku (Chilli)",
      slug: "seafood-tilapia-banku",
      description: "Whole succulent grilled tilapia paired with piping hot fermented corn dumplings and freshly ground chilli pepper.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 3,
      preparationTimeMinutes: 30,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSeafood.id,
      name: "Red Fish with Banku (Chilli)",
      slug: "seafood-red-fish-banku",
      description: "Crispy fried whole seasoned red fish served with piping hot banku, freshly ground pepper, and sliced onions.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 3,
      preparationTimeMinutes: 30,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSeafood.id,
      name: "Shrimps (Fried & Jollof Rice)",
      slug: "seafood-shrimps-rice",
      description: "Juicy jumbo shrimps sauteed with aromatic garlic and herbs, served with your choice of rice.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 3,
      optionGroups: {
        create: [
          {
            name: "Choice of Rice",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Jollof Rice", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Fried Rice", priceDeltaPesewas: 0, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSauces.id,
      name: "Beef Sauce with Steamed Rice",
      slug: "sauce-beef",
      description: "Tender shredded beef simmered in a rich garlic-ginger and soy glaze with mixed bell peppers.",
      basePricePesewas: 7000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSauces.id,
      name: "Chicken Sauce with Steamed Rice",
      slug: "sauce-chicken",
      description: "Juicy boneless chicken breast strips simmered in savory aromatic vegetable sauce.",
      basePricePesewas: 7000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSauces.id,
      name: "Gizzard Sauce with Steamed Rice",
      slug: "sauce-gizzard",
      description: "Spiced chewy chicken gizzards tossed in fiery peppered onion sauce, served over hot rice.",
      basePricePesewas: 7000,
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 3,
      preparationTimeMinutes: 25,
      sortOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catAssorted.id,
      name: "Beef Jollof Rice",
      slug: "assorted-beef-jollof",
      description: "Smoky Ghanaian jollof rice stir-cooked with tender, marinated beef cubes and aromatic spices.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catAssorted.id,
      name: "Chicken Jollof Rice",
      slug: "assorted-chicken-jollof",
      description: "Rich jollof rice cooked together with shredded grilled chicken, sweet carrots, and peas.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catAssorted.id,
      name: "Shrimps Jollof Rice",
      slug: "assorted-shrimps-jollof",
      description: "Premium jollof rice prepared with juicy ocean shrimps, fresh herbs, and homemade black shito.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catAssorted.id,
      name: "Vegetables Jollof Rice",
      slug: "assorted-vegetables-jollof",
      description: "Hearty vegetarian jollof packed with green beans, sweet corn, diced carrots, and rosemary.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 1,
      preparationTimeMinutes: 20,
      sortOrder: 4,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catFruitRice.id,
      name: "Pineapple Fried Rice",
      slug: "fruit-pineapple-fried-rice",
      description: "Wok-tossed fragrant jasmine rice infused with sweet caramelized Sunyani pineapples and crisp vegetables.",
      basePricePesewas: 9000,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 1,
      preparationTimeMinutes: 25,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catFruitRice.id,
      name: "Pineapple Jollof Rice",
      slug: "fruit-pineapple-jollof-rice",
      description: "A harmonious marriage of smoky Ghanaian tomato jollof and fresh golden pineapple sweetness.",
      basePricePesewas: 9000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catFruitRice.id,
      name: "Coconut Fried Rice",
      slug: "fruit-coconut-fried-rice",
      description: "Fluffy rice simmered in fresh coconut milk, stir-fried with scallions, sweet peppers, and mild herbs.",
      basePricePesewas: 9000,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 1,
      preparationTimeMinutes: 25,
      sortOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catFruitRice.id,
      name: "Coconut Jollof Rice",
      slug: "fruit-coconut-jollof-rice",
      description: "Sunyani specialty combining rich, creamy coconut milk into our slow-simmered jollof recipe.",
      basePricePesewas: 9000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 4,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catFruitRice.id,
      name: "Sika Fruit Salad",
      slug: "fruit-salad",
      description: "Chilled medley of Sunyani pawpaw, ripe sweet pineapple, watermelon, and crisp apple with natural honey.",
      basePricePesewas: 9000,
      imageUrl: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 0,
      preparationTimeMinutes: 10,
      sortOrder: 5,
    },
  });

  const itemSpecialCombo = await prisma.menuItem.create({
    data: {
      categoryId: catSpecials.id,
      name: "SIKA Special Combo (De Mixture)",
      slug: "special-combo-mixture",
      description: "Chef's ultimate showcase platter featuring a rich mixture of meats, fried plantains, sausages, and savory sides.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      spiceLevel: 2,
      preparationTimeMinutes: 30,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSpecials.id,
      name: "SIKA Fries with (Wings, Drums)",
      slug: "special-fries-wings-drums",
      description: "Crispy golden potato fries served with glazed barbecue chicken wings and seasoned drumsticks.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 25,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSpecials.id,
      name: "SIKA Assorted Noodles",
      slug: "special-assorted-noodles",
      description: "Stir-fried Asian noodles wok-tossed with beef strips, tender chicken, sausages, and fresh vegetables.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 20,
      sortOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catSpecials.id,
      name: "Loaded Fries",
      slug: "special-loaded-fries",
      description: "Heap of crispy french fries generously smothered in melted cheese sauce, minced meat, and herb drizzle.",
      basePricePesewas: 8000,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 1,
      preparationTimeMinutes: 20,
      sortOrder: 4,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catPizza.id,
      name: "Sika Artisan Oven Pizza",
      slug: "pizza-sika-artisan",
      description: "Crispy stone-baked pizza loaded with fresh tomato concasse, mozzarella cheese, and choice toppings.",
      basePricePesewas: 11000,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 1,
      preparationTimeMinutes: 30,
      sortOrder: 1,
      optionGroups: {
        create: [
          {
            name: "Select Pizza Size",
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: {
              create: [
                { name: "Mini Size (GH₵110)", priceDeltaPesewas: 0, isAvailable: true },
                { name: "Medium Size (GH₵140)", priceDeltaPesewas: 3000, isAvailable: true },
                { name: "Family Size (GH₵180)", priceDeltaPesewas: 7000, isAvailable: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catExtras.id,
      name: "Grilled Chicken Only",
      slug: "extra-grilled-chicken",
      description: "A la carte succulent spiced quarter chicken grilled over natural coals.",
      basePricePesewas: 2000,
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 15,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catExtras.id,
      name: "Wings Only",
      slug: "extra-wings",
      description: "Portion of crispy or glazed spicy chicken wings.",
      basePricePesewas: 4000,
      imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 15,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catExtras.id,
      name: "Drumstick Only",
      slug: "extra-drumstick",
      description: "Seasoned crispy fried or grilled chicken drumstick.",
      basePricePesewas: 2000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 1,
      preparationTimeMinutes: 15,
      sortOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catExtras.id,
      name: "Plantain Only (Kelewele)",
      slug: "extra-plantain",
      description: "Golden ripe fried plantain cubes seasoned with ginger, cayenne, and cloves.",
      basePricePesewas: 2000,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 2,
      preparationTimeMinutes: 10,
      sortOrder: 4,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: catExtras.id,
      name: "Grilled Tilapia Only",
      slug: "extra-grilled-tilapia",
      description: "Whole freshly caught seasoned charcoal-grilled tilapia with sliced onions and green chilli dip.",
      basePricePesewas: 6000,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: false,
      spiceLevel: 3,
      preparationTimeMinutes: 25,
      sortOrder: 5,
    },
  });

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
      subtotalPesewas: 8000,
      deliveryFeePesewas: 2000,
      discountPesewas: 0,
      totalPesewas: 10000,
      customerNotes: "Please deliver to the gate security post.",
      deliveryAddressId: customerAddress.id,
      estimatedDeliveryMinutes: 30,
      items: {
        create: [
          {
            menuItemId: itemSpecialCombo.id,
            itemNameSnapshot: "SIKA Special Combo (De Mixture)",
            unitPricePesewas: 8000,
            quantity: 1,
            subtotalPesewas: 8000,
            selectedOptionsSnapshot: [],
            specialInstructions: "Pack extra napkins.",
          },
        ],
      },
      statusHistory: {
        create: [
          {
            fromStatus: null,
            toStatus: FulfilmentStatus.PENDING_CONFIRMATION,
            note: "Order placed online.",
          },
          {
            fromStatus: FulfilmentStatus.PENDING_CONFIRMATION,
            toStatus: FulfilmentStatus.CONFIRMED,
            note: "Order confirmed by kitchen staff.",
            changedByUserId: staff.id,
          },
          {
            fromStatus: FulfilmentStatus.CONFIRMED,
            toStatus: FulfilmentStatus.PREPARING,
            note: "Food preparation underway.",
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

  console.log(`Seeded order: ${sampleOrder.orderNumber}`);
  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Database seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
