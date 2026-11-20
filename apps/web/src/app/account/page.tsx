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
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
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
      setShowSignOutConfirm(false);
      setUser(null);
      setOrders([]);
      info("Signed Out", "Your Sika Cuisine session has ended.");
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

  return (
    <div className="min-h-screen bg-[#101010] py-10 sm:py-14 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <PageReveal className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[#D71920]/40 bg-[#D71920]/15 text-[#F0444A]">
              <UserIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F1EA]">
                  {user.fullName}
                </h1>
                <Badge variant="brand">{user.role.replace(/_/g, " ")}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#A3A3A3]">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#737373]" aria-hidden="true" />
                  {user.email}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-[#737373]" aria-hidden="true" />
                  {user.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isStaff && (
              <Link
                href="/admin"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-4 text-xs font-semibold text-[#F5F1EA] transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                <span>Staff Terminal</span>
              </Link>
            )}
            {isRider && (
              <Link
                href="/rider"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-4 text-xs font-semibold text-[#F5F1EA] transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                <span>Rider Dispatch</span>
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
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.orderNumber}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/60 p-5 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-white">
                        {order.orderNumber}
                      </span>
                      <Badge variant={getStatusBadgeVariant(order.fulfilmentStatus)}>
                        {order.fulfilmentStatus.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="neutral">{order.fulfilmentType}</Badge>
                    </div>
                    <p className="text-xs text-[#A3A3A3]">
                      {order.items?.length
                        ? order.items
                            .map((i) => `${i.quantity}x ${i.itemNameSnapshot}`)
                            .join(", ")
                        : "Order placed"}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                    <span className="font-mono text-base font-bold text-[#F0444A] tabular-nums">
                      {formatPesewasToGhs(order.totalPesewas)}
                    </span>
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
              ))}
            </div>
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
