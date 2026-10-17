"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bike,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  Package,
  Power,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { RiderDeliveryTask } from "@/types/auth";

const INITIAL_RIDER_TASKS: RiderDeliveryTask[] = [
  {
    id: "task-1042",
    orderNumber: "SIKA-2026-1042",
    customerName: "Kwame Mensah",
    customerPhone: "0533376760",
    recipientAddress: "House No. 14, Main Campus Gate",
    locality: "Fiapre & UENR Campus",
    landmark: "Opposite UENR Main Gate, near Total Filling Station",
    deliveryFeePesewas: 2000,
    totalPesewas: 10000,
    paymentMethod: "PAYSTACK",
    paymentStatus: "PAID",
    itemsSummary: "1x SIKA Special Combo (De Mixture)",
    createdAt: "10 mins ago",
    estimatedDeliveryMinutes: 25,
    customerNotes: "Please deliver to the gate security post.",
    status: "PICKED_UP",
  },
  {
    id: "task-1043",
    orderNumber: "SIKA-2026-1043",
    customerName: "Abena Osei",
    customerPhone: "0554406681",
    recipientAddress: "Sunset View Hill, Villa 4",
    locality: "Berlin Top",
    landmark: "Near Berlin Top Water Reservoir",
    deliveryFeePesewas: 2000,
    totalPesewas: 10000,
    paymentMethod: "CASH_ON_DELIVERY",
    paymentStatus: "PENDING",
    itemsSummary: "1x Tilapia with Banku (Chilli)",
    createdAt: "18 mins ago",
    estimatedDeliveryMinutes: 30,
    customerNotes: "Call when you reach the hill junction.",
    status: "ASSIGNED",
  },
  {
    id: "task-1040",
    orderNumber: "SIKA-2026-1040",
    customerName: "Dr. Kofi Frimpong",
    customerPhone: "0244123456",
    recipientAddress: "Sunyani Municipal Hospital, Ward B",
    locality: "Sunyani Central",
    landmark: "Hospital Main Pharmacy Gate",
    deliveryFeePesewas: 1500,
    totalPesewas: 5500,
    paymentMethod: "PAYSTACK",
    paymentStatus: "PAID",
    itemsSummary: "1x Banku with Okro Soup (Beef)",
    createdAt: "1 hour ago",
    estimatedDeliveryMinutes: 15,
    status: "DELIVERED",
  },
];

export default function RiderDashboardPage() {
  const [tasks, setTasks] = useState<RiderDeliveryTask[]>(INITIAL_RIDER_TASKS);
  const [onDuty, setOnDuty] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "REMITTANCE">("ACTIVE");
  const [confirmModalTask, setConfirmModalTask] = useState<RiderDeliveryTask | null>(null);

  const activeTasks = tasks.filter((t) => t.status !== "DELIVERED");
  const completedTasks = tasks.filter((t) => t.status === "DELIVERED");

  const totalCodCollectedPesewas = completedTasks
    .filter((t) => t.paymentMethod === "CASH_ON_DELIVERY")
    .reduce((sum, t) => sum + t.totalPesewas, 0);

  const totalDeliveryEarningsPesewas = completedTasks.length * 1500;

  const handlePickUp = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "PICKED_UP" } : t))
    );
  };

  const handleConfirmDelivered = () => {
    if (!confirmModalTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === confirmModalTask.id
          ? { ...t, status: "DELIVERED", paymentStatus: "PAID" }
          : t
      )
    );
    setConfirmModalTask(null);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-200 pb-20">
      {/* Top Mobile Status Header */}
      <header className="sticky top-0 z-30 bg-[#0e1014]/95 border-b border-border-subtle/80 backdrop-blur-xl px-4 py-3.5">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-sm font-bold text-white leading-tight">
                  Kofi Mensah
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-100 text-gray-400">
                  Rider #04
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Sunyani Direct Motor Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnDuty(!onDuty)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                onDuty
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800 animate-pulse"
                  : "bg-surface-200 text-gray-400 border-border-subtle"
              }`}
            >
              <Power className="h-3 w-3" />
              <span>{onDuty ? "ON DUTY" : "OFF DUTY"}</span>
            </button>
            <Link
              href="/rider/login"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        {/* Real-time Shift Metric Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-surface-300 border border-border-subtle p-3 text-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-0.5">
              Active Orders
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {activeTasks.length}
            </span>
          </div>

          <div className="rounded-2xl bg-surface-300 border border-border-subtle p-3 text-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-0.5">
              Delivered
            </span>
            <span className="text-xl font-bold font-mono text-white">
              {completedTasks.length}
            </span>
          </div>

          <div className="rounded-2xl bg-surface-300 border border-border-subtle p-3 text-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-0.5">
              COD in Pocket
            </span>
            <span className="text-sm font-bold font-mono text-brand-gold">
              {formatPesewasToGhs(totalCodCollectedPesewas)}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-2xl bg-surface-200 p-1 border border-border-subtle text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-glow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Active Tasks ({activeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-glow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Delivered ({completedTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("REMITTANCE")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "REMITTANCE"
                ? "bg-emerald-600 text-white shadow-glow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Remit Cash
          </button>
        </div>

        {/* ACTIVE DELIVERIES TAB */}
        {activeTab === "ACTIVE" && (
          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 text-center space-y-2">
                <Bike className="h-10 w-10 text-gray-500 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-white">All Clear!</h3>
                <p className="text-xs text-gray-400">
                  No pending delivery tickets at this moment. You will be alerted when the kitchen finishes packaging.
                </p>
              </div>
            ) : (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-3xl bg-surface-300 border border-border-subtle p-5 space-y-4 shadow-card"
                >
                  {/* Card Header: Order # & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle/80">
                    <div>
                      <span className="font-mono text-sm font-bold text-white">
                        {task.orderNumber}
                      </span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Received {task.createdAt} &bull; ~{task.estimatedDeliveryMinutes}m target
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        task.status === "PICKED_UP"
                          ? "bg-brand-red/15 text-brand-red border-brand-red/30 animate-pulse"
                          : "bg-blue-950/60 text-blue-400 border-blue-800"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{task.status === "PICKED_UP" ? "On Motorbike" : "Kitchen Packaging"}</span>
                    </span>
                  </div>

                  {/* Sunyani Destination Details */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-brand-red mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-white font-serif">
                          {task.locality}
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-light">
                          {task.recipientAddress}
                        </p>
                        {task.landmark && (
                          <p className="text-[11px] text-brand-gold mt-0.5 font-medium">
                            Landmark: {task.landmark}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-surface-200/80 p-2.5 text-xs text-gray-300">
                      <span className="font-semibold text-white block mb-0.5">Delicacies to Deliver:</span>
                      <span>{task.itemsSummary}</span>
                    </div>

                    {task.customerNotes && (
                      <div className="rounded-xl bg-amber-950/30 border border-amber-900/40 p-2.5 text-xs text-amber-200">
                        <span className="font-semibold block mb-0.5">Customer Instructions:</span>
                        <span>{task.customerNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Details Pill */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-200 border border-border-subtle">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 block -mb-0.5">
                        Payment Mode
                      </span>
                      {task.paymentMethod === "PAYSTACK" ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" /> PAID ONLINE (No Cash)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-brand-gold flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" /> COLLECT COD CASH
                        </span>
                      )}
                    </div>
                    <span className="font-serif text-lg font-bold text-white font-mono">
                      {formatPesewasToGhs(task.totalPesewas)}
                    </span>
                  </div>

                  {/* Action Grid: Call, WhatsApp, Navigation */}
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`tel:+233${task.customerPhone.replace(/\D/g, "").slice(-9)}`}
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-surface-200 hover:bg-surface-100 border border-border-subtle text-white transition-colors"
                    >
                      <Phone className="h-4 w-4 text-emerald-400 mb-1" />
                      <span className="text-[10px] font-semibold">Call Customer</span>
                    </a>

                    <a
                      href={`https://wa.me/233${task.customerPhone.replace(/\D/g, "").slice(-9)}?text=Hello%20${encodeURIComponent(task.customerName)},%20this%20is%20Kofi%20from%20Sika%20Cuisine%20dispatch.%20I%20am%20heading%20to%20your%20address%20in%20${encodeURIComponent(task.locality)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-surface-200 hover:bg-surface-100 border border-border-subtle text-white transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-400 mb-1" />
                      <span className="text-[10px] font-semibold">WhatsApp</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${task.locality} ${task.landmark || ""} Sunyani Ghana`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-surface-200 hover:bg-surface-100 border border-border-subtle text-white transition-colors"
                    >
                      <Navigation className="h-4 w-4 text-blue-400 mb-1" />
                      <span className="text-[10px] font-semibold">Google Maps</span>
                    </a>
                  </div>

                  {/* Progression Button */}
                  {task.status === "ASSIGNED" ? (
                    <button
                      onClick={() => handlePickUp(task.id)}
                      className="flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-glow transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      <span>Confirm Picked Up from Kitchen Counter</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmModalTask(task)}
                      className="flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-glow transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm Delivered to Customer</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* COMPLETED TAB */}
        {activeTab === "COMPLETED" && (
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 text-center text-xs text-gray-400">
                No orders marked delivered today yet.
              </div>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl bg-surface-300 border border-border-subtle p-4 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        {task.orderNumber}
                      </span>
                      <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        Delivered
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{task.customerName} &bull; {task.locality}</p>
                  </div>
                  <span className="font-serif text-sm font-bold text-white font-mono">
                    {formatPesewasToGhs(task.totalPesewas)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* REMITTANCE VOUCHER TAB */}
        {activeTab === "REMITTANCE" && (
          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
                End-of-Shift Reconciliation
              </span>
              <h3 className="font-serif text-xl font-bold text-white">
                Cash on Delivery Remittance
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Hand over this cash amount to the Sika Cuisine head cashier counter at Commercial Road, Sunyani at the end of your shift.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-200 border border-border-subtle p-5 text-center space-y-2">
              <span className="text-xs text-gray-400 uppercase tracking-widest block font-medium">
                Physical Cash in Pocket
              </span>
              <span className="font-serif text-3xl font-black text-brand-gold font-mono block">
                {formatPesewasToGhs(totalCodCollectedPesewas)}
              </span>
              <span className="text-[11px] text-gray-400 block">
                Derived from {completedTasks.filter((t) => t.paymentMethod === "CASH_ON_DELIVERY").length} cash deliveries today
              </span>
            </div>

            <div className="border-t border-border-subtle/80 pt-4 space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Rider Commission Earned Today:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatPesewasToGhs(totalDeliveryEarningsPesewas)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Mileage/Trips:</span>
                <span className="font-bold text-white">{completedTasks.length} Trips across Sunyani</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-white">
                  Confirm Delivery
                </h4>
                <p className="text-xs text-gray-400 font-mono">{confirmModalTask.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Confirm that delicacies were delivered to <strong>{confirmModalTask.customerName}</strong> in <strong>{confirmModalTask.locality}</strong>.
            </p>

            {confirmModalTask.paymentMethod === "CASH_ON_DELIVERY" && (
              <div className="rounded-2xl bg-amber-950/40 border border-amber-800/60 p-3 text-xs text-amber-200 space-y-1">
                <span className="font-bold block">Cash Collection Required:</span>
                <span className="text-lg font-bold font-mono text-white block">
                  {formatPesewasToGhs(confirmModalTask.totalPesewas)}
                </span>
                <span className="text-[11px] text-gray-300 block">
                  Ensure customer has paid cash before completing.
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModalTask(null)}
                className="flex-1 py-3 rounded-xl bg-surface-100 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivered}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-glow transition-colors"
              >
                Confirm Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
