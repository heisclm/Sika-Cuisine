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
  Volume2,
  VolumeX,
  Printer,
  Package,
  Layers,
  BarChart3,
  LogOut,
  AlertTriangle,
  Flame,
  Check,
} from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { FulfilmentStatus } from "@/types/order";
import { SIKA_MENU_ITEMS } from "@/app/menu/page";

interface MockAdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfilmentType: "DELIVERY" | "COLLECTION";
  fulfilmentStatus: FulfilmentStatus;
  paymentStatus: "PAID" | "PENDING";
  paymentMethod: "PAYSTACK" | "CASH_ON_DELIVERY" | "CASH_ON_COLLECTION";
  locality: string;
  streetAddress: string;
  totalPesewas: number;
  createdAt: string;
  items: { name: string; quantity: number; options?: string }[];
  customerNotes?: string;
}

const INITIAL_ORDERS: MockAdminOrder[] = [
  {
    id: "1",
    orderNumber: "SIKA-2026-1042",
    customerName: "Kwame Mensah",
    customerPhone: "0533376760",
    fulfilmentType: "DELIVERY",
    fulfilmentStatus: "PENDING",
    paymentStatus: "PAID",
    paymentMethod: "PAYSTACK",
    locality: "Fiapre & UENR Campus",
    streetAddress: "House No. 14, Main Campus Gate",
    totalPesewas: 10000,
    createdAt: "5 mins ago",
    customerNotes: "Please deliver to the gate security post.",
    items: [
      { name: "SIKA Special Combo (De Mixture)", quantity: 1, options: "Standard combo mixture" },
    ],
  },
  {
    id: "2",
    orderNumber: "SIKA-2026-1041",
    customerName: "Akosua Osei",
    customerPhone: "0554406681",
    fulfilmentType: "DELIVERY",
    fulfilmentStatus: "PREPARING",
    paymentStatus: "PAID",
    paymentMethod: "PAYSTACK",
    locality: "Berlin Top",
    streetAddress: "Sunset View Hill, Villa 4",
    totalPesewas: 19000,
    createdAt: "18 mins ago",
    items: [
      { name: "Tilapia with Banku (Chilli)", quantity: 1, options: "Extra hot chilli pepper" },
      { name: "Pineapple Fried Rice", quantity: 1, options: "Fresh Sunyani pineapple" },
    ],
  },
  {
    id: "3",
    orderNumber: "SIKA-2026-1040",
    customerName: "Emmanuel Baah",
    customerPhone: "0277334455",
    fulfilmentType: "COLLECTION",
    fulfilmentStatus: "READY_FOR_PICKUP",
    paymentStatus: "PENDING",
    paymentMethod: "CASH_ON_COLLECTION",
    locality: "Kitchen Counter",
    streetAddress: "Pick up at Sunyani Central",
    totalPesewas: 4000,
    createdAt: "28 mins ago",
    items: [
      { name: "Grilled Chicken with Jollof Rice", quantity: 1, options: "Spicy grilled quarter" },
    ],
  },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "analytics">("orders");
  const [orders, setOrders] = useState<MockAdminOrder[]>(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [audioAlert, setAudioAlert] = useState(true);
  const [activeTicketOrder, setActiveTicketOrder] = useState<MockAdminOrder | null>(null);

  const [menuItemsStock, setMenuItemsStock] = useState<{ [id: string]: boolean }>(() => {
    const map: { [id: string]: boolean } = {};
    SIKA_MENU_ITEMS.forEach((item) => {
      map[item.id] = true;
    });
    return map;
  });
  const [menuSearch, setMenuSearch] = useState("");

  const updateOrderStatus = (orderId: string, nextStatus: FulfilmentStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, fulfilmentStatus: nextStatus } : o))
    );
  };

  const toggleStock = (itemId: string) => {
    setMenuItemsStock((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "ALL" || order.fulfilmentStatus === statusFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.locality.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredMenuItems = SIKA_MENU_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
    (item.categoryName && item.categoryName.toLowerCase().includes(menuSearch.toLowerCase()))
  );

  const totalGrossRevenuePesewas = orders.reduce((sum, o) => sum + o.totalPesewas, 0);
  const paidOrdersCount = orders.filter((o) => o.paymentStatus === "PAID").length;
  const pendingConfirmationCount = orders.filter((o) => o.fulfilmentStatus === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#0d0e12] text-gray-200 pb-24">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#121318]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-red/15 text-brand-red border border-brand-red/30 shadow-glow">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-black text-white">Sika Cuisine Terminal</span>
                <span className="rounded bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[10px] font-mono font-bold px-2 py-0.5">
                  KITCHEN OPS
                </span>
              </div>
              <p className="text-xs text-gray-400">Sunyani Central Branch &bull; Station 1</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setAudioAlert(!audioAlert)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                audioAlert
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                  : "bg-surface-200 border-border-subtle text-gray-400"
              }`}
              title="Toggle order alert chime"
            >
              {audioAlert ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">Chime: {audioAlert ? "ON" : "OFF"}</span>
            </button>

            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-200 hover:bg-surface-100 border border-border-subtle text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4 text-brand-red" />
              <span>Lock Terminal</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2 border-t border-white/5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("orders")}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "orders"
                ? "bg-brand-red text-white shadow-glow"
                : "text-gray-400 hover:text-white hover:bg-surface-200"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            <span>Live Orders</span>
            {pendingConfirmationCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-brand-red text-[10px] font-bold">
                {pendingConfirmationCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("menu")}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "menu"
                ? "bg-brand-red text-white shadow-glow"
                : "text-gray-400 hover:text-white hover:bg-surface-200"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Menu & Stock Control</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "analytics"
                ? "bg-brand-red text-white shadow-glow"
                : "text-gray-400 hover:text-white hover:bg-surface-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Daily Shift Summary</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-[#151720] border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">New / Pending</p>
                  <p className="text-2xl font-bold font-serif text-amber-400 mt-1">
                    {pendingConfirmationCount}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/40 text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#151720] border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">In Kitchen</p>
                  <p className="text-2xl font-bold font-serif text-brand-red mt-1">
                    {orders.filter((o) => o.fulfilmentStatus === "PREPARING").length}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/15 text-brand-red">
                  <ChefHat className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#151720] border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Out for Delivery</p>
                  <p className="text-2xl font-bold font-serif text-purple-400 mt-1">
                    {orders.filter((o) => o.fulfilmentStatus === "OUT_FOR_DELIVERY").length}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/40 text-purple-400">
                  <Bike className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#151720] border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Completed Orders</p>
                  <p className="text-2xl font-bold font-serif text-emerald-400 mt-1">
                    {orders.filter((o) => o.fulfilmentStatus === "DELIVERED" || o.fulfilmentStatus === "COLLECTED").length}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/40 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0 scrollbar-none touch-pan-x">
                {["ALL", "PENDING", "CONFIRMED", "PREPARING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP", "DELIVERED", "COLLECTED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      statusFilter === status
                        ? "bg-surface-100 text-white border border-brand-red"
                        : "bg-surface-300 text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter order number, name..."
                  className="w-full rounded-xl bg-surface-200 border border-white/5 pl-9 pr-3 py-2 sm:py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-[#14161f] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-brand-red/40 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white bg-surface-100 px-2.5 py-1 rounded-lg">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-gray-400">{order.createdAt}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                            : "bg-amber-950/60 text-amber-300 border-amber-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-white text-sm flex items-center justify-between">
                        <span>{order.customerName}</span>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-brand-red hover:underline flex items-center gap-1 font-mono font-normal text-xs"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                      </p>
                      <p className="text-gray-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-brand-red flex-shrink-0" />
                        <span>{order.streetAddress}, {order.locality}</span>
                      </p>
                      {order.customerNotes && (
                        <p className="bg-amber-950/20 text-amber-200/90 border border-amber-900/30 p-2 rounded-lg text-[11px] mt-2 italic">
                          &ldquo;{order.customerNotes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-xs flex justify-between">
                          <span className="text-gray-200 font-medium">
                            {item.quantity}x {item.name}
                          </span>
                          {item.options && (
                            <span className="text-gray-400 text-[11px]">{item.options}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-400">Total Bill:</span>
                      <span className="font-serif text-base font-bold text-white">
                        {formatPesewasToGhs(order.totalPesewas)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {order.fulfilmentStatus === "PENDING" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                          className="w-full btn-red-gradient py-2 rounded-xl text-xs font-semibold text-white shadow-glow"
                        >
                          Confirm & Accept Order
                        </button>
                      )}

                      {order.fulfilmentStatus === "CONFIRMED" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "PREPARING")}
                          className="w-full bg-brand-red hover:bg-brand-red-hover text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Start Cooking on Grill
                        </button>
                      )}

                      {order.fulfilmentStatus === "PREPARING" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              order.fulfilmentType === "DELIVERY"
                                ? "READY_FOR_DISPATCH"
                                : "READY_FOR_PICKUP"
                            )
                          }
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-xs font-semibold transition-colors shadow-glow"
                        >
                          {order.fulfilmentType === "DELIVERY"
                            ? "Pack for Dispatch"
                            : "Ready for Pickup at Counter"}
                        </button>
                      )}

                      {order.fulfilmentStatus === "READY_FOR_DISPATCH" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "OUT_FOR_DELIVERY")}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Dispatch Rider across Sunyani
                        </button>
                      )}

                      {order.fulfilmentStatus === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Confirm Delivered to Customer
                        </button>
                      )}

                      {order.fulfilmentStatus === "READY_FOR_PICKUP" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "COLLECTED")}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Confirm Collected at Counter
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveTicketOrder(order)}
                          className="flex-1 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 text-gray-300 hover:text-white text-[11px] font-medium border border-white/5 inline-flex items-center justify-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Kitchen Ticket</span>
                        </button>
                        {order.fulfilmentStatus !== "DELIVERED" &&
                          order.fulfilmentStatus !== "COLLECTED" &&
                          order.fulfilmentStatus !== "CANCELLED" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-[11px] font-medium border border-red-800/40"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#14161f] border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">
                  Menu Availability & Stock Manager
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  1-Click toggle to instantly mark dishes as Sold Out or Available on the public website.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search dishes or categories..."
                  className="w-full rounded-xl bg-surface-200 border border-white/5 pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            {/* Mobile Card List for phones */}
            <div className="sm:hidden space-y-3">
              {filteredMenuItems.map((item) => {
                const inStock = menuItemsStock[item.id] !== false;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#14161f] border border-white/10 p-4 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-sm line-clamp-1">{item.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="font-mono font-bold text-brand-gold">
                          {formatPesewasToGhs(item.basePricePesewas)}
                        </span>
                        <span>&bull;</span>
                        <span className="text-[11px]">{item.categoryName}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStock(item.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                        inStock
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
                          : "bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900"
                      }`}
                    >
                      {inStock ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          <span>Sold Out</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop & Tablet Table */}
            <div className="hidden sm:block rounded-2xl bg-[#14161f] border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1a1d28] border-b border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Dish Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Base Price</th>
                      <th className="py-3 px-4">Cook Time</th>
                      <th className="py-3 px-4 text-right">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMenuItems.map((item) => {
                      const inStock = menuItemsStock[item.id] !== false;

                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {item.name}
                          </td>
                          <td className="py-3.5 px-4 text-gray-400">
                            {item.categoryName}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-brand-gold">
                            {formatPesewasToGhs(item.basePricePesewas)}
                          </td>
                          <td className="py-3.5 px-4 text-gray-400">
                            {item.preparationTimeMinutes} mins
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => toggleStock(item.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                inStock
                                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
                                  : "bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900"
                              }`}
                            >
                              {inStock ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>In Stock</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  <span>Sold Out</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-[#14161f] border border-white/10 p-6 space-y-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Today&apos;s Gross Volume
                </span>
                <p className="font-serif text-3xl font-black text-white">
                  {formatPesewasToGhs(totalGrossRevenuePesewas)}
                </p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Calculated from {orders.length} orders</span>
                </p>
              </div>

              <div className="rounded-2xl bg-[#14161f] border border-white/10 p-6 space-y-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Paid Revenue (Paystack)
                </span>
                <p className="font-serif text-3xl font-black text-brand-gold">
                  {formatPesewasToGhs(
                    orders
                      .filter((o) => o.paymentStatus === "PAID")
                      .reduce((sum, o) => sum + o.totalPesewas, 0)
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {paidOrdersCount} transactions settled
                </p>
              </div>

              <div className="rounded-2xl bg-[#14161f] border border-white/10 p-6 space-y-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Cash on Delivery / Pickup
                </span>
                <p className="font-serif text-3xl font-black text-gray-300">
                  {formatPesewasToGhs(
                    orders
                      .filter((o) => o.paymentMethod === "CASH_ON_DELIVERY")
                      .reduce((sum, o) => sum + o.totalPesewas, 0)
                  )}
                </p>
                <p className="text-xs text-amber-300">To be collected upon handover</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#14161f] border border-white/10 p-6 space-y-4">
              <h3 className="font-serif text-lg font-bold text-white">
                Sunyani Delivery Zones Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Fiapre & UENR Campus</span>
                  <span className="font-mono text-white font-bold">2 Orders &bull; GH₵200.00</span>
                </div>
                <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-red h-full w-[65%]" />
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-gray-300">Berlin Top</span>
                  <span className="font-mono text-white font-bold">1 Order &bull; GH₵190.00</span>
                </div>
                <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[35%]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {activeTicketOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white text-black p-6 space-y-4 font-mono shadow-2xl">
            <div className="text-center border-b border-black/20 pb-3">
              <h4 className="font-black text-base uppercase">SIKA CUISINE SUNYANI</h4>
              <p className="text-[11px] text-gray-600">KITCHEN DISPATCH TICKET</p>
              <p className="text-sm font-bold mt-1">{activeTicketOrder.orderNumber}</p>
              <p className="text-[10px] text-gray-500">{activeTicketOrder.createdAt}</p>
            </div>

            <div className="text-xs space-y-2 border-b border-black/20 pb-3">
              <p><strong>Customer:</strong> {activeTicketOrder.customerName}</p>
              <p><strong>Phone:</strong> {activeTicketOrder.customerPhone}</p>
              <p><strong>Locality:</strong> {activeTicketOrder.locality}</p>
              {activeTicketOrder.customerNotes && (
                <p className="bg-gray-100 p-1.5 rounded text-[11px]">
                  <strong>NOTE:</strong> {activeTicketOrder.customerNotes}
                </p>
              )}
            </div>

            <div className="text-xs space-y-1.5 border-b border-black/20 pb-3">
              <p className="font-bold uppercase text-[10px] text-gray-600">ITEMS TO PREPARE:</p>
              {activeTicketOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                </div>
              ))}
            </div>

            <div className="text-xs flex justify-between font-bold pt-1">
              <span>TOTAL BILL:</span>
              <span>{formatPesewasToGhs(activeTicketOrder.totalPesewas)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
              >
                Print Slip
              </button>
              <button
                onClick={() => setActiveTicketOrder(null)}
                className="flex-1 py-2 rounded bg-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
