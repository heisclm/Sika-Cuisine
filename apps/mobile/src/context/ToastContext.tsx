import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

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

/**
 * Native non-blocking toast notification provider backed by `Animated` (`useNativeDriver: true`).
 * Displays a semantic status banner positioned below the device safe-area top inset.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -16,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    ({ type = "success", title, description }: ToastPayload) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToast({ id, type, title, description });
      translateY.setValue(-20);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(dismiss, 3000);
    },
    [dismiss, opacity, translateY]
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

  const stripeColor =
    toast?.type === "success"
      ? SikaColors.success
      : toast?.type === "error"
      ? SikaColors.error
      : SikaColors.accent;

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {toast && (
        <View
          pointerEvents="box-none"
          style={[styles.overlay, { top: Math.max(insets.top + 8, 16) }]}
        >
          <Animated.View
            style={[
              styles.card,
              {
                borderLeftColor: stripeColor,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.iconWrap}>
              {toast.type === "success" && (
                <CheckCircle2 size={18} color={SikaColors.success} />
              )}
              {toast.type === "error" && (
                <AlertCircle size={18} color={SikaColors.error} />
              )}
              {toast.type === "info" && (
                <Info size={18} color={SikaColors.accentLight} />
              )}
            </View>

            <View style={styles.textWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {toast.title}
              </Text>
              {toast.description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {toast.description}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={dismiss}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              style={styles.closeBtn}
            >
              <X size={16} color={SikaColors.secondaryText} />
            </Pressable>
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
    left: SikaSpace.lg,
    right: SikaSpace.lg,
    zIndex: 9999,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SikaColors.surface,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderLeftWidth: 4,
    borderRadius: SikaRadius.md,
    paddingVertical: SikaSpace.md,
    paddingHorizontal: SikaSpace.md,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  iconWrap: {
    marginRight: SikaSpace.md,
  },
  textWrap: {
    flex: 1,
    marginRight: SikaSpace.sm,
  },
  title: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  desc: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});
