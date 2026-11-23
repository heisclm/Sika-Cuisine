"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { SikaMotion } from "@sika/shared";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      prevFocus?.focus?.();
    };
  }, [isOpen, loading, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: SikaMotion.quick / 1000 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !loading && onCancel()}
            aria-hidden="true"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sika-confirm-title"
            aria-describedby="sika-confirm-desc"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: SikaMotion.standard / 1000, ease: SikaMotion.ease }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-[#333333] bg-[#1C1C1C] p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label="Close confirmation dialog"
              className="absolute top-4 right-4 rounded-full p-1.5 text-[#A3A3A3] hover:bg-[#262626] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                  destructive
                    ? "border-[#FB7185]/35 bg-[#FB7185]/15 text-[#FDA4AF]"
                    : "border-[#D71920]/35 bg-[#D71920]/15 text-[#F0444A]"
                }`}
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="pr-4">
                <h2 id="sika-confirm-title" className="font-serif text-lg font-bold text-[#F5F1EA]">
                  {title}
                </h2>
                <p id="sika-confirm-desc" className="mt-1.5 text-sm leading-relaxed text-[#A3A3A3]">
                  {description}
                </p>
              </div>
            </div>

            {children ? <div className="mt-4">{children}</div> : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button ref={cancelRef} variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                variant={destructive ? "danger" : "primary"}
                size="sm"
                loading={loading}
                disabled={loading || confirmDisabled}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
