"use client";

import React, { useState, useRef, useMemo } from "react";
import { Search, Flame, Sparkles, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { formatPesewasToGhs } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { DishDetailModal } from "@/components/menu/DishDetailModal";

// Full Ghanaian Menu catalogue strictly in integer pesewas
const MENU_ITEMS: MenuItem[] = [
  {
    id: "item-jollof",
    categoryId: "traditional-mains",
    categoryName: "Traditional Mains",
    name: "Sika Signature Jollof Special",
    slug: "sika-signature-jollof-special",
    description: "Slow-simmered rosemary tomato jollof served with sweet golden plantains and smoky black shito.",
    basePricePesewas: 6500, // GH₵65.00
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 1,
    optionGroups: [
      {
        id: "opt-grp-protein",
        name: "Choice of Protein",
        description: "Select your preferred grilled protein",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        options: [
          { id: "opt-tilapia", name: "Charcoal Grilled Tilapia Half", priceDeltaPesewas: 2000, isAvailable: true },
          { id: "opt-chicken", name: "Spicy Fried Quarter Chicken", priceDeltaPesewas: 1500, isAvailable: true },
          { id: "opt-fish", name: "Crispy Fried Red Fish", priceDeltaPesewas: 1800, isAvailable: true },
          { id: "opt-goat", name: "Braised Spicy Goat Meat", priceDeltaPesewas: 2500, isAvailable: true },
        ],
      },
      {
        id: "opt-grp-shito",
        name: "Pepper Sauce Level",
        minSelect: 0,
        maxSelect: 1,
        isRequired: false,
        options: [
          { id: "opt-mild", name: "Mild Shito", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-extra-hot", name: "Extra Spicy Black Shito", priceDeltaPesewas: 0, isAvailable: true },
          { id: "opt-green", name: "Fresh Ground Green Chili Sauce", priceDeltaPesewas: 300, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "item-waakye",
    categoryId: "traditional-mains",
    categoryName: "Traditional Mains",
    name: "Waakye Royale Feast",
    slug: "waakye-royale-feast",
    description: "Sorghum-infused rice & beans with gari foto, boiled egg, tender wele, and spicy talia.",
    basePricePesewas: 6000, // GH₵60.00
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 20,
    sortOrder: 2,
    optionGroups: [
      {
        id: "opt-waakye-extras",
        name: "Add Extra Meat / Sides",
        minSelect: 0,
        maxSelect: 2,
        isRequired: false,
        options: [
          { id: "opt-w-fish", name: "Fried Fish Cutlet", priceDeltaPesewas: 1500, isAvailable: true },
          { id: "opt-w-beef", name: "Tender Stewed Beef Chunks", priceDeltaPesewas: 1800, isAvailable: true },
          { id: "opt-w-egg", name: "Extra Soft Boiled Egg", priceDeltaPesewas: 500, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "item-banku",
    categoryId: "traditional-mains",
    categoryName: "Traditional Mains",
    name: "Banku with Grilled Tilapia & Hot Pepper",
    slug: "banku-with-grilled-tilapia",
    description: "Two steaming hot dumplings of fermented corn dough with whole seasoned grilled tilapia and fresh pepper.",
    basePricePesewas: 7500, // GH₵75.00
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 30,
    sortOrder: 3,
  },
  {
    id: "item-fufu",
    categoryId: "soups-stews",
    categoryName: "Soups & Stews",
    name: "Pounded Fufu with Light Goat Soup",
    slug: "fufu-with-light-goat-soup",
    description: "Silky pounded swallow submerged in deeply aromatic spiced tomato soup with cuts of tender local goat meat.",
    basePricePesewas: 8000, // GH₵80.00
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 2,
    preparationTimeMinutes: 25,
    sortOrder: 4,
  },
  {
    id: "item-kelewele",
    categoryId: "street-grills",
    categoryName: "Street Grills",
    name: "Golden Spiced Kelewele",
    slug: "golden-spiced-kelewele",
    description: "Ripe plantain cubes seasoned with crushed ginger, cayenne chili, and cloves, paired with roasted peanuts.",
    basePricePesewas: 2500, // GH₵25.00
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 2,
    preparationTimeMinutes: 15,
    sortOrder: 5,
  },
  {
    id: "item-suya",
    categoryId: "street-grills",
    categoryName: "Street Grills",
    name: "Charcoal Suya Beef Skewers (Chichinga)",
    slug: "suya-beef-skewers",
    description: "Four skewers of beef flank rubbed with northern Yaji peanut spice blend and garnished with red onions.",
    basePricePesewas: 4500, // GH₵45.00
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: true,
    spiceLevel: 3,
    preparationTimeMinutes: 20,
    sortOrder: 6,
  },
  {
    id: "item-sobolo",
    categoryId: "local-beverages",
    categoryName: "Local Beverages",
    name: "House Special Chilled Sobolo",
    slug: "house-special-chilled-sobolo",
    description: "Ruby hibiscus flower brew steeped with fiery ginger, pineapple juice, and aromatic cloves over ice.",
    basePricePesewas: 1500, // GH₵15.00
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 1,
    preparationTimeMinutes: 5,
    sortOrder: 7,
  },
  {
    id: "item-asaana",
    categoryId: "local-beverages",
    categoryName: "Local Beverages",
    name: "Sunyani Chilled Asaana with Milk",
    slug: "sunyani-chilled-asaana",
    description: "Fermented corn nectar naturally caramelized and chilled, served with creamy evaporated milk.",
    basePricePesewas: 1800, // GH₵18.00
    imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
    isAvailable: true,
    isFeatured: false,
    spiceLevel: 0,
    preparationTimeMinutes: 5,
    sortOrder: 8,
  },
];

const CATEGORIES = [
  { id: "all", name: "All Delicacies" },
  { id: "traditional-mains", name: "Traditional Mains" },
  { id: "street-grills", name: "Street Grills" },
  { id: "soups-stews", name: "Soups & Stews" },
  { id: "local-beverages", name: "Chilled Beverages" },
];

export default function MenuPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDishForModal, setActiveDishForModal] = useState<MenuItem | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const filteredDishes = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.categoryId === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCardClick = (dish: MenuItem) => {
    setActiveDishForModal(dish);
  };

  const handleQuickAdd = (dish: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // If dish has required option groups, open modal to let user choose
    if (dish.optionGroups && dish.optionGroups.some((g) => g.isRequired)) {
      setActiveDishForModal(dish);
    } else {
      const element = cardRefs.current[dish.id];
      addItem(dish, [], 1, undefined, element);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Menu Header Banner */}
      <div className="relative border-b border-border-subtle bg-surface-300 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4" /> Freshly Prepared in Sunyani
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-black text-white">
            Our Culinary Repertoire
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-light">
            Every dish is prepared to order using local spices and fresh ingredients.
            Select your preferences and customize your order.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filters & Search Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Tabs */}
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

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jollof, tilapia, waakye..."
              className="w-full rounded-full bg-surface-200 border border-border-subtle pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Menu Cards Grid */}
        {filteredDishes.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-surface-300 border border-border-subtle">
            <p className="text-lg font-serif text-white">No dishes found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-6">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                ref={(el) => {
                  cardRefs.current[dish.id] = el;
                }}
                onClick={() => handleCardClick(dish)}
                className="group relative cursor-pointer rounded-3xl bg-surface-200/90 border border-border-subtle p-5 pt-16 transition-all duration-300 hover:-translate-y-2 hover:border-brand-red/40 hover:shadow-card flex flex-col justify-between"
              >
                {/* Protruding circular dish plate overlapping top of card */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full overflow-hidden border-2 border-surface-50 shadow-plate group-hover:scale-105 transition-transform duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Dish info */}
                <div className="mt-4 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {dish.categoryName}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white mt-1 group-hover:text-brand-red transition-colors line-clamp-1">
                    {dish.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>

                  {dish.spiceLevel && dish.spiceLevel > 0 ? (
                    <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-brand-red">
                      <Flame className="h-3 w-3" />
                      <span>Spice {dish.spiceLevel}/3</span>
                    </div>
                  ) : null}
                </div>

                {/* Price & Action */}
                <div className="mt-6 pt-4 border-t border-border-subtle/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block -mb-0.5">Price</span>
                    <span className="text-base font-bold text-brand-red">
                      {formatPesewasToGhs(dish.basePricePesewas)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleQuickAdd(dish, e)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white shadow-glow hover:bg-brand-red-hover hover:scale-110 active:scale-95 transition-all duration-200"
                    aria-label={`Order ${dish.name}`}
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dish Customization Modal */}
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
