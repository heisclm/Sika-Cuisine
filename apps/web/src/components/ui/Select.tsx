"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { SikaMotion } from "@sika/shared";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
}

export interface SelectProps {
  id?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  placement?: "bottom" | "top";
  variant?: "surface" | "elevated";
  size?: "sm" | "md";
  fullWidth?: boolean;
  menuAlign?: "left" | "right";
  className?: string;
  menuClassName?: string;
}

/**
 * Custom accessible listbox select styled to match Sika Cuisine's dark charcoal surfaces
 * (`#1C1C1C` / `#262626`) and crimson accent highlights (`#D71920` / `#F0444A`), eliminating
 * browser-native OS select popup styling mismatches.
 */
export function Select({
  id,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  leadingIcon,
  placement = "bottom",
  variant = "surface",
  size = "md",
  fullWidth = false,
  menuAlign = "left",
  className = "",
  menuClassName = "",
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id || `sika-select-${generatedId}`;
  const listboxId = `${triggerId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);

  useEffect(() => {
    setHighlightedIndex(
      Math.max(
        0,
        options.findIndex((o) => o.value === value)
      )
    );
  }, [value, options, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  const selectOption = (opt: SelectOption) => {
    onChange(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev + 1) % options.length);
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
        }
        break;
      }
      case "Home": {
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      }
      case "End": {
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(options.length - 1);
        }
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const targetOpt = options[highlightedIndex];
          if (targetOpt) selectOption(targetOpt);
        }
        break;
      }
      case "Tab": {
        setIsOpen(false);
        break;
      }
    }
  };

  const triggerSurface =
    variant === "elevated" ? "bg-[#262626]" : "bg-[#1C1C1C]";
  const triggerSize =
    size === "sm"
      ? "h-9 px-3 text-xs rounded-xl gap-2"
      : "min-h-[46px] px-4 py-2.5 text-sm rounded-xl gap-2.5";

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full" : "inline-block"} ${className}`}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && options[highlightedIndex]
            ? `${listboxId}-opt-${highlightedIndex}`
            : undefined
        }
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between border transition-colors focus-visible:outline-none ${
          fullWidth ? "w-full" : ""
        } ${triggerSurface} ${triggerSize} ${
          isOpen
            ? "border-[#D71920] text-white"
            : "border-[#333333] hover:border-[#4A4A4A] text-[#F5F1EA]"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {leadingIcon && (
            <span className="flex-shrink-0 text-[#F0444A]" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <span className="truncate font-semibold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <span className="flex items-center gap-2 flex-shrink-0 ml-2">
          {selectedOption?.meta && size === "md" && (
            <span className="font-mono text-xs font-bold text-[#F0444A] tabular-nums">
              {selectedOption.meta}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-[#A3A3A3] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#F0444A]" : ""
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            initial={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: SikaMotion.quick / 1000, ease: SikaMotion.ease }}
            className={`absolute z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#333333] bg-[#1C1C1C] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.88)] backdrop-blur-xl space-y-0.5 max-w-[calc(100vw-2rem)] ${
              menuAlign === "right"
                ? "right-0 min-w-[205px]"
                : fullWidth
                ? "left-0 right-0 min-w-[205px]"
                : "left-0 min-w-[205px]"
            } ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"} ${menuClassName}`}
          >
            {options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(opt)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "border-[#D71920]/45 bg-[#D71920]/15 text-[#F5F1EA]"
                      : isHighlighted
                      ? "border-transparent bg-[#262626] text-white"
                      : "border-transparent text-[#D4D4D4] hover:bg-[#262626] hover:text-white"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate ${
                        size === "sm" ? "text-xs" : "text-sm"
                      } ${isSelected ? "font-bold text-white" : "font-medium"}`}
                    >
                      {opt.label}
                    </p>
                    {opt.description && (
                      <p className="mt-0.5 truncate text-[11px] text-[#A3A3A3]">
                        {opt.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {opt.meta && (
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          size === "sm" ? "text-[11px]" : "text-xs"
                        } ${isSelected ? "text-[#F0444A]" : "text-[#A3A3A3]"}`}
                      >
                        {opt.meta}
                      </span>
                    )}
                    <span className="flex h-4 w-4 items-center justify-center">
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
