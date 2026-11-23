import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, CheckCheck, ChevronRight, Trash2, X } from "lucide-react-native";
import { InAppNotificationDTO } from "@sika/shared";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../services/api-client";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { triggerLightHaptic } from "../../utils/haptics";

interface MobileNotificationBellProps {
  enabled: boolean;
  onSelectNotification?: (item: InAppNotificationDTO) => void;
}

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
 * Circular dark Notification Bell + full dark Notifications Sheet for Mobile
 * customers and delivery riders. Polls `/notifications` every 15s when active
 * and triggers haptic + toast banners on newly arrived unread notifications.
 */
export function MobileNotificationBell({
  enabled,
  onSelectNotification,
}: MobileNotificationBellProps) {
  const insets = useSafeAreaInsets();
  const { info } = useToast();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    const res = await apiRequest<{
      success: boolean;
      unreadCount: number;
      notifications: InAppNotificationDTO[];
    }>("/notifications");

    if (!res.success || !res.data?.notifications) return;

    const list = res.data.notifications;
    setNotifications(list);
    setUnreadCount(Number(res.data.unreadCount ?? 0));

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
      triggerLightHaptic();
      info(latest.title, latest.body);
    }
  }, [enabled, info]);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      initializedRef.current = false;
      seenIdsRef.current.clear();
      return;
    }

    void fetchNotifications();
    const timer = setInterval(() => {
      if (AppState.currentState === "active") {
        void fetchNotifications();
      }
    }, 15_000);

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void fetchNotifications();
      }
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled, fetchNotifications]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const res = await apiRequest("/notifications/read", {
      method: "PATCH",
      body: JSON.stringify({ markAll: true }),
    });
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
    setMarkingAll(false);
  };

  const handleClearAll = async () => {
    triggerLightHaptic();
    setClearingAll(true);
    const res = await apiRequest("/notifications", {
      method: "DELETE",
    });
    if (res.success) {
      setNotifications([]);
      setUnreadCount(0);
      seenIdsRef.current.clear();
      info("Notifications Cleared", "Your notification history is now empty.");
    }
    setClearingAll(false);
  };

  const handleTapItem = async (item: InAppNotificationDTO) => {
    setOpen(false);
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      void apiRequest("/notifications/read", {
        method: "PATCH",
        body: JSON.stringify({ notificationId: item.id }),
      });
    }
    onSelectNotification?.(item);
  };

  if (!enabled) return null;

  return (
    <>
      <Pressable
        onPress={() => {
          triggerLightHaptic();
          setOpen(true);
          void fetchNotifications();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open notifications (${unreadCount} unread)`}
        style={({ pressed }) => [
          styles.bellButton,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Bell size={18} color={SikaColors.warmWhite} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom + 12, SikaSpace.lg),
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.sheetTitle}>Notifications</Text>
                {unreadCount > 0 ? (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadPillText}>{unreadCount} new</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.headerControls}>
                <Pressable
                  onPress={() => setOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close notifications"
                  style={styles.closeBtn}
                >
                  <X size={16} color={SikaColors.warmWhite} />
                </Pressable>
              </View>
            </View>

            {notifications.length > 0 ? (
              <View style={styles.actionToolbar}>
                {unreadCount > 0 ? (
                  <Pressable
                    disabled={markingAll || clearingAll}
                    onPress={handleMarkAllRead}
                    style={({ pressed }) => [
                      styles.toolbarBtn,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <CheckCheck size={13} color={SikaColors.accentLight} />
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </Pressable>
                ) : (
                  <View />
                )}

                <Pressable
                  disabled={clearingAll || markingAll}
                  onPress={handleClearAll}
                  accessibilityRole="button"
                  accessibilityLabel="Clear notification history"
                  style={({ pressed }) => [
                    styles.clearBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Trash2 size={12.5} color="#FDA4AF" />
                  <Text style={styles.clearBtnText}>
                    {clearingAll ? "Clearing..." : "Clear history"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {notifications.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Bell size={24} color={SikaColors.muted} />
                  <Text style={styles.emptyTitle}>No notifications yet</Text>
                  <Text style={styles.emptyBody}>
                    Live order confirmations, payment alerts, and kitchen/courier updates
                    will appear here.
                  </Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => void handleTapItem(item)}
                    style={[
                      styles.itemRow,
                      !item.isRead && styles.itemRowUnread,
                    ]}
                  >
                    <View
                      style={[
                        styles.unreadDot,
                        !item.isRead && styles.unreadDotActive,
                      ]}
                    />
                    <View style={styles.itemTextCol}>
                      <View style={styles.itemTopRow}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemTime}>
                          {formatRelativeTime(item.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.itemBody} numberOfLines={2}>
                        {item.body}
                      </Text>
                    </View>
                    <ChevronRight size={14} color={SikaColors.muted} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SikaColors.accent,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: SikaColors.surface,
  },
  badgeText: {
    color: SikaColors.text,
    fontSize: 9.5,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: SikaRadius.xl,
    borderTopRightRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: SikaColors.surface,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
    backgroundColor: SikaColors.background,
    paddingHorizontal: SikaSpace.lg,
    paddingVertical: SikaSpace.md,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetTitle: {
    color: SikaColors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  unreadPill: {
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash16,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadPillText: {
    color: SikaColors.accentLight,
    fontSize: 10.5,
    fontWeight: "800",
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SikaSpace.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
    backgroundColor: "rgba(16, 16, 16, 0.55)",
  },
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  markAllText: {
    color: SikaColors.accentLight,
    fontSize: 12,
    fontWeight: "700",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearBtnText: {
    color: "#FDA4AF",
    fontSize: 11.5,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: SikaSpace.md,
    gap: SikaSpace.sm,
  },
  emptyBox: {
    paddingVertical: 40,
    paddingHorizontal: SikaSpace.lg,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: SikaColors.warmWhite,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  emptyBody: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.background,
    padding: SikaSpace.md,
  },
  itemRowUnread: {
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SikaColors.border,
    marginTop: 5,
  },
  unreadDotActive: {
    backgroundColor: SikaColors.accent,
  },
  itemTextCol: {
    flex: 1,
    gap: 4,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    color: SikaColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  itemTime: {
    color: SikaColors.muted,
    fontSize: 10.5,
    fontWeight: "600",
  },
  itemBody: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    lineHeight: 17,
  },
});
