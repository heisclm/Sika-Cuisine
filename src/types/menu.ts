/**
 * Menu Domain Contracts for Sika Cuisine (Sunyani, Ghana)
 */

export interface MenuItemOption {
  id: string;
  name: string;
  /** Additional price in integer pesewas (e.g. 500 = GH₵5.00) */
  priceDeltaPesewas: number;
  isAvailable: boolean;
}

export interface MenuItemOptionGroup {
  id: string;
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  slug: string;
  description: string;
  /** Base price stored strictly as integer pesewas (e.g. 5000 = GH₵50.00) */
  basePricePesewas: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  spiceLevel?: number; // 0 to 3 peppers
  preparationTimeMinutes?: number;
  optionGroups?: MenuItemOptionGroup[];
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  items?: MenuItem[];
}

/**
 * Snapshot of selected options saved immutably inside an OrderItem.
 */
export interface SelectedOptionSnapshot {
  optionGroupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaPesewas: number;
}
