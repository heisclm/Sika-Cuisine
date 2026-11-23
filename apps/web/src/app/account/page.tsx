"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LogIn,
  LogOut,
  Mail,
  Phone,
  Receipt,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import {
  formatFulfilmentStatusLabel,
  formatFulfilmentTypeLabel,
  formatInitials,
  formatTimeOfDayGreeting,
  getDashboardForRole,
} from "@sika/shared";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  PageReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/MotionPrimitives";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
}

interface AccountOrder {
  id: string;
  orderNumber: string;
  fulfilmentType: "DELIVERY" | "COLLECTION";
  fulfilmentStatus: string;
  totalPesewas: number;
  createdAt: string;
  items?: Array<{ id: string; itemNameSnapshot: string; quantity: number }>;
}

function getStatusBadgeVariant(status: string): "brand" | "neutral" | "success" | "warning" | "error" {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (status === "PREPARING" || status === "OUT_FOR_DELIVERY" || status === "READY_FOR_PICKUP") {
    return "brand";
  }
  return "warning";
}

/**
 * Customer Account page powered strictly by live `/api/v1/auth/me` and `/api/v1/orders/my-orders`.
 * Never renders fabricated profiles; displays sign-in actions on 401 responses.
 */
export default function AccountPage() {
  const router = useRouter();
  const { clearCartOnSignOut } = useCart();
  const { info, error: toastError } = useToast();

  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const meRes = await fetch("/api/v1/auth/me", { cache: "no-store" });
      if (meRes.status === 401) {
        setUser(null);
        setOrders([]);
        setLoading(false);
        return;
      }

      const meData = await meRes.json();
      if (!meRes.ok || !meData.success) {
        throw new Error(meData.error || "Unable to verify session.");
      }
      setUser(meData.user);

      const ordersRes = await fetch("/api/v1/orders/my-orders", { cache: "no-store" });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders ?? []);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load account details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      clearCartOnSignOut();
      setShowSignOutConfirm(false);
      setUser(null);
      setOrders([]);
      info("Signed Out", "You've been signed out. See you next time.");
      router.push("/");
      router.refresh();
    } catch {
      toastError("Sign Out Failed", "Unable to close session right now.");
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] py-12 px-4">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-36 rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sika-skeleton" />
          <div className="space-y-4">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#101010] py-16 px-4">
        <div className="mx-auto max-w-lg">
          <ErrorState title="Account Unavailable" message={loadError} onRetry={loadAccount} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={UserIcon}
            title="Sign In to Your Sika Account"
            description="View your saved Sunyani contact details and inspect your real-time order history, or continue tracking by order reference."
            action={
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 text-sm font-semibold text-white transition-colors"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-6 text-sm font-semibold text-[#F5F1EA] transition-colors"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>Create Account</span>
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const isStaff = ["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN"].includes(user.role);
  const isRider = user.role === "DELIVERY_RIDER";
  const staffDestination = getDashboardForRole(user.role);

  return (
    <div className="min-h-screen bg-[#101010] py-10 sm:py-14 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <PageReveal className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-5 sm:p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* Zone A: Avatar + Role Badge + First-Name Greeting + Desktop Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div
                className="flex h-13 w-13 sm:h-15 sm:w-15 flex-shrink-0 items-center justify-center rounded-2xl border border-[#D71920]/45 bg-[#D71920]/15 text-[#F0444A] shadow-[0_8px_20px_rgba(215,25,32,0.16)]"
                aria-hidden="true"
              >
                <span className="font-serif text-lg sm:text-xl font-extrabold tracking-wider text-[#F5F1EA]">
                  {formatInitials(user.fullName)}
                </span>
              </div>
              <div className="min-w-0 space-y-1">
                <Badge variant="brand">
                  {user.role === "CUSTOMER" ? "Customer Account" : staffDestination.title}
                </Badge>
                <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#F5F1EA] truncate">
                  {formatTimeOfDayGreeting(user.fullName)}
                </h1>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              {(isStaff || isRider) && (
                <Link
                  href={staffDestination.path}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-4 text-xs font-semibold text-[#F5F1EA] transition-colors"
                >
                  <ShieldCheck className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                  <span>{staffDestination.label}</span>
                </Link>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowSignOutConfirm(true)}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Zone B: Full-Width Structured Identity & Contact Grid */}
          <div className="mt-5 pt-4 border-t border-[#2A2A2A] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#2C2C2C] bg-[#161616] px-3.5 py-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#222222] text-[#A3A3A3]">
                <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Full Name
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#F5F1EA] truncate">
                  {user.fullName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#2C2C2C] bg-[#161616] px-3.5 py-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#222222] text-[#A3A3A3]">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Email Address
                </p>
                <p className="text-xs sm:text-sm font-medium text-[#E5E5E5] truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#2C2C2C] bg-[#161616] px-3.5 py-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#222222] text-[#A3A3A3]">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Ghana Mobile
                </p>
                <p className="font-mono text-xs sm:text-sm font-semibold text-[#F5F1EA] truncate">
                  {user.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Zone C: Clean Mobile Action Footer */}
          <div className="sm:hidden mt-3.5 pt-3.5 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between gap-2.5">
            {(isStaff || isRider) && (
              <Link
                href={staffDestination.path}
                className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                <span className="truncate">{staffDestination.label}</span>
              </Link>
            )}
            <Button
              variant="danger"
              size="sm"
              className="flex-1 justify-center"
              onClick={() => setShowSignOutConfirm(true)}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </div>
        </PageReveal>

        {/* Order History Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1EA]">
                Your Recent Orders
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A3A3]">
                Live order records associated with your signed-in account.
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-[#F0444A] hover:underline inline-flex items-center gap-1"
            >
              <span>Track by reference</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Orders Placed Yet"
              description="Once you place an order while signed in, its live status timeline and receipt will appear here."
              action={
                <Link
                  href="/menu"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 text-sm font-semibold text-white transition-colors"
                >
                  <span>Browse Menu</span>
                </Link>
              }
            />
          ) : (
            <StaggerContainer className="space-y-3">
              {orders.map((order) => (
                <StaggerItem key={order.id}>
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/60 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.45)] p-5 transition-all duration-200"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {order.orderNumber}
                        </span>
                        <Badge variant={getStatusBadgeVariant(order.fulfilmentStatus)}>
                          {formatFulfilmentStatusLabel(order.fulfilmentStatus)}
                        </Badge>
                        <Badge variant="neutral">
                          {formatFulfilmentTypeLabel(order.fulfilmentType)}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#A3A3A3] line-clamp-2 break-words">
                        {order.items?.length
                          ? order.items
                              .map((i) => `${i.quantity}x ${i.itemNameSnapshot}`)
                              .join(", ")
                          : "Order placed"}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-[#F0444A] tabular-nums">
                          {formatPesewasToGhs(order.totalPesewas)}
                        </span>
                        <ArrowRight
                          className="h-3.5 w-3.5 text-[#737373] group-hover:text-[#F0444A] group-hover:translate-x-1 transition-all duration-200 hidden sm:inline"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-[11px] text-[#737373]">
                        {new Date(order.createdAt).toLocaleDateString("en-GH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        title="Sign Out of Sika Cuisine?"
        description="You can sign back in anytime. Guest checkout and order reference tracking remain available."
        confirmLabel="Sign Out"
        destructive
        loading={signingOut}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
