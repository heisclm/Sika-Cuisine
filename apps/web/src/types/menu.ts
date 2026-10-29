export interface MenuItemOption {
  id: string;
  name: string;
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
  basePricePesewas: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  spiceLevel?: number;
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

export interface SelectedOptionSnapshot {
  optionGroupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaPesewas: number;
}
