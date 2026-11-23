"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Bell, X } from "lucide-react";
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

      setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

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
        className="fixed top-[max(12px,env(safe-area-inset-top))] left-3 right-3 mx-auto max-w-[380px] sm:top-20 sm:left-auto sm:right-6 sm:mx-0 sm:w-[360px] md:w-[380px] z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((t) => {
            const barColor =
              t.type === "success"
                ? "bg-[#22C55E]"
                : t.type === "error"
                ? "bg-[#FB7185]"
                : "bg-[#F0444A]";

            return (
              <motion.div
                key={t.id}
                layout
                drag="y"
                dragConstraints={{ top: -80, bottom: 0 }}
                dragElastic={{ top: 0.4, bottom: 0.05 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -28 || info.velocity.y < -200) {
                    removeToast(t.id);
                  }
                }}
                initial={{ opacity: 0, y: -28, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -18,
                  scale: 0.95,
                  transition: { duration: 0.18, ease: SikaMotion.ease },
                }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 28,
                  mass: 0.85,
                }}
                className="pointer-events-auto relative overflow-hidden rounded-2xl border border-white/12 bg-[#161618]/95 shadow-[0_18px_44px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl touch-pan-x"
              >
                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5">
                  <div className="flex-shrink-0 mt-0.5">
                    {t.type === "success" && (
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[#22C55E]/35 bg-[#22C55E]/15 text-[#4ADE80]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                    {t.type === "error" && (
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[#FB7185]/35 bg-[#FB7185]/15 text-[#FDA4AF]">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                    {t.type === "info" && (
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[#D71920]/40 bg-[#D71920]/18 text-[#F0444A]">
                        <Bell className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-[11px] sm:text-xs text-[#B4B4B8] mt-0.5 leading-relaxed break-words">
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
                        className="mt-1.5 inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-[#F0444A] hover:text-white transition-colors"
                      >
                        {t.action.label} &rarr;
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[#A3A3A3] hover:bg-white/[0.14] hover:text-white transition-colors flex-shrink-0"
                    aria-label="Dismiss toast"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>

                {/* Animated bottom countdown hairline */}
                <div className="h-[2.5px] w-full bg-white/[0.05]">
                  <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: 4.2, ease: "linear" }}
                    style={{ transformOrigin: "left" }}
                    className={`h-full w-full ${barColor} opacity-85`}
                  />
                </div>
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
