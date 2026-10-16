"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Bike,
  Phone,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { FulfilmentStatus } from "@/types/order";

interface MockAdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfilmentType: "DELIVERY" | "COLLECTION";
  fulfilmentStatus: FulfilmentStatus;
  paymentStatus: "PAID" | "PENDING";
  paymentMethod: "PAYSTACK" | "CASH_ON_DELIVERY";
  locality: string;
  streetAddress: string;
  totalPesewas: number;
  createdAt: string;
  items: { name: string; quantity: number; options: string }[];
}

const INITIAL_ORDERS: MockAdminOrder[] = [
  {
    id: "1",
    orderNumber: "SIKA-2026-1042",
    customerName: "Kwame Mensah",
    customerPhone: "0244123456",
    fulfilmentType: "DELIVERY",
    fulfilmentStatus: "PENDING_CONFIRMATION",
    paymentStatus: "PAID",
    paymentMethod: "PAYSTACK",
    locality: "Fiapre & UENR Campus",
    streetAddress: "House No. 14, Main Campus Gate",
    totalPesewas: 8500, // GH₵85.00
    createdAt: "5 mins ago",
    items: [
      { name: "Sika Signature Jollof Special", quantity: 1, options: "Grilled Tilapia, Mild Shito" },
    ],
  },
  {
    id: "2",
    orderNumber: "SIKA-2026-1041",
    customerName: "Akosua Osei",
    customerPhone: "0209876543",
    fulfilmentType: "DELIVERY",
    fulfilmentStatus: "PREPARING",
    paymentStatus: "PAID",
    paymentMethod: "PAYSTACK",
    locality: "Berlin Top",
    streetAddress: "Sunset View Hill, Villa 4",
    totalPesewas: 12000, // GH₵120.00
    createdAt: "18 mins ago",
    items: [
      { name: "Banku with Grilled Tilapia", quantity: 1, options: "Extra hot green pepper" },
      { name: "House Special Chilled Sobolo", quantity: 2, options: "Ice cold" },
    ],
  },
  {
    id: "3",
    orderNumber: "SIKA-2026-1040",
    customerName: "Emmanuel Baah",
    customerPhone: "0277334455",
    fulfilmentType: "COLLECTION",
    fulfilmentStatus: "READY_FOR_COLLECTION",
    paymentStatus: "PENDING",
    paymentMethod: "CASH_ON_DELIVERY",
    locality: "Kitchen Counter",
    streetAddress: "Pick up at Sunyani Central",
    totalPesewas: 6000, // GH₵60.00
    createdAt: "28 mins ago",
    items: [
      { name: "Waakye Royale Feast", quantity: 1, options: "Extra fish cutlet" },
    ],
  },
];

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<MockAdminOrder[]>(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const updateOrderStatus = (orderId: string, nextStatus: FulfilmentStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, fulfilmentStatus: nextStatus } : o))
    );
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      statusFilter === "ALL" || o.fulfilmentStatus === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.locality.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate live metrics in integer pesewas
  const totalRevenuePesewas = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.totalPesewas, 0);

  const pendingCount = orders.filter((o) => o.fulfilmentStatus === "PENDING_CONFIRMATION").length;
  const activeCount = orders.filter((o) => ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.fulfilmentStatus)).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Banner */}
      <div className="border-b border-border-subtle bg-surface-300 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-red">
              <ChefHat className="h-4 w-4" /> Sunyani Kitchen Operations
            </div>
            <h1 className="font-serif text-3xl font-black text-white mt-1">
              Live Order Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="px-4 py-2 rounded-full bg-surface-200 border border-border-subtle text-xs font-semibold text-gray-300 hover:text-white"
            >
              Public Menu
            </Link>
            <button
              onClick={() => setOrders([...INITIAL_ORDERS])}
              className="btn-red-gradient inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-glow"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Board</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Revenue</span>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="font-serif text-2xl font-black text-white">
              {formatPesewasToGhs(totalRevenuePesewas)}
            </p>
            <span className="text-[11px] text-emerald-400 mt-1 block">Live server calculation</span>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Orders</span>
              <Clock className="h-5 w-5 text-brand-gold" />
            </div>
            <p className="font-serif text-2xl font-black text-white">{pendingCount}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">Requires staff confirmation</span>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active In Kitchen</span>
              <ChefHat className="h-5 w-5 text-brand-red" />
            </div>
            <p className="font-serif text-2xl font-black text-white">{activeCount}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">Preparing or dispatched</span>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Prep Time</span>
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <p className="font-serif text-2xl font-black text-white">22 mins</p>
            <span className="text-[11px] text-blue-400 mt-1 block">Sunyani fast dispatch</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {["ALL", "PENDING_CONFIRMATION", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED"].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-brand-red text-white"
                      : "bg-surface-200 text-gray-400 hover:text-white border border-border-subtle"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              )
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by ref, name, area..."
              className="w-full rounded-full bg-surface-200 border border-border-subtle pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Orders List / Cards */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl bg-surface-300 border border-border-subtle p-12 text-center text-gray-400">
              No orders found for the selected filter.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl bg-surface-300 border border-border-subtle p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-white text-base bg-surface-100 px-3 py-1 rounded-xl border border-border-subtle">
                      {order.orderNumber}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        order.fulfilmentStatus === "PENDING_CONFIRMATION"
                          ? "bg-amber-950/60 text-amber-400 border border-amber-800"
                          : order.fulfilmentStatus === "PREPARING"
                          ? "bg-blue-950/60 text-blue-400 border border-blue-800"
                          : order.fulfilmentStatus === "OUT_FOR_DELIVERY"
                          ? "bg-purple-950/60 text-purple-400 border border-purple-800"
                          : order.fulfilmentStatus === "COMPLETED"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                          : "bg-surface-100 text-gray-400"
                      }`}
                    >
                      {order.fulfilmentStatus.replace(/_/g, " ")}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        order.paymentStatus === "PAID"
                          ? "bg-emerald-950/40 text-emerald-400"
                          : "bg-amber-950/40 text-amber-400"
                      }`}
                    >
                      Payment: {order.paymentStatus} ({order.paymentMethod})
                    </span>

                    <span className="text-xs text-gray-500">{order.createdAt}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
                    <div>
                      <span className="text-xs text-gray-500 block">Customer</span>
                      <span className="font-semibold text-white">{order.customerName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-brand-red" />
                      <span>{order.customerPhone}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-brand-red" />
                      <span>{order.locality}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="pt-2 border-t border-border-subtle/60 flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-surface-200 px-2.5 py-1 text-xs text-gray-300 border border-border-subtle/40"
                      >
                        <strong className="text-white">{item.quantity}x</strong> {item.name}{" "}
                        <span className="text-gray-500">({item.options})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Actions & Total */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Total Amount</span>
                    <span className="font-serif text-2xl font-bold text-brand-red">
                      {formatPesewasToGhs(order.totalPesewas)}
                    </span>
                  </div>

                  {/* Transition Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {order.fulfilmentStatus === "PENDING_CONFIRMATION" && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, "PREPARING")}
                          className="btn-red-gradient px-4 py-2 rounded-full text-xs font-semibold text-white shadow-glow"
                        >
                          Accept & Prepare
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "REJECTED")}
                          className="px-3 py-2 rounded-full bg-surface-100 hover:bg-surface-50 text-xs font-semibold text-gray-400 hover:text-white"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.fulfilmentStatus === "PREPARING" && (
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            order.fulfilmentType === "DELIVERY"
                              ? "OUT_FOR_DELIVERY"
                              : "READY_FOR_COLLECTION"
                          )
                        }
                        className="btn-red-gradient px-4 py-2 rounded-full text-xs font-semibold text-white shadow-glow"
                      >
                        {order.fulfilmentType === "DELIVERY"
                          ? "Dispatch for Delivery"
                          : "Mark Ready for Pickup"}
                      </button>
                    )}

                    {order.fulfilmentStatus === "OUT_FOR_DELIVERY" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                        className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                      >
                        Mark Delivered & Completed
                      </button>
                    )}

                    {order.fulfilmentStatus === "READY_FOR_COLLECTION" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                        className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                      >
                        Handed Over to Customer
                      </button>
                    )}

                    {order.fulfilmentStatus === "COMPLETED" && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
