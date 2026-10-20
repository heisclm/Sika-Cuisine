"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Search, Flame, ArrowUp, ShoppingCart } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { formatPesewasToGhs } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { DishDetailModal } from "@/components/menu/DishDetailModal";
import { TiltCard } from "@/components/creative/TiltCard";
import { MagneticButton } from "@/components/creative/MagneticButton";
import { KineticMarquee } from "@/components/creative/KineticMarquee";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";

export const SIKA_MENU_ITEMS: MenuItem[] = [
  {
    id: "pkg-grilled-chicken-fried-rice",
    categoryId: "packages",
    categoryName: "Packages (GH₵40)",
    name: "Grilled Chicken with Fried Rice",
    slug: "grilled-chicken-fried-rice",
    description: "Tender seasoned grilled chicken quarter served over savory vegetable fried rice with house shito.",
    basePricePesewas: 4000,
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
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
    imageUrl: "/images/dishes/special-combo.jpg",
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
    imageUrl: "/images/dishes/fried-chicken.jpg",
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
    imageUrl: "/images/dishes/tilapia-banku.jpg",
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
    imageUrl: "/images/dishes/fufu-goat-soup.jpg",
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
    imageUrl: "/images/dishes/special-combo.jpg",
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
    imageUrl: "/images/dishes/fufu-goat-soup.jpg",
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
    imageUrl: "/images/dishes/swallow-soup.jpg",
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
    imageUrl: "/images/dishes/rice-specialty.jpg",
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
    imageUrl: "/images/dishes/rice-specialty.jpg",
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
    imageUrl: "/images/dishes/rice-specialty.jpg",
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
    imageUrl: "/images/dishes/tilapia-banku.jpg",
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
    imageUrl: "/images/dishes/tilapia-banku.jpg",
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
    imageUrl: "/images/dishes/red-fish.jpg",
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
    imageUrl: "/images/dishes/fufu-goat-soup.jpg",
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
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
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
    imageUrl: "/images/dishes/pineapple-rice.jpg",
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
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
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
    imageUrl: "/images/dishes/special-combo.jpg",
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
    imageUrl: "/images/dishes/red-fish.jpg",
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
    imageUrl: "/images/dishes/special-combo.jpg",
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
    imageUrl: "/images/dishes/tilapia-banku.jpg",
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
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
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
    imageUrl: "/images/dishes/tilapia-banku.jpg",
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
    imageUrl: "/images/dishes/special-combo.jpg",
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
    imageUrl: "/images/dishes/fruit-salad.jpg",
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
    imageUrl: "/images/dishes/pineapple-rice.jpg",
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
    imageUrl: "/images/dishes/fried-chicken.jpg",
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
    imageUrl: "/images/dishes/noodles-stir-fry.jpg",
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
    imageUrl: "/images/dishes/fried-chicken.jpg",
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
    imageUrl: "/images/dishes/artisan-pizza.jpg",
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
    imageUrl: "/images/dishes/grilled-chicken-jollof.jpg",
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
    imageUrl: "/images/dishes/fried-chicken.jpg",
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
    imageUrl: "/images/dishes/fried-chicken.jpg",
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
    imageUrl: "/images/dishes/swallow-soup.jpg",
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
    imageUrl: "/images/dishes/tilapia-banku.jpg",
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
  const { addItem, setIsCartOpen } = useCart();
  const { success } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDishForModal, setActiveDishForModal] = useState<MenuItem | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      success(
        `Added ${dish.name} to plate`,
        "Prepared fresh to order in Sunyani",
        {
          label: "View Plate",
          onClick: () => setIsCartOpen(true),
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-gray-200">
      <div className="relative border-b border-white/[0.06] bg-[#16171b] py-14 sm:py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] studio-vignette pointer-events-none -z-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-px w-6 bg-brand-red/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red">
              Sika Cuisine Lounge &bull; Sunyani, Ghana
            </span>
            <span className="h-px w-6 bg-brand-red/60" />
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Official Restaurant Menu
            </h1>
          </div>
          <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-xl mx-auto font-light leading-relaxed">
            Every delicacy prepared fresh to order in Sunyani. Select your favorite packages, local dishes, seafood, or specials.
          </p>
        </div>
      </div>

      {/* Locomotive Kinetic Marquee */}
      <KineticMarquee className="border-b border-white/[0.06] bg-[#111215]/90 backdrop-blur-md" />

      {/* Sticky Category Navigation & Quick Filter Bar */}
      <div className="sticky top-18 sm:top-20 z-30 bg-[#141518]/95 backdrop-blur-xl py-3.5 border-b border-white/[0.06] shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x">
              {CATEGORIES.map((cat) => {
                const count =
                  cat.id === "all"
                    ? SIKA_MENU_ITEMS.length
                    : SIKA_MENU_ITEMS.filter((d) => d.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                    className={`whitespace-nowrap rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all touch-manipulation flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? "bg-brand-red text-white shadow-[0_4px_14px_rgba(229,9,20,0.35)]"
                        : "bg-[#1a1b20] text-gray-300 hover:bg-[#25272e] hover:text-white border border-white/5"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        selectedCategory === cat.id
                          ? "bg-black/30 text-white"
                          : "bg-white/5 text-gray-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-64 flex-shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter delicacies..."
                className="w-full rounded-full bg-[#1a1b20] border border-white/10 pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">

        {filteredDishes.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-surface-300 border border-border-subtle">
            <p className="text-lg font-serif text-white">No delicacies found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 sm:gap-x-7 gap-y-24 sm:gap-y-28 pt-24 sm:pt-28">
            {filteredDishes.map((dish, idx) => (
              <div
                key={dish.id}
                className="animate-dish-fade-up"
                style={{ animationDelay: `${Math.min(idx % 12, 8) * 0.04}s` }}
              >
                <div
                  ref={(el) => {
                    cardRefs.current[dish.id] = el;
                  }}
                  onClick={() => handleCardClick(dish)}
                  className="group relative h-full cursor-pointer rounded-[32px] bg-[#1c1d24] p-6 pt-28 sm:pt-32 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_60px_rgba(0,0,0,0.9)] flex flex-col justify-between shadow-[0_20px_45px_rgba(0,0,0,0.7)]"
                >
                  {/* Overlapping Top Plate */}
                  <div className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 h-40 w-40 sm:h-44 sm:w-44 rounded-full overflow-hidden border-[6px] border-[#25262f] shadow-[0_20px_40px_rgba(0,0,0,0.95)] group-hover:scale-105 group-hover:rotate-[2deg] transition-transform duration-500 ease-out bg-[#16171a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Dish Meta: Clean, Left-Aligned Typography */}
                  <div className="text-left mt-2 flex-grow">
                    <h3 className="text-lg sm:text-xl font-medium tracking-tight text-white group-hover:text-brand-red transition-colors line-clamp-1">
                      {dish.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-1 font-normal leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Bottom Row: Price on left, Red circular button on right */}
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-bold text-brand-red font-mono">
                      {formatPesewasToGhs(dish.basePricePesewas)}
                    </span>

                    <button
                      onClick={(e) => handleQuickAdd(dish, e)}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white shadow-[0_4px_16px_rgba(229,9,20,0.45)] hover:bg-brand-red-hover hover:scale-105 active:scale-95 transition-all duration-200"
                      aria-label={`Add ${dish.name} to order tray`}
                    >
                      <ShoppingCart className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
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

      {/* Floating Quick Categories / Jump To Top Pill */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 320, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1c1d22] hover:bg-brand-red text-white text-xs font-semibold border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.8)] transition-all duration-300 active:scale-95"
          aria-label="Back to categories"
        >
          <ArrowUp className="h-4 w-4" />
          <span>Categories</span>
        </button>
      )}
    </div>
  );
}
