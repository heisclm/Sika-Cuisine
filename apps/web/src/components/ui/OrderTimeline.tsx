"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  XCircle,
} from "lucide-react";
import {
  formatCustomerTimelineNote,
  FulfilmentStatus,
  FulfilmentType,
  SikaMotion,
} from "@sika/shared";

interface TimelineHistoryEvent {
  id: string;
  toStatus: string;
  note?: string | null;
  createdAt: string;
}

interface OrderTimelineProps {
  fulfilmentType: FulfilmentType;
  currentStatus: FulfilmentStatus;
  history?: TimelineHistoryEvent[];
}

const DELIVERY_STEPS = [
  { status: "PENDING", title: "Order Placed", desc: "Received by kitchen", icon: Clock },
  { status: "CONFIRMED", title: "Confirmed", desc: "Chef acknowledged", icon: CheckCircle2 },
  { status: "PREPARING", title: "Preparing", desc: "Freshly cooked", icon: ChefHat },
  { status: "READY_FOR_DISPATCH", title: "Packed", desc: "Awaiting courier", icon: PackageCheck },
  { status: "OUT_FOR_DELIVERY", title: "On the Way", desc: "Courier in transit", icon: Bike },
  { status: "DELIVERED", title: "Delivered", desc: "Order completed", icon: CheckCircle2 },
] as const;

const PICKUP_STEPS = [
  { status: "PENDING", title: "Order Placed", desc: "Received by kitchen", icon: Clock },
  { status: "CONFIRMED", title: "Confirmed", desc: "Chef acknowledged", icon: CheckCircle2 },
  { status: "PREPARING", title: "Preparing", desc: "Freshly cooked", icon: ChefHat },
  { status: "READY_FOR_PICKUP", title: "Ready for Pickup", desc: "Waiting at counter", icon: PackageCheck },
  { status: "COLLECTED", title: "Collected", desc: "Picked up by guest", icon: CheckCircle2 },
] as const;

export function OrderTimeline({
  fulfilmentType,
  currentStatus,
  history = [],
}: OrderTimelineProps) {
  const isAborted = currentStatus === "CANCELLED" || currentStatus === "REJECTED";
  const steps = fulfilmentType === "COLLECTION" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIdx = steps.findIndex((s) => s.status === currentStatus);
  const completedRatio =
    currentIdx <= 0 ? 0 : Math.min(100, (currentIdx / (steps.length - 1)) * 100);

  if (isAborted) {
    return (
      <div className="rounded-2xl border border-[#FB7185]/40 bg-[#FB7185]/10 p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#FB7185]/20 text-[#FDA4AF]">
          <XCircle className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#FDA4AF]">
            {currentStatus === "REJECTED" ? "Order Declined by Kitchen" : "Order Cancelled"}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#F5F1EA]/80 leading-relaxed">
            {currentStatus === "REJECTED"
              ? "The kitchen was unable to fulfil this order. Reach Sika Cuisine Sunyani if you need help."
              : "This order was cancelled before preparation. Reach Sika Cuisine Sunyani if you have any questions."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop horizontal stepper */}
      <div className="hidden md:block relative pt-2 pb-1">
        <div className="absolute top-9 left-10 right-10 h-0.5 bg-[#333333] overflow-hidden rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completedRatio}%` }}
            transition={{ duration: 0.65, ease: SikaMotion.ease }}
            className="h-full bg-gradient-to-r from-[#22C55E] to-[#D71920]"
          />
        </div>

        <div
          className={`relative z-10 grid gap-3 ${
            steps.length === 6 ? "grid-cols-6" : "grid-cols-5"
          }`}
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentIdx > idx;
            const isCurrent = currentIdx === idx;
            const recorded = history.find((h) => h.toStatus === step.status);

            return (
              <div key={step.status} className="flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center">
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-[#D71920]/45 animate-ping"
                      style={{ animationDuration: "2.2s" }}
                    />
                  )}
                  <div
                    className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${
                      isCurrent
                        ? "border-[#F0444A] bg-[#D71920] text-white shadow-[0_0_24px_rgba(215,25,32,0.5)] scale-105 ring-4 ring-[#D71920]/20"
                        : isCompleted
                        ? "border-[#22C55E]/45 bg-[#22C55E]/15 text-[#4ADE80]"
                        : "border-[#333333] bg-[#262626] text-[#737373]"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <span
                  className={`mt-3 text-xs font-bold ${
                    isCurrent ? "text-[#FFFFFF]" : isCompleted ? "text-[#F5F1EA]" : "text-[#737373]"
                  }`}
                >
                  {step.title}
                </span>
                <span className="mt-0.5 text-[11px] text-[#A3A3A3]">{step.desc}</span>
                {recorded && (
                  <span className="mt-1 font-mono text-[10px] text-[#737373]">
                    {new Date(recorded.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical stepper */}
      <div className="md:hidden space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentIdx > idx;
          const isCurrent = currentIdx === idx;
          const recorded = history.find((h) => h.toStatus === step.status);

          return (
            <div key={step.status} className="relative flex items-start gap-3.5">
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-5 top-10 -bottom-4 w-0.5 ${
                    isCompleted ? "bg-[#22C55E]/50" : "bg-[#333333]"
                  }`}
                />
              )}
              <div className="relative z-10 flex items-center justify-center flex-shrink-0">
                {isCurrent && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl bg-[#D71920]/45 animate-ping"
                    style={{ animationDuration: "2.2s" }}
                  />
                )}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
                    isCurrent
                      ? "border-[#F0444A] bg-[#D71920] text-white shadow-[0_0_16px_rgba(215,25,32,0.4)]"
                      : isCompleted
                      ? "border-[#22C55E]/45 bg-[#22C55E]/15 text-[#4ADE80]"
                      : "border-[#333333] bg-[#262626] text-[#737373]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-bold ${
                      isCurrent ? "text-[#FFFFFF]" : isCompleted ? "text-[#F5F1EA]" : "text-[#737373]"
                    }`}
                  >
                    {step.title}
                  </span>
                  {recorded && (
                    <span className="font-mono text-[11px] text-[#A3A3A3]">
                      {new Date(recorded.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A3A3A3] break-words">
                  {formatCustomerTimelineNote(step.status, recorded?.note, step.desc)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
