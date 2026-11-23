"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ChevronRight, Trash2 } from "lucide-react";
import { InAppNotificationDTO } from "@sika/shared";
import { useToast } from "@/context/ToastContext";

function formatRelativeTime(isoDate: string): string {
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
  );
  if (diffSeconds < 60) return "Just now";
  const mins = Math.floor(diffSeconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(isoDate).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

/**
 * Persistent Web In-App Notification Bell & Dropdown Panel.
 * Polls `/api/v1/notifications` every 15s while visible, surfaces live toast alerts
 * for newly arrived notifications, and allows 1-click mark-read + deep navigation.
 */
export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const { info } = useToast();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.success || !Array.isArray(data.notifications)) return;

      const list = data.notifications as InAppNotificationDTO[];
      setNotifications(list);
      setUnreadCount(Number(data.unreadCount ?? 0));

      if (!initializedRef.current) {
        list.forEach((n) => seenIdsRef.current.add(n.id));
        initializedRef.current = true;
        return;
      }

      const newlyArrived = list.filter(
        (n) => !n.isRead && !seenIdsRef.current.has(n.id)
      );
      list.forEach((n) => seenIdsRef.current.add(n.id));

      if (newlyArrived.length > 0) {
        const latest = newlyArrived[0];
        info(latest.title, latest.body);
      }
    } catch {
    }
  }, [info]);

  useEffect(() => {
    initializedRef.current = false;
    seenIdsRef.current.clear();
    void fetchNotifications();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    }, 15_000);

    return () => window.clearInterval(timer);
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/v1/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        seenIdsRef.current.clear();
        info("Notifications Cleared", "Your notification history is now empty.");
      }
    } catch {
    } finally {
      setClearingAll(false);
    }
  };

  const handleOpenItem = async (item: InAppNotificationDTO) => {
    setOpen(false);
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      void fetch("/api/v1/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id }),
      }).catch(() => {});
    }

    if (item.actionUrl) {
      router.push(item.actionUrl);
    } else if (item.orderNumber) {
      router.push(`/orders/${encodeURIComponent(item.orderNumber)}`);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void fetchNotifications();
        }}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-[#333333] bg-[#1C1C1C] text-[#F5F1EA] hover:border-[#D71920]/60 hover:bg-[#262626] active:scale-95 transition-all"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-[#D71920] text-[10px] font-bold text-white shadow-md tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="In-app notifications"
          className="absolute right-0 mt-2.5 w-80 sm:w-96 max-h-[72vh] flex flex-col rounded-2xl border border-[#333333] bg-[#1C1C1C] shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden z-50"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#333333] bg-[#161616] px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-sm font-bold text-[#F5F1EA] truncate">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#D71920]/20 border border-[#D71920]/40 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F0444A] tabular-nums shrink-0">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={markingAll || clearingAll}
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F0444A] hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  disabled={clearingAll || markingAll}
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#333333] bg-[#1F1F1F] hover:border-[#FB7185]/45 hover:text-[#FDA4AF] px-2 py-1 text-[11px] font-semibold text-[#A3A3A3] transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  <span>{clearingAll ? "Clearing..." : "Clear"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-[#333333]/70">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-1.5">
                <Bell className="h-6 w-6 text-[#737373] mx-auto" aria-hidden="true" />
                <p className="text-xs font-semibold text-[#F5F1EA]">No notifications yet</p>
                <p className="text-[11px] text-[#737373]">
                  Live order updates and alerts will appear right here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenItem(item)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-[#262626] transition-colors ${
                    !item.isRead ? "bg-[#D71920]/[0.06]" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      !item.isRead ? "bg-[#D71920]" : "bg-[#333333]"
                    }`}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#F5F1EA] leading-snug">
                        {item.title}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] text-[#737373]">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#A3A3A3] leading-relaxed line-clamp-2">
                      {item.body}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-3.5 w-3.5 text-[#737373] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
