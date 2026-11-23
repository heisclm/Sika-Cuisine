/**
 * @file apps/web/src/lib/menu-catalog.ts
 * @description Authoritative local fallback catalog for Sika Cuisine Sunyani.
 *
 * Keeps local preview and seed pipelines (`prisma/seed.ts`) aligned whenever
 * `DATABASE_URL` is unconfigured in local development. Item IDs, option IDs, and
 * pesewas pricing strictly match PostgreSQL seed records, and every image points to
 * a bundled local asset under `public/images/dishes/`.
 */

export interface FallbackMenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface FallbackMenuItemOption {
  id: string;
  optionGroupId: string;
  name: string;
  priceDeltaPesewas: number;
  isAvailable: boolean;
}

export interface FallbackMenuItemOptionGroup {
  id: string;
  menuItemId: string;
  name: string;
  description: string | null;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: FallbackMenuItemOption[];
}

export interface FallbackMenuItem {
  id: string;
  categoryId: string;
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
  category: {
    id: string;
    name: string;
    slug: string;
  };
  optionGroups: FallbackMenuItemOptionGroup[];
}

export const FALLBACK_MENU_CATEGORIES: FallbackMenuCategory[] = [
  {
    id: "packages",
    name: "Packages",
    slug: "packages",
    description: "Complete chef-plated rice & grilled or crisp chicken meals with house shito.",
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "locals",
    name: "Locals",
    slug: "locals",
    description: "Traditional Ghanaian swallows, rich soups, yam, plantain, and Red Red.",
    imageUrl: "/images/dishes/fufu-goat-soup.jpg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "seafood",
    name: "Seafood",
    slug: "seafood",
    description: "Charcoal-grilled whole tilapia, red fish, and seasoned tiger shrimps.",
    imageUrl: "/images/dishes/tilapia-banku.jpg",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "sauces",
    name: "Sauce",
    slug: "sauces",
    description: "Slow-simmered savory beef, chicken, and gizzard sauces over steamed rice.",
    imageUrl: "/images/dishes/rice-specialty.jpg",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "sika-assorted",
    name: "Sika Assorted",
    slug: "sika-assorted",
    description: "Loaded Ghanaian jollof platters with generous proteins and vegetables.",
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "sika-fruit-rice",
    name: "Sika Fruit Rice",
    slug: "sika-fruit-rice",
    description: "Signature Sunyani pineapple and coconut rice dishes alongside fresh fruit bowls.",
    imageUrl: "/images/dishes/pineapple-rice.jpg",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "sika-specials",
    name: "Sika Cuisine Special",
    slug: "sika-specials",
    description: "House signature combos, loaded fries, assorted noodles, and sharing feasts.",
    imageUrl: "/images/dishes/signature-platter.jpg",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: "pizza",
    name: "Pizza",
    slug: "pizza",
    description: "Stone-baked hand-stretched pizzas in Mini, Medium, and Family sizes.",
    imageUrl: "/images/dishes/artisan-pizza.jpg",
    sortOrder: 8,
    isActive: true,
  },
  {
    id: "extras",
    name: "Extra (Sides)",
    slug: "extras",
    description: "A la carte grilled tilapia, chicken wings, drumsticks, and ripe kelewele.",
    imageUrl: "/images/dishes/fried-chicken.jpg",
    sortOrder: 9,
    isActive: true,
  },
];

const CATEGORY_MAP = new Map(FALLBACK_MENU_CATEGORIES.map((c) => [c.id, c]));

function makeCategoryRef(categoryId: string) {
  const found = CATEGORY_MAP.get(categoryId) ?? FALLBACK_MENU_CATEGORIES[0];
  return { id: found.id, name: found.name, slug: found.slug };
}

export const FALLBACK_MENU_ITEMS: FallbackMenuItem[] = [
  // Packages
  {
    id: "pkg-grilled-chicken-fried-rice",
    categoryId: "packages",
    name: "Grilled Chicken with Fried Rice",
    slug: "pkg-grilled-chicken-fried-rice",
    description: "Charcoal-grilled quarter chicken paired with fragrant vegetable fried rice and spicy house shito.",
    basePricePesewas: 4000,
    imageUrl: "/images/dishes/rice-specialty.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 1,
    category: makeCategoryRef("packages"),
    optionGroups: [],
  },
  {
    id: "pkg-grilled-chicken-jollof-rice",
    categoryId: "packages",
    name: "Grilled Chicken with Jollof Rice",
    slug: "pkg-grilled-chicken-jollof-rice",
    description: "Slow-simmered smoky Ghanaian tomato Jollof rice served with aromatic grilled chicken and chilli sauce.",
    basePricePesewas: 4000,
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 2,
    category: makeCategoryRef("packages"),
    optionGroups: [],
  },
  {
    id: "pkg-fried-chicken-rice",
    categoryId: "packages",
    name: "Fried Chicken with Rice",
    slug: "pkg-fried-chicken-rice",
    description: "Crisp golden fried chicken served with your choice of smoky Jollof or savory vegetable fried rice.",
    basePricePesewas: 4000,
    imageUrl: "/images/dishes/fried-chicken.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 3,
    category: makeCategoryRef("packages"),
    optionGroups: [
      {
        id: "grp-pkg-fried-rice-choice",
        menuItemId: "pkg-fried-chicken-rice",
        name: "Select Rice Base",
        description: "Choose how you prefer your rice plated.",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          {
            id: "opt-pkg-jollof",
            optionGroupId: "grp-pkg-fried-rice-choice",
            name: "Smoky Jollof Rice",
            priceDeltaPesewas: 0,
            isAvailable: true,
          },
          {
            id: "opt-pkg-fried",
            optionGroupId: "grp-pkg-fried-rice-choice",
            name: "Vegetable Fried Rice",
            priceDeltaPesewas: 0,
            isAvailable: true,
          },
        ],
      },
    ],
  },

  // Locals
  {
    id: "local-banku-okro",
    categoryId: "locals",
    name: "Banku with Okro Soup",
    slug: "local-banku-okro",
    description: "Smooth hot banku served with rich Sunyani okro soup cooked with traditional spices.",
    basePricePesewas: 5000,
    imageUrl: "/images/dishes/swallow-soup.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 4,
    category: makeCategoryRef("locals"),
    optionGroups: [
      {
        id: "grp-banku-protein",
        menuItemId: "local-banku-okro",
        name: "Select Protein",
        description: "Choose your main protein.",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-banku-beef", optionGroupId: "grp-banku-protein", name: "Tender Braised Beef", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-banku-fish", optionGroupId: "grp-banku-protein", name: "Crispy Fried Fish", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-banku-chicken", optionGroupId: "grp-banku-protein", name: "Grilled Chicken", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-omutuo-groundnut",
    categoryId: "locals",
    name: "Omutuo (Rice Ball) with Groundnut Soup",
    slug: "local-omutuo-groundnut",
    description: "Warm soft pounded rice balls in velvety roasted peanut soup seasoned with herbs.",
    basePricePesewas: 5000,
    imageUrl: "/images/dishes/swallow-soup.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 5,
    category: makeCategoryRef("locals"),
    optionGroups: [
      {
        id: "grp-omutuo-protein",
        menuItemId: "local-omutuo-groundnut",
        name: "Select Protein",
        description: "Choose stewed beef or fried red fish.",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-omutuo-beef", optionGroupId: "grp-omutuo-protein", name: "Stewed Beef Cuts", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-omutuo-fish", optionGroupId: "grp-omutuo-protein", name: "Fried Red Fish", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-tz",
    categoryId: "locals",
    name: "Tuo Zaafi (TZ) with Ayoyo Soup",
    slug: "local-tz",
    description: "Authentic Northern Ghanaian millet swallow paired with green ayoyo leaves and rich meat stew.",
    basePricePesewas: 5000,
    imageUrl: "/images/dishes/swallow-soup.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 6,
    category: makeCategoryRef("locals"),
    optionGroups: [
      {
        id: "grp-tz-protein",
        menuItemId: "local-tz",
        name: "Select Protein",
        description: null,
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-tz-goat", optionGroupId: "grp-tz-protein", name: "Spicy Goat Meat", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-tz-beef", optionGroupId: "grp-tz-protein", name: "Braised Beef", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-tz-fish", optionGroupId: "grp-tz-protein", name: "Fried Fish", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-fufu-light-soup",
    categoryId: "locals",
    name: "Pounded Fufu with Light Soup",
    slug: "local-fufu-light-soup",
    description: "Hand-pounded plantain and cassava fufu immersed in aromatic Ghanaian tomato light soup.",
    basePricePesewas: 5000,
    imageUrl: "/images/dishes/fufu-goat-soup.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 30,
    sortOrder: 7,
    category: makeCategoryRef("locals"),
    optionGroups: [
      {
        id: "grp-fufu-protein",
        menuItemId: "local-fufu-light-soup",
        name: "Select Soup Protein",
        description: "Choose your preferred protein simmered in light soup.",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-fufu-goat", optionGroupId: "grp-fufu-protein", name: "Tender Local Goat Meat", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-fufu-tilapia", optionGroupId: "grp-fufu-protein", name: "Fresh Steamed Tilapia", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-fufu-fish", optionGroupId: "grp-fufu-protein", name: "Fried Red Fish", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-red-red",
    categoryId: "locals",
    name: "Red Red",
    slug: "local-red-red",
    description: "Creamy black-eyed bean stew finished with palm oil and sweet fried ripe plantains.",
    basePricePesewas: 5000,
    imageUrl: "/images/dishes/hero-signature-plate.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 8,
    category: makeCategoryRef("locals"),
    optionGroups: [
      {
        id: "grp-redred-extras",
        menuItemId: "local-red-red",
        name: "Optional Protein Boost",
        description: "Add boiled egg or fried fish cutlet.",
        minSelect: 0,
        maxSelect: 2,
        isRequired: false,
        options: [
          { id: "opt-redred-egg", optionGroupId: "grp-redred-extras", name: "Add Boiled Egg", priceDeltaPesewas: 500, isAvailable: true },
          { id: "opt-redred-fish", optionGroupId: "grp-redred-extras", name: "Add Fried Fish Cutlet", priceDeltaPesewas: 1500, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-boiled-yam-fish-egg-stew",
    categoryId: "locals",
    name: "Boiled Yam with Fish & Egg Stew",
    slug: "local-boiled-yam-fish-egg-stew",
    description: "Fluffy Pona yam slices served with spicy garden egg and scrambled egg fish stew.",
    basePricePesewas: 7000,
    imageUrl: "/images/dishes/red-fish.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 9,
    category: makeCategoryRef("locals"),
    optionGroups: [],
  },
  {
    id: "local-boiled-plantain-fish-egg-stew",
    categoryId: "locals",
    name: "Boiled Plantain with Fish & Egg Stew",
    slug: "local-boiled-plantain-fish-egg-stew",
    description: "Tender boiled ampesi plantain paired with rich tomato fish & egg stew.",
    basePricePesewas: 7000,
    imageUrl: "/images/dishes/special-combo.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 10,
    category: makeCategoryRef("locals"),
    optionGroups: [],
  },
  {
    id: "local-boiled-yam-palava-sauce",
    categoryId: "locals",
    name: "Boiled Yam with Palava Sauce & Fish",
    slug: "local-boiled-yam-palava-sauce",
    description: "Freshly boiled yam complemented by traditional cocoyam leaf (kontomire) egusi stew and fish.",
    basePricePesewas: 7000,
    imageUrl: "/images/dishes/red-fish.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 11,
    category: makeCategoryRef("locals"),
    optionGroups: [],
  },

  // Seafood
  {
    id: "seafood-tilapia-banku",
    categoryId: "seafood",
    name: "Tilapia with Banku (Chilli)",
    slug: "seafood-tilapia-banku",
    description: "Whole charcoal-grilled Volta tilapia rubbed in herb marinade, served hot with two banku balls, green kpakpo shito & red pepper.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/tilapia-banku.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 30,
    sortOrder: 12,
    category: makeCategoryRef("seafood"),
    optionGroups: [],
  },
  {
    id: "seafood-red-fish-banku",
    categoryId: "seafood",
    name: "Red Fish with Banku (Chilli)",
    slug: "seafood-red-fish-banku",
    description: "Crisp golden seasoned red snapper served alongside hot banku, sliced onions, tomatoes, and fiery pepper sauce.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/red-fish.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 25,
    sortOrder: 13,
    category: makeCategoryRef("seafood"),
    optionGroups: [],
  },
  {
    id: "seafood-shrimps-rice",
    categoryId: "seafood",
    name: "Shrimps (Fried & Jollof Rice)",
    slug: "seafood-shrimps-rice",
    description: "Garlic-buttered jumbo shrimps sautéed in peppers with your selection of Fried or Jollof Rice.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/rice-specialty.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 14,
    category: makeCategoryRef("seafood"),
    optionGroups: [
      {
        id: "grp-shrimp-rice-base",
        menuItemId: "seafood-shrimps-rice",
        name: "Choose Rice Style",
        description: null,
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-shrimp-jollof", optionGroupId: "grp-shrimp-rice-base", name: "Jollof Rice", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-shrimp-fried", optionGroupId: "grp-shrimp-rice-base", name: "Fried Rice", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },

  // Sauce
  {
    id: "sauce-beef",
    categoryId: "sauces",
    name: "Beef Sauce with Steamed Rice",
    slug: "sauce-beef",
    description: "Wok-seared tender beef strips in savory onion and bell-pepper gravy paired with fragrant white rice.",
    basePricePesewas: 7000,
    imageUrl: "/images/dishes/rice-specialty.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 15,
    category: makeCategoryRef("sauces"),
    optionGroups: [],
  },
  {
    id: "sauce-chicken",
    categoryId: "sauces",
    name: "Chicken Sauce with Steamed Rice",
    slug: "sauce-chicken",
    description: "Succulent diced chicken breast in herb-seasoned vegetable sauce over fluffy steamed jasmine rice.",
    basePricePesewas: 7000,
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 16,
    category: makeCategoryRef("sauces"),
    optionGroups: [],
  },
  {
    id: "sauce-gizzard",
    categoryId: "sauces",
    name: "Gizzard Sauce with Steamed Rice",
    slug: "sauce-gizzard",
    description: "Tender peppered chicken gizzards simmered in rich smoky tomato sauce over steamed rice.",
    basePricePesewas: 7000,
    imageUrl: "/images/dishes/special-combo.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 17,
    category: makeCategoryRef("sauces"),
    optionGroups: [],
  },

  // Sika Assorted
  {
    id: "assorted-beef-jollof",
    categoryId: "sika-assorted",
    name: "Beef Jollof Rice",
    slug: "assorted-beef-jollof",
    description: "Fragrant smoky Jollof rice tossed with tender spiced beef strips and sautéed vegetables.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 18,
    category: makeCategoryRef("sika-assorted"),
    optionGroups: [],
  },
  {
    id: "assorted-chicken-jollof",
    categoryId: "sika-assorted",
    name: "Chicken Jollof Rice",
    slug: "assorted-chicken-jollof",
    description: "Sika's signature festive Jollof platter packed with diced grilled chicken, frankfurters, and sweet corn.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 19,
    category: makeCategoryRef("sika-assorted"),
    optionGroups: [],
  },
  {
    id: "assorted-shrimps-jollof",
    categoryId: "sika-assorted",
    name: "Shrimps Jollof Rice",
    slug: "assorted-shrimps-jollof",
    description: "Aromatic long-grain Jollof folded with spiced tiger shrimps and crisp garden veggies.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/rice-specialty.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 20,
    category: makeCategoryRef("sika-assorted"),
    optionGroups: [],
  },
  {
    id: "assorted-vegetables-jollof",
    categoryId: "sika-assorted",
    name: "Vegetables Jollof Rice",
    slug: "assorted-vegetables-jollof",
    description: "Vibrant plant-forward Jollof sautéed with sweet bell peppers, green beans, carrots, and sweet corn.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/rice-specialty.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 21,
    category: makeCategoryRef("sika-assorted"),
    optionGroups: [],
  },

  // Sika Fruit Rice
  {
    id: "fruit-pineapple-fried-rice",
    categoryId: "sika-fruit-rice",
    name: "Pineapple Fried Rice",
    slug: "fruit-pineapple-fried-rice",
    description: "Sweet caramelized Sunyani pineapple chunks tossed in savory vegetable fried rice with grilled chicken.",
    basePricePesewas: 9000,
    imageUrl: "/images/dishes/pineapple-rice.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 22,
    category: makeCategoryRef("sika-fruit-rice"),
    optionGroups: [],
  },
  {
    id: "fruit-pineapple-jollof-rice",
    categoryId: "sika-fruit-rice",
    name: "Pineapple Jollof Rice",
    slug: "fruit-pineapple-jollof-rice",
    description: "Sweet-savory fusion combining smoky Jollof rice with roasted pineapple glaze.",
    basePricePesewas: 9000,
    imageUrl: "/images/dishes/pineapple-rice.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 23,
    category: makeCategoryRef("sika-fruit-rice"),
    optionGroups: [],
  },
  {
    id: "fruit-coconut-fried-rice",
    categoryId: "sika-fruit-rice",
    name: "Coconut Fried Rice",
    slug: "fruit-coconut-fried-rice",
    description: "Silky toasted coconut cream fried rice topped with spring onions and tender spiced meat.",
    basePricePesewas: 9000,
    imageUrl: "/images/dishes/pineapple-rice.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 24,
    category: makeCategoryRef("sika-fruit-rice"),
    optionGroups: [],
  },
  {
    id: "fruit-coconut-jollof-rice",
    categoryId: "sika-fruit-rice",
    name: "Coconut Jollof Rice",
    slug: "fruit-coconut-jollof-rice",
    description: "Rich coconut milk infused into smoky Ghanaian Jollof rice for a velvety tropical finish.",
    basePricePesewas: 9000,
    imageUrl: "/images/dishes/pineapple-rice.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 25,
    category: makeCategoryRef("sika-fruit-rice"),
    optionGroups: [],
  },
  {
    id: "fruit-salad",
    categoryId: "sika-fruit-rice",
    name: "Sika Fruit Salad",
    slug: "fruit-salad",
    description: "Freshly diced seasonal pineapple, watermelon, pawpaw, mango, and sweet apples chilled to perfection.",
    basePricePesewas: 9000,
    imageUrl: "/images/dishes/fruit-salad.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 0,
    preparationTimeMinutes: 15,
    sortOrder: 26,
    category: makeCategoryRef("sika-fruit-rice"),
    optionGroups: [],
  },

  // Sika Cuisine Special
  {
    id: "special-combo-mixture",
    categoryId: "sika-specials",
    name: "SIKA Special Combo (De Mixture)",
    slug: "special-combo-mixture",
    description: "Half smoky Jollof & half vegetable fried rice crowned with grilled chicken, kelewele, gizzard, and salad.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/signature-platter.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 27,
    category: makeCategoryRef("sika-specials"),
    optionGroups: [],
  },
  {
    id: "special-fries-wings-drums",
    categoryId: "sika-specials",
    name: "SIKA Fries with (Wings, Drums)",
    slug: "special-fries-wings-drums",
    description: "Golden crisp potato fries stacked with glazed BBQ chicken wings and juicy drumsticks.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/fried-chicken.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 28,
    category: makeCategoryRef("sika-specials"),
    optionGroups: [],
  },
  {
    id: "special-assorted-noodles",
    categoryId: "sika-specials",
    name: "SIKA Assorted Noodles",
    slug: "special-assorted-noodles",
    description: "Wok-tossed noodles with strips of beef, chicken, sliced sausages, soft-fried egg, and crunchy vegetables.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/noodles-stir-fry.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 29,
    category: makeCategoryRef("sika-specials"),
    optionGroups: [],
  },
  {
    id: "special-loaded-fries",
    categoryId: "sika-specials",
    name: "Loaded Fries",
    slug: "special-loaded-fries",
    description: "Generous tray of seasoned crinkle fries smothered in melted cheese sauce, spiced beef bits, and house drizzle.",
    basePricePesewas: 8000,
    imageUrl: "/images/dishes/special-combo.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 30,
    category: makeCategoryRef("sika-specials"),
    optionGroups: [],
  },

  // Pizza
  {
    id: "pizza-sika-artisan",
    categoryId: "pizza",
    name: "Sika Artisan Oven Pizza",
    slug: "pizza-sika-artisan",
    description: "Hand-stretched stone-baked crust topped with tangy house tomato base, mozzarella cheese, and your choice of flavor.",
    basePricePesewas: 11000,
    imageUrl: "/images/dishes/artisan-pizza.jpg",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 31,
    category: makeCategoryRef("pizza"),
    optionGroups: [
      {
        id: "grp-pizza-size",
        menuItemId: "pizza-sika-artisan",
        name: "Choose Pizza Size",
        description: null,
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-pizza-mini", optionGroupId: "grp-pizza-size", name: "Mini Size (GH₵110)", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-pizza-medium", optionGroupId: "grp-pizza-size", name: "Medium Size (GH₵140)", priceDeltaPesewas: 3000, isAvailable: true },
          { id: "opt-pizza-family", optionGroupId: "grp-pizza-size", name: "Family Size (GH₵180)", priceDeltaPesewas: 7000, isAvailable: true },
        ],
      },
      {
        id: "grp-pizza-flavor",
        menuItemId: "pizza-sika-artisan",
        name: "Select Flavor Topping",
        description: null,
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-flavor-chicken-bbq", optionGroupId: "grp-pizza-flavor", name: "BBQ Chicken & Sweet Peppers", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-flavor-beef-mushroom", optionGroupId: "grp-pizza-flavor", name: "Minced Beef & Mushrooms", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-flavor-pepperoni", optionGroupId: "grp-pizza-flavor", name: "Loaded Pepperoni Feast", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-flavor-veggie", optionGroupId: "grp-pizza-flavor", name: "Vegetarian Supreme", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },

  // Extras
  {
    id: "extra-grilled-chicken",
    categoryId: "extras",
    name: "Grilled Chicken Only",
    slug: "extra-grilled-chicken",
    description: "Charcoal-grilled quarter chicken brushed with spicy Ghanaian herb oil.",
    basePricePesewas: 2000,
    imageUrl: "/images/dishes/fried-chicken.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 15,
    sortOrder: 32,
    category: makeCategoryRef("extras"),
    optionGroups: [],
  },
  {
    id: "extra-wings",
    categoryId: "extras",
    name: "Wings Only",
    slug: "extra-wings",
    description: "Six crispy peppered chicken wings tossed in Sika signature spice.",
    basePricePesewas: 4000,
    imageUrl: "/images/dishes/fried-chicken.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 15,
    sortOrder: 33,
    category: makeCategoryRef("extras"),
    optionGroups: [],
  },
  {
    id: "extra-drumstick",
    categoryId: "extras",
    name: "Drumstick Only",
    slug: "extra-drumstick",
    description: "Two crispy spiced golden fried chicken drumsticks.",
    basePricePesewas: 2000,
    imageUrl: "/images/dishes/fried-chicken.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 15,
    sortOrder: 34,
    category: makeCategoryRef("extras"),
    optionGroups: [],
  },
  {
    id: "extra-plantain",
    categoryId: "extras",
    name: "Plantain Only (Kelewele)",
    slug: "extra-plantain",
    description: "Hot cubed ripe plantain seasoned with ginger, cloves, and cayenne pepper.",
    basePricePesewas: 2000,
    imageUrl: "/images/dishes/special-combo.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 10,
    sortOrder: 35,
    category: makeCategoryRef("extras"),
    optionGroups: [],
  },
  {
    id: "extra-grilled-tilapia",
    categoryId: "extras",
    name: "Grilled Tilapia Only",
    slug: "extra-grilled-tilapia",
    description: "Single charcoal-grilled spiced whole tilapia fillet served with sliced onions and pepper.",
    basePricePesewas: 6000,
    imageUrl: "/images/dishes/tilapia-banku.jpg",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 36,
    category: makeCategoryRef("extras"),
    optionGroups: [],
  },
];

export function getFallbackMenuCategories(): FallbackMenuCategory[] {
  return FALLBACK_MENU_CATEGORIES.filter((c) => c.isActive);
}

export function getFallbackMenuItems(filters: {
  categoryId?: string | null;
  featuredOnly?: boolean;
  includeUnavailable?: boolean;
  slug?: string | null;
}): FallbackMenuItem[] | FallbackMenuItem | null {
  if (filters.slug) {
    const clean = filters.slug.trim();
    return (
      FALLBACK_MENU_ITEMS.find((item) => item.slug === clean || item.id === clean) ??
      null
    );
  }

  return FALLBACK_MENU_ITEMS.filter((item) => {
    if (!filters.includeUnavailable && !item.isAvailable) return false;
    if (filters.featuredOnly && !item.isFeatured) return false;
    if (
      filters.categoryId &&
      item.categoryId !== filters.categoryId &&
      item.category.slug !== filters.categoryId
    ) {
      return false;
    }
    return true;
  });
}
