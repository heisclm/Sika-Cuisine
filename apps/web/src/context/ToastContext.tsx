"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { SikaMotion } from "@sika/shared";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (options: {
    type?: ToastType;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  }) => void;
  success: (
    title: string,
    description?: string,
    action?: { label: string; onClick: () => void }
  ) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = "success",
      title,
      description,
      action,
    }: {
      type?: ToastType;
      title: string;
      description?: string;
      action?: { label: string; onClick: () => void };
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastMessage = { id, type, title, description, action };

      setToasts((prev) => [...prev.slice(-3), newToast]);

      window.setTimeout(() => {
        removeToast(id);
      }, 4200);
    },
    [removeToast]
  );

  const success = useCallback(
    (
      title: string,
      description?: string,
      action?: { label: string; onClick: () => void }
    ) => {
      toast({ type: "success", title, description, action });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      toast({ type: "error", title, description });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ type: "info", title, description });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const borderAccent =
              t.type === "success"
                ? "border-l-[#22C55E]"
                : t.type === "error"
                ? "border-l-[#FB7185]"
                : "border-l-[#D71920]";

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: SikaMotion.standard / 1000, ease: SikaMotion.ease }}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#333333] border-l-4 ${borderAccent} bg-[#1C1C1C]/95 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.65)] backdrop-blur-xl`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {t.type === "success" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#22C55E]/35 bg-[#22C55E]/15 text-[#4ADE80]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                  {t.type === "error" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#FB7185]/35 bg-[#FB7185]/15 text-[#FDA4AF]">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                  {t.type === "info" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D71920]/40 bg-[#D71920]/15 text-[#F0444A]">
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-xs font-semibold font-serif text-[#F5F1EA] tracking-wide">
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className="text-[11px] text-[#A3A3A3] mt-0.5 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        removeToast(t.id);
                      }}
                      className="mt-2 inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-[#F0444A] hover:text-white transition-colors"
                    >
                      {t.action.label} &rarr;
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-[#A3A3A3] hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Dismiss toast"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
