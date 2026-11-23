"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Bell, CheckCircle2, X } from "lucide-react";
import { SikaMotion } from "@sika/shared";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs: number;
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
    durationMs?: number;
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

const DEFAULT_DURATION_MS = 4500;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TONE_STYLES: Record<
  ToastType,
  {
    accentBar: string;
    border: string;
    iconWrap: string;
    progressBar: string;
    shadowGlow: string;
    label: string;
  }
> = {
  success: {
    accentBar: "bg-[#22C55E]",
    border: "border-[#22C55E]/35",
    iconWrap: "border border-[#22C55E]/40 bg-[#22C55E]/15 text-[#4ADE80]",
    progressBar: "bg-gradient-to-r from-[#22C55E] to-[#4ADE80]",
    shadowGlow:
      "shadow-[0_20px_48px_rgba(0,0,0,0.82),0_0_28px_rgba(34,197,94,0.12)]",
    label: "Confirmed",
  },
  error: {
    accentBar: "bg-[#FB7185]",
    border: "border-[#FB7185]/40",
    iconWrap: "border border-[#FB7185]/40 bg-[#FB7185]/15 text-[#FDA4AF]",
    progressBar: "bg-gradient-to-r from-[#EF4444] to-[#FB7185]",
    shadowGlow:
      "shadow-[0_20px_48px_rgba(0,0,0,0.82),0_0_28px_rgba(251,113,133,0.16)]",
    label: "Attention",
  },
  info: {
    accentBar: "bg-[#D71920]",
    border: "border-[#D71920]/45",
    iconWrap: "border border-[#D71920]/45 bg-[#D71920]/20 text-[#F0444A]",
    progressBar: "bg-gradient-to-r from-[#D71920] to-[#F0444A]",
    shadowGlow:
      "shadow-[0_20px_48px_rgba(0,0,0,0.82),0_0_28px_rgba(215,25,32,0.18)]",
    label: "Sika Update",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    setMounted(true);
    const activeTimers = timersRef.current;
    return () => {
      activeTimers.forEach((timerId) => window.clearTimeout(timerId));
      activeTimers.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = "success",
      title,
      description,
      durationMs = DEFAULT_DURATION_MS,
      action,
    }: {
      type?: ToastType;
      title: string;
      description?: string;
      durationMs?: number;
      action?: { label: string; onClick: () => void };
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextToast: ToastMessage = {
        id,
        type,
        title,
        description,
        durationMs,
        action,
      };

      setToasts((prev) => [nextToast, ...prev.slice(0, 2)]);

      const timerId = window.setTimeout(() => {
        removeToast(id);
      }, durationMs);
      timersRef.current.set(id, timerId);
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
      toast({ type: "error", title, description, durationMs: 5200 });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ type: "info", title, description });
    },
    [toast]
  );

  const toastPortal = (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 top-3 z-[9999] mx-auto flex max-w-[460px] flex-col gap-2.5 sm:inset-x-auto sm:right-6 sm:top-24 sm:mx-0 sm:w-[420px]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => {
          const tone = TONE_STYLES[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              drag="y"
              dragConstraints={{ top: -90, bottom: 0 }}
              dragElastic={{ top: 0.4, bottom: 0.05 }}
              onDragEnd={(_, dragInfo) => {
                if (dragInfo.offset.y < -26 || dragInfo.velocity.y < -180) {
                  removeToast(t.id);
                }
              }}
              initial={{ opacity: 0, y: -32, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.95,
                transition: { duration: 0.18, ease: SikaMotion.ease },
              }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 28,
                mass: 0.85,
              }}
              role="status"
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${tone.border} bg-[#1C1C1C]/95 backdrop-blur-xl ${tone.shadowGlow}`}
            >
              {/* Left signature accent stripe */}
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1 ${tone.accentBar}`}
              />

              <div className="flex items-start gap-3.5 py-4 pl-4 pr-3.5 sm:py-4 sm:pl-5 sm:pr-4">
                <div
                  className={`mt-0.5 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}
                >
                  {t.type === "success" && (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  )}
                  {t.type === "error" && (
                    <AlertCircle className="h-5 w-5" aria-hidden="true" />
                  )}
                  {t.type === "info" && (
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#A3A3A3]">
                    {tone.label}
                  </span>
                  <h4 className="mt-0.5 text-sm sm:text-[15px] font-bold leading-snug text-[#F5F1EA]">
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-[#A3A3A3] break-words">
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
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#D71920]/45 bg-[#D71920]/15 px-3 py-1.5 text-xs font-bold text-[#F5F1EA] transition-colors hover:bg-[#D71920] hover:text-white"
                    >
                      <span>{t.action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  aria-label="Dismiss notification"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#333333] bg-[#262626] text-[#A3A3A3] transition-colors hover:border-[#484848] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Countdown progress hairline */}
              <div className="h-[3px] w-full bg-[#262626]">
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{
                    duration: t.durationMs / 1000,
                    ease: "linear",
                  }}
                  style={{ transformOrigin: "left" }}
                  className={`h-full w-full ${tone.progressBar}`}
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
      {mounted ? createPortal(toastPortal, document.body) : null}
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
