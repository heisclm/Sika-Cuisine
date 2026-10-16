"use client";

import React, { useState } from "react";
import { X, Plus, Minus, Flame, Sparkles } from "lucide-react";
import { MenuItem, MenuItemOption, SelectedOptionSnapshot } from "@/types/menu";
import { formatPesewasToGhs, calculateLineTotalPesewas } from "@/lib/currency";
import { useCart } from "@/context/CartContext";

interface DishDetailModalProps {
  dish: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  sourceElement?: HTMLElement | null;
}

export function DishDetailModal({
  dish,
  isOpen,
  onClose,
  sourceElement,
}: DishDetailModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<{
    [groupId: string]: MenuItemOption[];
  }>({});
  const [instructions, setInstructions] = useState("");

  if (!isOpen || !dish) return null;

  // Initialize defaults if needed
  const handleSelectOption = (
    groupId: string,
    option: MenuItemOption,
    maxSelect: number
  ) => {
    setSelectedOptionsMap((prev) => {
      const current = prev[groupId] || [];
      if (maxSelect === 1) {
        return { ...prev, [groupId]: [option] };
      } else {
        const exists = current.some((o) => o.id === option.id);
        if (exists) {
          return {
            ...prev,
            [groupId]: current.filter((o) => o.id !== option.id),
          };
        } else {
          if (current.length < maxSelect) {
            return { ...prev, [groupId]: [...current, option] };
          }
          return prev;
        }
      }
    });
  };

  // Compute options delta strictly in integer pesewas
  const selectedOptionsList: SelectedOptionSnapshot[] = [];
  let optionsDeltaPesewas = 0;

  dish.optionGroups?.forEach((group) => {
    const selectedInGroup = selectedOptionsMap[group.id] || [];
    selectedInGroup.forEach((opt) => {
      optionsDeltaPesewas += opt.priceDeltaPesewas;
      selectedOptionsList.push({
        optionGroupId: group.id,
        groupName: group.name,
        optionId: opt.id,
        optionName: opt.name,
        priceDeltaPesewas: opt.priceDeltaPesewas,
      });
    });
  });

  const lineTotalPesewas = calculateLineTotalPesewas(
    dish.basePricePesewas,
    quantity,
    optionsDeltaPesewas
  );

  const handleAddToCart = () => {
    addItem(dish, selectedOptionsList, quantity, instructions, sourceElement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-surface-300 border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Dish Banner Image */}
        <div className="relative h-60 w-full flex-shrink-0 bg-surface-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-300 via-transparent to-black/40" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {dish.spiceLevel && dish.spiceLevel > 0 && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-brand-red">
              <Flame className="h-3.5 w-3.5" />
              <span>Spice Level {dish.spiceLevel}/3</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-brand-red">
              {dish.categoryName || "Traditional Delicacy"}
            </span>
            <h2 className="font-serif text-2xl font-bold text-white mt-1">
              {dish.name}
            </h2>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              {dish.description}
            </p>
          </div>

          {/* Option Groups */}
          {dish.optionGroups && dish.optionGroups.length > 0 && (
            <div className="space-y-6 pt-2">
              {dish.optionGroups.map((group) => {
                const selectedInGroup = selectedOptionsMap[group.id] || [];
                return (
                  <div key={group.id} className="rounded-2xl bg-surface-200/80 p-4 border border-border-subtle">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {group.name}
                        </h4>
                        {group.description && (
                          <p className="text-xs text-gray-400">{group.description}</p>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 bg-surface-100 px-2 py-0.5 rounded-full">
                        {group.isRequired ? "Required" : "Optional"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.options.map((option) => {
                        const isSelected = selectedInGroup.some((o) => o.id === option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              handleSelectOption(group.id, option, group.maxSelect)
                            }
                            className={`flex w-full items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                              isSelected
                                ? "border-brand-red bg-brand-red/10 text-white"
                                : "border-border-subtle bg-surface-100/60 text-gray-300 hover:border-gray-600"
                            }`}
                          >
                            <span className="font-medium">{option.name}</span>
                            <span className="text-xs font-semibold text-gray-400">
                              {option.priceDeltaPesewas > 0
                                ? `+${formatPesewasToGhs(option.priceDeltaPesewas)}`
                                : "Included"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Kitchen Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Pack shito separately, extra red onions on the side..."
              rows={2}
              className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface-300 flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 rounded-full bg-surface-100 px-3 py-2 border border-border-subtle">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-white min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Plate Button */}
          <button
            onClick={handleAddToCart}
            className="btn-red-gradient flex-1 flex items-center justify-between px-6 py-3.5 rounded-full text-base font-semibold text-white shadow-glow"
          >
            <span>Add to Plate</span>
            <span>{formatPesewasToGhs(lineTotalPesewas)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
