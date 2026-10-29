export interface MenuItemOptionDTO {
  id: string;
  name: string;
  priceDeltaPesewas: number;
  isAvailable: boolean;
}

export interface MenuItemOptionGroupDTO {
  id: string;
  name: string;
  description?: string | null;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: MenuItemOptionDTO[];
}

export interface MenuItemDTO {
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
  optionGroups?: MenuItemOptionGroupDTO[];
}

export interface MenuCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  items?: MenuItemDTO[];
}
