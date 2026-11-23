"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  Edit3,
  ImagePlus,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/context/ToastContext";

export interface AdminCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface AdminMenuItem {
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
  category?: { id?: string; name: string; slug?: string } | null;
}

const STUDIO_DISH_IMAGES = [
  "/images/dishes/grilled-chicken-jollof.jpg",
  "/images/dishes/tilapia-banku.jpg",
  "/images/dishes/fufu-goat-soup.jpg",
  "/images/dishes/fried-chicken.jpg",
  "/images/dishes/pineapple-rice.jpg",
  "/images/dishes/artisan-pizza.jpg",
  "/images/dishes/rice-specialty.jpg",
  "/images/dishes/signature-platter.jpg",
  "/images/dishes/special-combo.jpg",
  "/images/dishes/noodles-stir-fry.jpg",
  "/images/dishes/red-fish.jpg",
  "/images/dishes/swallow-soup.jpg",
  "/images/dishes/fruit-salad.jpg",
  "/images/dishes/hero-signature-plate.jpg",
];

function slugifyDishName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface AdminMenuManagerProps {
  items: AdminMenuItem[];
  categories: AdminCategoryOption[];
  onRefresh: () => Promise<void> | void;
}

export function AdminMenuManager({
  items,
  categories,
  onRefresh,
}: AdminMenuManagerProps) {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dish modal form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [priceGhs, setPriceGhs] = useState("40.00");
  const [prepMinutes, setPrepMinutes] = useState("20");
  const [spiceLevel, setSpiceLevel] = useState("1");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(STUDIO_DISH_IMAGES[0]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategoryId !== "ALL" && item.categoryId !== selectedCategoryId) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.category?.name || "").toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, selectedCategoryId]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName("");
    setSlug("");
    setSlugEdited(false);
    setCategoryId(categories[0]?.id || "");
    setPriceGhs("40.00");
    setPrepMinutes("20");
    setSpiceLevel("1");
    setDescription("");
    setImageUrl(STUDIO_DISH_IMAGES[0]);
    setIsAvailable(true);
    setIsFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (item: AdminMenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setSlug(item.slug);
    setSlugEdited(true);
    setCategoryId(item.categoryId || categories[0]?.id || "");
    setPriceGhs((item.basePricePesewas / 100).toFixed(2));
    setPrepMinutes(String(item.preparationTimeMinutes || 20));
    setSpiceLevel(String(item.spiceLevel ?? 1));
    setDescription(item.description || "");
    setImageUrl(item.imageUrl || STUDIO_DISH_IMAGES[0]);
    setIsAvailable(item.isAvailable);
    setIsFeatured(item.isFeatured);
    setModalOpen(true);
  };

  const handleToggleAvailability = async (item: AdminMenuItem) => {
    setTogglingId(item.id);
    const nextAvailable = !item.isAvailable;
    try {
      const res = await fetch(`/api/v1/admin/menu/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextAvailable }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Update Failed", data.error || `Unable to update ${item.name}.`);
        return;
      }

      success(
        nextAvailable ? "Dish Marked Available" : "Dish Marked Sold Out",
        `${item.name} updated.`
      );
      await onRefresh();
    } catch {
      toastError("Network Error", "Could not update dish availability.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.imageUrl) {
        toastError("Upload Failed", data.error || "Unable to upload dish photo.");
        return;
      }

      setImageUrl(data.imageUrl);
      success("Photo Uploaded", "Image saved and attached to this dish.");
    } catch {
      toastError("Upload Error", "Network failure while uploading image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedPriceGhs = Number(priceGhs);
    const basePricePesewas = Math.round(parsedPriceGhs * 100);
    const preparationTimeMinutes = Math.max(1, Math.min(180, Number(prepMinutes) || 20));
    const parsedSpice = Math.max(0, Math.min(5, Number(spiceLevel) || 0));

    if (name.trim().length < 2) {
      toastError("Validation Error", "Dish name must be at least 2 characters.");
      return;
    }
    if (!categoryId) {
      toastError("Validation Error", "Please select a menu category.");
      return;
    }
    if (!Number.isFinite(basePricePesewas) || basePricePesewas <= 0) {
      toastError("Validation Error", "Enter a valid positive price in GH₵.");
      return;
    }
    if (description.trim().length < 5) {
      toastError("Validation Error", "Description must be at least 5 characters.");
      return;
    }

    const cleanSlug = (slug.trim() || slugifyDishName(name)).toLowerCase();

    setSaving(true);
    try {
      const endpoint = editingItem
        ? `/api/v1/admin/menu/items/${editingItem.id}`
        : "/api/v1/admin/menu/items";
      const method = editingItem ? "PATCH" : "POST";

      const payload: Record<string, unknown> = {
        categoryId,
        name: name.trim(),
        description: description.trim(),
        basePricePesewas,
        imageUrl: imageUrl.trim() || STUDIO_DISH_IMAGES[0],
        isAvailable,
        isFeatured,
        spiceLevel: parsedSpice,
        preparationTimeMinutes,
      };
      if (!editingItem) {
        payload.slug = cleanSlug;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Save Failed", data.error || "Unable to save menu dish.");
        return;
      }

      success(
        editingItem ? "Dish Updated" : "Dish Created",
        `${name.trim()} saved to live menu.`
      );
      setModalOpen(false);
      await onRefresh();
    } catch {
      toastError("Network Error", "Could not save menu item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name or ingredient..."
              className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-10 pr-4 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              ariaLabel="Filter dishes by category"
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
              options={[
                { value: "ALL", label: "All Categories" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              variant="surface"
              size="md"
              fullWidth
            />
          </div>
        </div>

        <Button variant="primary" size="md" className="w-full md:w-auto" onClick={openCreateModal}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Dish</span>
        </Button>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl || STUDIO_DISH_IMAGES[0]}
                alt={item.name}
                className="h-16 w-16 rounded-xl object-cover border border-[#333333] bg-[#262626] flex-shrink-0"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-serif text-base font-bold text-[#F5F1EA] truncate">
                    {item.name}
                  </p>
                  {item.isFeatured && (
                    <Sparkles
                      className="h-3.5 w-3.5 text-[#F0444A] flex-shrink-0"
                      aria-label="Featured dish"
                    />
                  )}
                </div>
                <p className="text-xs text-[#A3A3A3] truncate">
                  {item.category?.name || "Menu Item"} &bull;{" "}
                  {item.preparationTimeMinutes || 20}m
                </p>
                <p className="font-mono text-sm font-bold text-[#F0444A] tabular-nums">
                  {formatPesewasToGhs(item.basePricePesewas)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[#333333] pt-3">
              <button
                type="button"
                onClick={() => openEditModal(item)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#262626] hover:border-[#F0444A]/50 px-3 py-1.5 text-xs font-semibold text-[#F5F1EA] transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#A3A3A3]" aria-hidden="true" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleAvailability(item)}
                disabled={togglingId === item.id}
                aria-pressed={item.isAvailable}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  item.isAvailable
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                    : "border-[#D71920]/50 bg-[#D71920]/15 text-[#F0444A] hover:bg-[#D71920]/25"
                }`}
              >
                <span>
                  {togglingId === item.id
                    ? "Saving..."
                    : item.isAvailable
                    ? "Available"
                    : "Sold Out"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Dish Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingItem ? "Edit Menu Dish" : "Add Menu Dish"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-white">
                  {editingItem ? `Edit ${editingItem.name}` : "Add New Dish"}
                </h2>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  Changes go live immediately across web and native mobile menus.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="rounded-xl border border-[#333333] bg-[#262626] p-2 text-[#A3A3A3] hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setName(nextName);
                      if (!editingItem && !slugEdited) {
                        setSlug(slugifyDishName(nextName));
                      }
                    }}
                    placeholder="e.g. Charcoal Tilapia with Banku"
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    URL Slug {editingItem ? "(Locked)" : "*"}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingItem)}
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(slugifyDishName(e.target.value));
                    }}
                    placeholder="charcoal-tilapia-banku"
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] placeholder-[#737373] disabled:opacity-50 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Category *
                  </label>
                  <Select
                    ariaLabel="Dish Category"
                    value={categoryId}
                    onChange={setCategoryId}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    variant="elevated"
                    size="md"
                    fullWidth
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Price (GH₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    required
                    value={priceGhs}
                    onChange={(e) => setPriceGhs(e.target.value)}
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={prepMinutes}
                    onChange={(e) => setPrepMinutes(e.target.value)}
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Spice Level
                  </label>
                  <Select
                    ariaLabel="Spice Level"
                    value={spiceLevel}
                    onChange={setSpiceLevel}
                    options={[
                      { value: "0", label: "0 — None / Sweet" },
                      { value: "1", label: "1 — Mild" },
                      { value: "2", label: "2 — Medium Heat" },
                      { value: "3", label: "3 — Spicy Ghanaian" },
                    ]}
                    variant="elevated"
                    size="md"
                    fullWidth
                  />
                </div>

                <label className="flex items-center gap-2.5 pt-5 cursor-pointer text-xs font-semibold text-[#F5F1EA]">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="h-4 w-4 accent-[#D71920] rounded"
                  />
                  <span>In Stock &amp; Orderable</span>
                </label>

                <label className="flex items-center gap-2.5 pt-5 cursor-pointer text-xs font-semibold text-[#F5F1EA]">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[#D71920] rounded"
                  />
                  <span>Featured Signature Dish</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe preparation, proteins, accompaniments, and sides..."
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>

              {/* Photo Upload + Gallery Picker */}
              <div className="rounded-2xl border border-[#333333] bg-[#262626]/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                    Dish Photography
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Upload Photo</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl || STUDIO_DISH_IMAGES[0]}
                    alt="Preview"
                    className="h-14 w-14 rounded-xl object-cover border border-[#333333] bg-[#161616] flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/dishes/... or https://..."
                    className="flex-1 rounded-xl border border-[#333333] bg-[#1C1C1C] px-3 py-2 text-xs font-mono text-[#F5F1EA] focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {STUDIO_DISH_IMAGES.map((src) => {
                    const active = imageUrl === src;
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setImageUrl(src)}
                        className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                          active
                            ? "border-[#D71920] scale-105"
                            : "border-[#333333] opacity-75 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={src}
                          className="h-full w-full object-cover"
                        />
                        {active && (
                          <span className="absolute top-0.5 right-0.5 rounded-full bg-[#D71920] p-0.5 text-white">
                            <Check className="h-2.5 w-2.5" aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#333333] pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" loading={saving}>
                  <span>{editingItem ? "Save Changes" : "Create Dish"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
