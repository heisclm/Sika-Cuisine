"use client";

import React, { useState, useRef, useMemo } from "react";
import { Search, Flame, ShoppingBag } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { formatPesewasToGhs } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { DishDetailModal } from "@/components/menu/DishDetailModal";
import { TiltCard } from "@/components/creative/TiltCard";
import { MagneticButton } from "@/components/creative/MagneticButton";
import { AmbientEmbers } from "@/components/creative/AmbientEmbers";

export const SIKA_MENU_ITEMS: MenuItem[] = [
  {
    id: "pkg-grilled-chicken-fried-rice",
    categoryId: "packages",
    categoryName: "Packages (GH₵40)",
    name: "Grilled Chicken with Fried Rice",
    slug: "grilled-chicken-fried-rice",
    description: "Tender seasoned grilled chicken quarter served over savory vegetable fried rice with house shito.",
    basePricePesewas: 4000,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 1,
  },
  {
    id: "pkg-grilled-chicken-jollof-rice",
    categoryId: "packages",
    categoryName: "Packages (GH₵40)",
    name: "Grilled Chicken with Jollof Rice",
    slug: "grilled-chicken-jollof-rice",
    description: "Slow-simmered smoky tomato Jollof rice served with aromatic grilled chicken and spiced pepper sauce.",
    basePricePesewas: 4000,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 2,
  },
  {
    id: "pkg-fried-chicken-rice",
    categoryId: "packages",
    categoryName: "Packages (GH₵40)",
    name: "Fried Chicken with Rice",
    slug: "fried-chicken-with-rice",
    description: "Crisp golden fried chicken served with your choice of fragrant Ghanaian fried rice or smoky jollof.",
    basePricePesewas: 4000,
    imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 3,
    optionGroups: [
      {
        id: "opt-pkg-rice-type",
        name: "Choice of Rice",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-pkg-jollof", name: "Smoky Jollof Rice", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-pkg-fried", name: "Vegetable Fried Rice", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-banku-okro",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Banku with Okro Soup",
    slug: "banku-with-okro-soup",
    description: "Smooth fermented corn & cassava dough dumplings served with rich, viscous okro soup and selected protein.",
    basePricePesewas: 5000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 4,
    optionGroups: [
      {
        id: "opt-banku-protein",
        name: "Select Protein",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-banku-beef", name: "Tender Braised Beef", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-banku-fish", name: "Crispy Fried Fish", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-banku-chicken", name: "Grilled Chicken", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-omutuo-groundnut",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Omutuo (Rice Ball) with Groundnut Soup",
    slug: "omutuo-with-groundnut-soup",
    description: "Silky soft rolled rice balls served in a deeply aromatic, slow-simmered peanut groundnut soup.",
    basePricePesewas: 5000,
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 5,
    optionGroups: [
      {
        id: "opt-omutuo-protein",
        name: "Select Protein",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-omutuo-beef", name: "Stewed Beef Cuts", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-omutuo-fish", name: "Fried Red Fish", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-tz",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Tuo Zaafi (TZ) with Ayoyo Soup",
    slug: "tuo-zaafi-tz",
    description: "Soft northern corn swallow paired with flavorful green ayoyo soup and rich, fiery meat stew.",
    basePricePesewas: 5000,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 3,
    preparationTimeMinutes: 25,
    sortOrder: 6,
    optionGroups: [
      {
        id: "opt-tz-protein",
        name: "Select Protein",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-tz-goat", name: "Spicy Goat Meat", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-tz-beef", name: "Braised Beef", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-tz-fish", name: "Fried Fish", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-fufu-light-soup",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Pounded Fufu with Light Soup",
    slug: "pounded-fufu-with-light-soup",
    description: "Silky pounded cassava and plantain swallow submerged in hot, spiced tomato light soup.",
    basePricePesewas: 5000,
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 30,
    sortOrder: 7,
    optionGroups: [
      {
        id: "opt-fufu-protein",
        name: "Select Meat / Fish",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-fufu-goat", name: "Tender Local Goat Meat", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-fufu-tilapia", name: "Fresh Steamed Tilapia", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-fufu-fish", name: "Fried Red Fish", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-red-red",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Red Red",
    slug: "red-red",
    description: "Sweet caramelized ripe fried plantain paired with rich red palm oil stewed black-eyed beans and gari.",
    basePricePesewas: 5000,
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 8,
    optionGroups: [
      {
        id: "opt-redred-extras",
        name: "Optional Add-on",
        minSelect: 0,
        maxSelect: 1,
        isRequired: false,
        options: [
          { id: "opt-redred-egg", name: "Add Boiled Egg", priceDeltaPesewas: 500, isAvailable: true },
          { id: "opt-redred-fish", name: "Add Fried Fish Cutlet", priceDeltaPesewas: 1500, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "local-boiled-yam-fish-egg-stew",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Boiled Yam with Fish & Egg Stew",
    slug: "boiled-yam-fish-egg-stew",
    description: "Tender white Pona yam slices served with rich garden egg & tomato stew, boiled egg, and seasoned fried fish.",
    basePricePesewas: 7000,
    imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 9,
  },
  {
    id: "local-boiled-plantain-fish-egg-stew",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Boiled Plantain with Fish & Egg Stew",
    slug: "boiled-plantain-fish-egg-stew",
    description: "Freshly boiled plantain fingers served with savory egg stew and crispy fried fish.",
    basePricePesewas: 7000,
    imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 10,
  },
  {
    id: "local-boiled-yam-palava-sauce",
    categoryId: "locals",
    categoryName: "Locals",
    name: "Boiled Yam with Palava Sauce & Fish",
    slug: "boiled-yam-palava-sauce-fish",
    description: "Traditional steamed cocoyam leaves (kontomire) simmered with melon seeds (agushie) and fish, served with boiled yam.",
    basePricePesewas: 7000,
    imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 11,
  },
  {
    id: "seafood-tilapia-banku",
    categoryId: "seafood",
    categoryName: "Seafood",
    name: "Tilapia with Banku (Chilli)",
    slug: "tilapia-with-banku-chilli",
    description: "Whole fresh charcoal-grilled tilapia rubbed with local ginger, garlic, and spices, served with steaming banku and hot pepper.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 30,
    sortOrder: 12,
  },
  {
    id: "seafood-red-fish-banku",
    categoryId: "seafood",
    categoryName: "Seafood",
    name: "Red Fish with Banku (Chilli)",
    slug: "red-fish-with-banku-chilli",
    description: "Whole seasoned crispy fried or grilled Red Fish served with two hot balls of banku, sliced onions, and raw pepper.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 3,
    preparationTimeMinutes: 25,
    sortOrder: 13,
  },
  {
    id: "seafood-shrimps-rice",
    categoryId: "seafood",
    categoryName: "Seafood",
    name: "Shrimps (Fried & Jollof Rice)",
    slug: "shrimps-fried-jollof-rice",
    description: "Succulent pan-seared garlic pepper shrimps served alongside your choice of jollof or vegetable fried rice.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 14,
    optionGroups: [
      {
        id: "opt-shrimp-rice",
        name: "Choice of Rice",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-shrimp-jollof", name: "Jollof Rice", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-shrimp-fried", name: "Fried Rice", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "sauce-beef",
    categoryId: "sauces",
    categoryName: "Sauces",
    name: "Beef Sauce with Steamed Rice",
    slug: "beef-sauce-with-rice",
    description: "Tender sliced beef fillets braised in a savory, aromatic sweet pepper and spring onion reduction.",
    basePricePesewas: 7000,
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 15,
  },
  {
    id: "sauce-chicken",
    categoryId: "sauces",
    categoryName: "Sauces",
    name: "Chicken Sauce with Steamed Rice",
    slug: "chicken-sauce-with-rice",
    description: "Boneless chicken chunks simmered in a golden oriental herb, carrot, and sweet pepper gravy.",
    basePricePesewas: 7000,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 16,
  },
  {
    id: "sauce-gizzard",
    categoryId: "sauces",
    categoryName: "Sauces",
    name: "Gizzard Sauce with Steamed Rice",
    slug: "gizzard-sauce-with-rice",
    description: "Chewy, seasoned spicy turkey gizzards tossed in a hot bell pepper and ginger gravy sauce.",
    basePricePesewas: 7000,
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 25,
    sortOrder: 17,
  },
  {
    id: "assorted-beef-jollof",
    categoryId: "sika-assorted",
    categoryName: "Sika Assorted",
    name: "Beef Jollof Rice",
    slug: "beef-jollof-rice",
    description: "Authentic woodsmoke party jollof tossed with marinated beef strips, green peas, and carrots.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 18,
  },
  {
    id: "assorted-chicken-jollof",
    categoryId: "sika-assorted",
    categoryName: "Sika Assorted",
    name: "Chicken Jollof Rice",
    slug: "chicken-jollof-rice",
    description: "Special fragrant jollof packed with pulled chicken breast pieces and spicy seasonings.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 19,
  },
  {
    id: "assorted-shrimps-jollof",
    categoryId: "sika-assorted",
    categoryName: "Sika Assorted",
    name: "Shrimps Jollof Rice",
    slug: "shrimps-jollof-rice",
    description: "Smoky Ghanian Jollof loaded with sweet butter-sautéed shrimps and fresh coriander herbs.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 20,
  },
  {
    id: "assorted-vegetables-jollof",
    categoryId: "sika-assorted",
    categoryName: "Sika Assorted",
    name: "Vegetables Jollof Rice",
    slug: "vegetables-jollof-rice",
    description: "Garden-fresh medley of sweetcorn, bell peppers, carrots, and green beans folded into fragrant jollof.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 20,
    sortOrder: 21,
  },
  {
    id: "fruit-pineapple-fried-rice",
    categoryId: "sika-fruit-rice",
    categoryName: "Sika Fruit Rice",
    name: "Pineapple Fried Rice",
    slug: "pineapple-fried-rice",
    description: "Sweet caramelized fresh Sunyani pineapple cubes stir-fried with fragrant rice, raisins, and chicken bits.",
    basePricePesewas: 9000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 22,
  },
  {
    id: "fruit-pineapple-jollof-rice",
    categoryId: "sika-fruit-rice",
    categoryName: "Sika Fruit Rice",
    name: "Pineapple Jollof Rice",
    slug: "pineapple-jollof-rice",
    description: "A signature Sika creation: tangy charred pineapple juice infused into spicy red tomato jollof.",
    basePricePesewas: 9000,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 23,
  },
  {
    id: "fruit-coconut-fried-rice",
    categoryId: "sika-fruit-rice",
    categoryName: "Sika Fruit Rice",
    name: "Coconut Fried Rice",
    slug: "coconut-fried-rice",
    description: "Rice simmered in fresh pressed coconut milk, wok-fried with crisp spring veggies and toasted coconut flakes.",
    basePricePesewas: 9000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 25,
    sortOrder: 24,
  },
  {
    id: "fruit-coconut-jollof-rice",
    categoryId: "sika-fruit-rice",
    categoryName: "Sika Fruit Rice",
    name: "Coconut Jollof Rice",
    slug: "coconut-jollof-rice",
    description: "Rich, nutty coconut cream cooked into spiced Ghanaian jollof rice for an unforgettable velvety taste.",
    basePricePesewas: 9000,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 25,
  },
  {
    id: "fruit-salad",
    categoryId: "sika-fruit-rice",
    categoryName: "Sika Fruit Rice",
    name: "Sika Fruit Salad",
    slug: "sika-fruit-salad",
    description: "Chilled tropical bowl of ripe pawpaw, sweet pineapple, watermelon, apples, and bananas with natural honey drizzle.",
    basePricePesewas: 9000,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 0,
    preparationTimeMinutes: 10,
    sortOrder: 26,
  },
  {
    id: "special-combo-mixture",
    categoryId: "sika-specials",
    categoryName: "Sika Specials",
    name: "SIKA Special Combo (De Mixture)",
    slug: "sika-special-combo-de-mixture",
    description: "The ultimate chef platter: a generous blend of jollof, fried rice, crispy chicken wings, gizzard, and kelewele.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 30,
    sortOrder: 27,
  },
  {
    id: "special-fries-wings-drums",
    categoryId: "sika-specials",
    categoryName: "Sika Specials",
    name: "SIKA Fries with (Wings, Drums)",
    slug: "sika-fries-with-wings-drums",
    description: "Golden potato french fries served with seasoned hot wings, crispy chicken drumsticks, and garlic dip.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 28,
  },
  {
    id: "special-assorted-noodles",
    categoryId: "sika-specials",
    categoryName: "Sika Specials",
    name: "SIKA Assorted Noodles",
    slug: "sika-assorted-noodles",
    description: "Stir-fried noodles tossed in dark soy sauce, chili flakes, eggs, chicken chunks, and fresh seasonal greens.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 29,
  },
  {
    id: "special-loaded-fries",
    categoryId: "sika-specials",
    categoryName: "Sika Specials",
    name: "Loaded Fries",
    slug: "sika-loaded-fries",
    description: "Crispy french fries smothered in melted cheese, shredded grilled chicken, diced sausages, and spicy mayo.",
    basePricePesewas: 8000,
    imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 30,
  },
  {
    id: "pizza-sika-artisan",
    categoryId: "pizza",
    categoryName: "Pizza",
    name: "Sika Artisan Oven Pizza",
    slug: "sika-artisan-pizza",
    description: "Stone-baked hand-tossed dough with zesty marinara sauce, mozzarella cheese, and your choice of size and toppings.",
    basePricePesewas: 11000,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 1,
    preparationTimeMinutes: 30,
    sortOrder: 31,
    optionGroups: [
      {
        id: "opt-pizza-size",
        name: "Pizza Size",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-pizza-mini", name: "Mini Size (GH₵110)", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-pizza-medium", name: "Medium Size (GH₵140)", priceDeltaPesewas: 3000, isAvailable: true },
          { id: "opt-pizza-family", name: "Family Size (GH₵180)", priceDeltaPesewas: 7000, isAvailable: true },
        ],
      },
      {
        id: "opt-pizza-flavor",
        name: "Topping Flavor",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-flavor-chicken-bbq", name: "BBQ Chicken & Sweet Peppers", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-flavor-beef-mushroom", name: "Minced Beef & Mushrooms", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-flavor-pepperoni", name: "Loaded Pepperoni Feast", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-flavor-veggie", name: "Vegetarian Supreme", priceDeltaPesewas: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "extra-grilled-chicken",
    categoryId: "extras",
    categoryName: "Extras",
    name: "Grilled Chicken Only",
    slug: "grilled-chicken-only",
    description: "Juicy, spiced charcoal-grilled chicken piece.",
    basePricePesewas: 2000,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 15,
    sortOrder: 32,
  },
  {
    id: "extra-wings",
    categoryId: "extras",
    categoryName: "Extras",
    name: "Wings Only",
    slug: "wings-only",
    description: "Crispy, glazed spicy chicken wings.",
    basePricePesewas: 4000,
    imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 15,
    sortOrder: 33,
  },
  {
    id: "extra-drumstick",
    categoryId: "extras",
    categoryName: "Extras",
    name: "Drumstick Only",
    slug: "drumstick-only",
    description: "Crisp seasoned chicken drumstick.",
    basePricePesewas: 2000,
    imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 15,
    sortOrder: 34,
  },
  {
    id: "extra-plantain",
    categoryId: "extras",
    categoryName: "Extras",
    name: "Plantain Only (Kelewele)",
    slug: "plantain-only-kelewele",
    description: "Golden fried sweet plantain seasoned with mild spices.",
    basePricePesewas: 2000,
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 10,
    sortOrder: 35,
  },
  {
    id: "extra-grilled-tilapia",
    categoryId: "extras",
    categoryName: "Extras",
    name: "Grilled Tilapia Only",
    slug: "grilled-tilapia-only",
    description: "Whole fresh charcoal-grilled tilapia with seasoned pepper garnish.",
    basePricePesewas: 6000,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 36,
  },
];

const CATEGORIES = [
  { id: "all", name: "All Delicacies" },
  { id: "packages", name: "Packages (GH₵40)" },
  { id: "locals", name: "Locals (GH₵50 - 70)" },
  { id: "seafood", name: "Seafood (GH₵80)" },
  { id: "sauces", name: "Sauces (GH₵70)" },
  { id: "sika-assorted", name: "Sika Assorted (GH₵80)" },
  { id: "sika-fruit-rice", name: "Fruit Rice (GH₵90)" },
  { id: "sika-specials", name: "Sika Specials (GH₵80)" },
  { id: "pizza", name: "Pizza (GH₵110 - 180)" },
  { id: "extras", name: "Extras & Sides" },
];

export default function MenuPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDishForModal, setActiveDishForModal] = useState<MenuItem | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const filteredDishes = useMemo(() => {
    return SIKA_MENU_ITEMS.filter((dish) => {
      const matchesCategory =
        selectedCategory === "all" || dish.categoryId === selectedCategory;
      const matchesSearch =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dish.categoryName && dish.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCardClick = (dish: MenuItem) => {
    setActiveDishForModal(dish);
  };

  const handleQuickAdd = (dish: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dish.optionGroups && dish.optionGroups.some((g) => g.isRequired)) {
      setActiveDishForModal(dish);
    } else {
      const element = cardRefs.current[dish.id];
      addItem(dish, [], 1, undefined, element);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative border-b border-border-subtle bg-surface-300 py-14 sm:py-20 overflow-hidden">
        <AmbientEmbers count={12} minSize={1} maxSize={2.5} opacity={0.35} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-px w-6 bg-brand-red/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red">
              Sika Cuisine Lounge &bull; Sunyani, Ghana
            </span>
            <span className="h-px w-6 bg-brand-red/60" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black text-white">
            Official Restaurant Menu
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-light">
            Every delicacy prepared fresh to order in Sunyani. Select your favorite packages, local dishes, seafood, or specials.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-brand-red text-white shadow-glow"
                    : "bg-surface-200 text-gray-300 hover:bg-surface-100 hover:text-white border border-border-subtle"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jollof, tilapia, pizza..."
              className="w-full rounded-full bg-surface-200 border border-border-subtle pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {filteredDishes.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-surface-300 border border-border-subtle">
            <p className="text-lg font-serif text-white">No delicacies found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-6">
            {filteredDishes.map((dish) => (
              <TiltCard
                key={dish.id}
                maxAngle={7}
                scale={1.02}
                glare={true}
                className="rounded-3xl"
              >
                <div
                  ref={(el) => {
                    cardRefs.current[dish.id] = el;
                  }}
                  onClick={() => handleCardClick(dish)}
                  className="group relative h-full cursor-pointer rounded-3xl bg-surface-200/90 border border-border-subtle p-5 pt-16 transition-all duration-300 hover:border-brand-red/40 hover:shadow-card flex flex-col justify-between"
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full overflow-hidden border-2 border-surface-50 shadow-plate group-hover:scale-105 transition-transform duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {dish.categoryName}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white mt-1 group-hover:text-brand-red transition-colors line-clamp-1">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed font-light">
                      {dish.description}
                    </p>

                    {dish.spiceLevel && dish.spiceLevel > 0 ? (
                      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-brand-red">
                        <Flame className="h-3 w-3" />
                        <span>Spice {dish.spiceLevel}/3</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border-subtle/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block -mb-0.5">Authoritative Price</span>
                      <span className="text-base font-bold text-brand-red font-mono">
                        {formatPesewasToGhs(dish.basePricePesewas)}
                      </span>
                    </div>

                    <MagneticButton strength={0.25}>
                      <button
                        onClick={(e) => handleQuickAdd(dish, e)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white shadow-glow hover:bg-brand-red-hover hover:scale-105 active:scale-95 transition-all duration-200"
                        aria-label={`Order ${dish.name}`}
                      >
                        <ShoppingBag className="h-5 w-5" />
                      </button>
                    </MagneticButton>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>

      <DishDetailModal
        dish={activeDishForModal}
        isOpen={!!activeDishForModal}
        onClose={() => setActiveDishForModal(null)}
        sourceElement={
          activeDishForModal ? cardRefs.current[activeDishForModal.id] : null
        }
      />
    </div>
  );
}
