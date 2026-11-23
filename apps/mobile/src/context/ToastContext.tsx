import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { AlertCircle, Bell, CheckCircle2, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SikaColors, SikaSpace } from "../theme";

export type MobileToastType = "success" | "error" | "info";

interface ToastPayload {
  type?: MobileToastType;
  title: string;
  description?: string;
}

interface ActiveToast extends ToastPayload {
  id: string;
  type: MobileToastType;
}

interface ToastContextValue {
  showToast: (payload: ToastPayload) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 3800;

/**
 * Premium obsidian-glass in-app alert banner backed by `Animated` (`useNativeDriver: true`).
 * Features a tinted icon medallion, crisp 2-line title hierarchy, circular dismiss pill,
 * and an animated bottom countdown hairline without harsh side borders.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const translateY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -18,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity, scale, translateY]);

  const showToast = useCallback(
    ({ type = "success", title, description }: ToastPayload) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToast({ id, type, title, description });
      translateY.setValue(-24);
      opacity.setValue(0);
      scale.setValue(0.95);
      progress.setValue(1);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 20,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: TOAST_DURATION_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(dismiss, TOAST_DURATION_MS);
    },
    [dismiss, opacity, progress, scale, translateY]
  );

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const success = useCallback(
    (title: string, description?: string) => showToast({ type: "success", title, description }),
    [showToast]
  );
  const error = useCallback(
    (title: string, description?: string) => showToast({ type: "error", title, description }),
    [showToast]
  );
  const info = useCallback(
    (title: string, description?: string) => showToast({ type: "info", title, description }),
    [showToast]
  );

  const toneStyle =
    toast?.type === "success"
      ? {
          accent: SikaColors.success,
          badgeBg: "rgba(34, 197, 94, 0.16)",
          badgeBorder: "rgba(74, 222, 128, 0.36)",
        }
      : toast?.type === "error"
      ? {
          accent: SikaColors.error,
          badgeBg: "rgba(251, 113, 133, 0.16)",
          badgeBorder: "rgba(251, 113, 133, 0.38)",
        }
      : {
          accent: SikaColors.accentLight,
          badgeBg: "rgba(215, 25, 32, 0.18)",
          badgeBorder: "rgba(240, 68, 74, 0.42)",
        };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {toast && (
        <View
          pointerEvents="box-none"
          style={[styles.overlay, { top: Math.max(insets.top + 10, 18) }]}
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <Pressable
              onPress={dismiss}
              style={styles.cardInner}
              accessibilityRole="alert"
            >
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: toneStyle.badgeBg,
                    borderColor: toneStyle.badgeBorder,
                  },
                ]}
              >
                {toast.type === "success" && (
                  <CheckCircle2 size={18} color={SikaColors.success} />
                )}
                {toast.type === "error" && (
                  <AlertCircle size={18} color={SikaColors.error} />
                )}
                {toast.type === "info" && (
                  <Bell size={17} color={SikaColors.accentLight} />
                )}
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.title} numberOfLines={2}>
                  {toast.title}
                </Text>
                {toast.description ? (
                  <Text style={styles.desc} numberOfLines={3}>
                    {toast.description}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={dismiss}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { backgroundColor: "rgba(255, 255, 255, 0.14)" },
                ]}
              >
                <X size={13} color={SikaColors.secondaryText} />
              </Pressable>
            </Pressable>

            {/* Subtle animated bottom progress hairline */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: toneStyle.accent,
                    transform: [{ scaleX: progress }],
                  },
                ]}
              />
            </View>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: SikaSpace.md,
    right: SikaSpace.md,
    zIndex: 9999,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 20,
    backgroundColor: "rgba(24, 24, 26, 0.97)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
    borderTopColor: "rgba(255, 255, 255, 0.18)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.65,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  desc: {
    color: "#B4B4B8",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  progressTrack: {
    height: 2.5,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  progressFill: {
    height: "100%",
    width: "100%",
    opacity: 0.85,
  },
});
