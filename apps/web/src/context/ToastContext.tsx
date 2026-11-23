"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const toastViewport = (
    <div
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100vw-24px)] max-w-[360px] sm:top-20 sm:left-auto sm:right-6 sm:translate-x-0 sm:w-[370px] z-[999999] flex flex-col gap-2.5 pointer-events-none pt-[env(safe-area-inset-top)]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => {
          const palette =
            t.type === "success"
              ? {
                  bar: "bg-gradient-to-r from-[#22C55E] to-[#4ADE80]",
                  ring: "border-[#22C55E]/30",
                  iconWrap:
                    "bg-[#22C55E]/15 text-[#4ADE80] ring-1 ring-[#22C55E]/35",
                  glow: "shadow-[0_14px_36px_rgba(0,0,0,0.72),0_0_24px_rgba(34,197,94,0.12)]",
                }
              : t.type === "error"
              ? {
                  bar: "bg-gradient-to-r from-[#EF4444] to-[#FB7185]",
                  ring: "border-[#FB7185]/35",
                  iconWrap:
                    "bg-[#FB7185]/15 text-[#FDA4AF] ring-1 ring-[#FB7185]/35",
                  glow: "shadow-[0_14px_36px_rgba(0,0,0,0.72),0_0_24px_rgba(239,68,68,0.16)]",
                }
              : {
                  bar: "bg-gradient-to-r from-[#D71920] to-[#F0444A]",
                  ring: "border-white/15",
                  iconWrap:
                    "bg-[#D71920]/20 text-[#F0444A] ring-1 ring-[#D71920]/40",
                  glow: "shadow-[0_14px_36px_rgba(0,0,0,0.72),0_0_24px_rgba(215,25,32,0.14)]",
                };

          return (
            <motion.div
              key={t.id}
              layout
              drag="y"
              dragConstraints={{ top: -80, bottom: 0 }}
              dragElastic={{ top: 0.45, bottom: 0.05 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -24 || info.velocity.y < -180) {
                  removeToast(t.id);
                }
              }}
              initial={{ opacity: 0, y: -42, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -24,
                scale: 0.94,
                transition: { duration: 0.18, ease: SikaMotion.ease },
              }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 30,
                mass: 0.8,
              }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${palette.ring} bg-[#141416]/95 ${palette.glow} backdrop-blur-2xl touch-pan-x`}
            >
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full ${palette.iconWrap}`}
                >
                  {t.type === "success" && (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t.type === "error" && (
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t.type === "info" && (
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-semibold tracking-tight text-white leading-tight">
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className="text-[11.5px] text-[#A1A1AA] mt-0.5 leading-snug break-words">
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
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[#A1A1AA] hover:bg-white/[0.15] hover:text-white transition-colors"
                  aria-label="Dismiss toast"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>

              {/* Smooth animated countdown hairline */}
              <div className="h-[2px] w-full bg-white/[0.06]">
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 4.2, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className={`h-full w-full ${palette.bar}`}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {mounted ? createPortal(toastViewport, document.body) : null}
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
