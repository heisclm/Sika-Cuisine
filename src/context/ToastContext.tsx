"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

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
  success: (title: string, description?: string, action?: { label: string; onClick: () => void }) => void;
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

      setTimeout(() => {
        removeToast(id);
      }, 4200);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string, action?: { label: string; onClick: () => void }) => {
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
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-[#140608]/95 border border-brand-red/40 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all"
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === "success" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              {t.type === "error" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 text-brand-red border border-red-500/30">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
              {t.type === "info" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                  <Info className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-semibold font-serif text-white tracking-wide">
                {t.title}
              </h4>
              {t.description && (
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed font-light">
                  {t.description}
                </p>
              )}
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    removeToast(t.id);
                  }}
                  className="mt-2 inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-brand-gold hover:text-white transition-colors"
                >
                  {t.action.label} &rarr;
                </button>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
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
