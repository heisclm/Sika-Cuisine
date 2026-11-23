import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

// Keep the native Sika Cuisine splash screen visible until initial session check finishes
SplashScreen.preventAutoHideAsync().catch(() => {});
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ArrowRight,
  Home,
  Receipt,
  User,
  UtensilsCrossed,
} from "lucide-react-native";
import {
  MOBILE_TAB_NAV,
  MobileTabId,
  UserDTO,
  formatPesewasToGhs,
} from "@sika/shared";
import { RestaurantClocheIcon } from "./src/components/icons/RestaurantClocheIcon";
import { MobileNotificationBell } from "./src/components/notifications/MobileNotificationBell";
import { RiderShell } from "./src/components/rider/RiderShell";
import { CartProvider, useCart } from "./src/context/CartContext";
import { ToastProvider, useToast } from "./src/context/ToastContext";
import { MOBILE_IMAGE_ASSETS } from "./src/data/dish-images";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MenuScreen } from "./src/screens/MenuScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { OrderTrackingScreen } from "./src/screens/OrderTrackingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { StaffRedirectScreen } from "./src/screens/StaffRedirectScreen";
import { apiRequest } from "./src/services/api-client";
import { clearOrdersCache } from "./src/services/offline-order-cache";
import {
  getCurrentUser,
  removeAuthToken,
  saveCurrentUser,
} from "./src/services/storage";
import { SikaColors, SikaSpace } from "./src/theme";
import { triggerLightHaptic } from "./src/utils/haptics";

const ONBOARDING_STORAGE_KEY = "@sika_onboarding_seen_v2";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ActiveScreen =
  | "home"
  | "menu"
  | "search"
  | "cart"
  | "checkout"
  | "orders"
  | "tracking"
  | "account"
  | "auth";

function renderTabIcon(tabId: MobileTabId, color: string, focused: boolean) {
  const strokeWidth = focused ? 2.2 : 1.75;
  switch (tabId) {
    case "home":
      return <Home size={18} strokeWidth={strokeWidth} color={color} />;
    case "menu":
      return <UtensilsCrossed size={18} strokeWidth={strokeWidth} color={color} />;
    case "orders":
      return <Receipt size={18} strokeWidth={strokeWidth} color={color} />;
    case "account":
      return <User size={18} strokeWidth={strokeWidth} color={color} />;
  }
}

function getScreenSubtitle(screen: ActiveScreen): string {
  switch (screen) {
    case "home":
      return "Sunyani Showcase";
    case "menu":
      return "Full Kitchen Menu";
    case "search":
      return "Search Dishes";
    case "cart":
      return "Order Tray";
    case "checkout":
      return "Checkout";
    case "orders":
      return "Order History";
    case "tracking":
      return "Live Order Tracker";
    case "account":
      return "Customer Account";
    case "auth":
      return "Sign In & Account";
  }
}

function SikaMobileShell() {
  const insets = useSafeAreaInsets();
  const {
    totalItemCount,
    cartSubtotalPesewas,
    syncCartOwner,
    clearCartOnSignOut,
  } = useCart();
  const { info } = useToast();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("home");
  const [searchReturnScreen, setSearchReturnScreen] = useState<"home" | "menu">("home");
  const [menuCategoryId, setMenuCategoryId] = useState<string>("all");
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const openSearchScreen = (from: "home" | "menu", initialQuery = "") => {
    triggerLightHaptic();
    setSearchReturnScreen(from);
    setMenuSearchQuery(initialQuery);
    setActiveScreen("search");
  };

  const badgeScale = useRef(new Animated.Value(1)).current;
  const previousCountRef = useRef(totalItemCount);
  const stageOpacity = useRef(new Animated.Value(1)).current;
  const stageTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    stageOpacity.setValue(0.86);
    stageTranslateY.setValue(8);
    Animated.parallel([
      Animated.timing(stageOpacity, {
        toValue: 1,
        duration: 185,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(stageTranslateY, {
        toValue: 0,
        duration: 195,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeScreen, stageOpacity, stageTranslateY]);

  // Hide floating bottom dock whenever software keyboard is open (standard mobile UX)
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
      getCurrentUser(),
    ])
      .then(async ([seen, localUser]) => {
        if (!active) return;
        setShowOnboarding(seen !== "true");
        if (localUser) {
          setCurrentUser(localUser);
          const meRes = await apiRequest<{ success: boolean; user?: UserDTO }>(
            "/auth/me"
          );
          if (!active) return;
          if (meRes.status === 401 || meRes.status === 403) {
            await removeAuthToken();
            setCurrentUser(null);
            await syncCartOwner(null);
          } else if (meRes.success && meRes.data?.user) {
            await saveCurrentUser(meRes.data.user);
            setCurrentUser(meRes.data.user);
            await syncCartOwner(meRes.data.user.id);
          }
        } else {
          await syncCartOwner(null);
        }
      })
      .catch(() => {
        if (active) setShowOnboarding(false);
      })
      .finally(() => {
        if (active) setOnboardingChecked(true);
        SplashScreen.hideAsync().catch(() => {});
      });

    return () => {
      active = false;
    };
  }, []);

  // Spring pop animation on header Cloche pill whenever item count increases
  useEffect(() => {
    if (totalItemCount > previousCountRef.current) {
      badgeScale.setValue(0.84);
      Animated.spring(badgeScale, {
        toValue: 1,
        damping: 12,
        stiffness: 280,
        useNativeDriver: true,
      }).start();
    }
    previousCountRef.current = totalItemCount;
  }, [totalItemCount, badgeScale]);

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true").catch(() => {});
    setShowOnboarding(false);
  };

  const handleReplayOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY).catch(() => {});
    setShowOnboarding(true);
  };

  const navigateToMenu = (categoryId = "all", initialQuery = "") => {
    setMenuCategoryId(categoryId || "all");
    setMenuSearchQuery(initialQuery || "");
    setActiveScreen("menu");
  };

  const navigateToTracking = (orderNumber: string) => {
    setActiveOrderNumber(orderNumber);
    setActiveScreen("tracking");
  };

  useEffect(() => {
    const handleDeepLinkUrl = (rawUrl: string | null | undefined) => {
      if (!rawUrl || !rawUrl.includes("payment-callback")) return;
      const match = /[?&]orderNumber=([^&]+)/i.exec(rawUrl);
      if (match?.[1]) {
        const orderNum = decodeURIComponent(match[1]).trim().toUpperCase();
        if (orderNum) {
          navigateToTracking(orderNum);
        }
      }
    };

    void Linking.getInitialURL().then(handleDeepLinkUrl).catch(() => {});
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLinkUrl(event.url);
    });
    return () => subscription.remove();
  }, []);

  const handleGlobalSignOut = async () => {
    const userId = currentUser?.id;
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => {});
    await removeAuthToken();
    if (userId) {
      await clearOrdersCache(userId);
    }
    await clearCartOnSignOut();
    setCurrentUser(null);
    setActiveScreen("home");
    info("Signed Out", "You've been signed out of Sika Cuisine. See you next time.");
  };

  const handleSessionRevoked = async () => {
    const userId = currentUser?.id;
    await removeAuthToken();
    if (userId) {
      await clearOrdersCache(userId);
    }
    await clearCartOnSignOut();
    setCurrentUser(null);
    setActiveScreen("auth");
    info(
      "Session Ended",
      "Please sign in again or contact dispatch management."
    );
  };

  if (!onboardingChecked) {
    return (
      <View style={styles.bootSplash}>
        <ActivityIndicator size="large" color={SikaColors.accent} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleFinishOnboarding} />;
  }

  if (currentUser?.role === "DELIVERY_RIDER") {
    return (
      <RiderShell
        user={currentUser}
        onSignOut={handleGlobalSignOut}
        onSessionRevoked={handleSessionRevoked}
      />
    );
  }

  if (
    currentUser &&
    ["ADMIN", "STAFF_KITCHEN", "STAFF_CASHIER"].includes(currentUser.role)
  ) {
    return (
      <StaffRedirectScreen
        user={currentUser}
        onSignOut={handleGlobalSignOut}
      />
    );
  }

  const activeTab: MobileTabId =
    activeScreen === "home"
      ? "home"
      : activeScreen === "orders" || activeScreen === "tracking"
      ? "orders"
      : activeScreen === "account" || activeScreen === "auth"
      ? "account"
      : "menu";

  return (
    <View style={styles.root}>
      {/* Persistent Brand Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top + 8, SikaSpace.lg) },
        ]}
      >
        <Pressable
          onPress={() => setActiveScreen("home")}
          style={styles.brandCluster}
          accessibilityRole="button"
          accessibilityLabel="Return to Sika Cuisine Home"
        >
          <Image
            source={MOBILE_IMAGE_ASSETS.logo}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle} numberOfLines={1}>
              SIKA CUISINE.
            </Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {getScreenSubtitle(activeScreen)}
            </Text>
          </View>
        </Pressable>

        {/* Top-Right Notifications + Cloche Tray Button */}
        <View style={styles.headerActionsRow}>
          <MobileNotificationBell
            enabled={Boolean(currentUser)}
            onSelectNotification={(item) => {
              if (item.orderNumber) {
                navigateToTracking(item.orderNumber);
              } else {
                setActiveScreen("orders");
              }
            }}
          />
          <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setActiveScreen("cart");
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open tray with ${totalItemCount} items`}
              style={({ pressed }) => [
                styles.cartHeaderBtn,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <RestaurantClocheIcon size={20} color={SikaColors.warmWhite} />
              {totalItemCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItemCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Main Content Stage */}
      <Animated.View
        style={[
          styles.stage,
          {
            opacity: stageOpacity,
            transform: [{ translateY: stageTranslateY }],
          },
        ]}
      >
        {activeScreen === "home" && (
          <HomeScreen
            currentUser={currentUser}
            onNavigateToMenu={navigateToMenu}
            onOpenSearch={() => openSearchScreen("home")}
            onOpenCart={() => setActiveScreen("cart")}
            onOpenOrders={() => setActiveScreen("orders")}
            onTrackOrder={navigateToTracking}
          />
        )}

        {activeScreen === "menu" && (
          <MenuScreen
            initialCategoryId={menuCategoryId}
            initialSearch={menuSearchQuery}
            onOpenSearch={() => openSearchScreen("menu", menuSearchQuery)}
            onNavigateToCart={() => setActiveScreen("cart")}
          />
        )}

        {activeScreen === "search" && (
          <SearchScreen
            initialQuery={menuSearchQuery}
            onBack={() => {
              setMenuSearchQuery("");
              setActiveScreen(searchReturnScreen);
            }}
            onOpenCart={() => setActiveScreen("cart")}
          />
        )}

        {activeScreen === "cart" && (
          <CartScreen
            onNavigateToMenu={() => navigateToMenu("all")}
            onNavigateToCheckout={() => setActiveScreen("checkout")}
          />
        )}

        {activeScreen === "checkout" && (
          <CheckoutScreen
            onBackToCart={() => setActiveScreen("cart")}
            onOrderPlaced={navigateToTracking}
          />
        )}

        {activeScreen === "orders" && (
          <OrdersScreen
            onTrackOrder={navigateToTracking}
            onBrowseMenu={() => navigateToMenu("all")}
            onOpenCart={() => setActiveScreen("cart")}
          />
        )}

        {activeScreen === "tracking" && (
          <OrderTrackingScreen
            orderNumber={activeOrderNumber}
            onBack={() => setActiveScreen("orders")}
            onOpenCart={() => setActiveScreen("cart")}
          />
        )}

        {activeScreen === "account" && (
          <ProfileScreen
            onNavigateToAuth={() => setActiveScreen("auth")}
            onNavigateToOrders={() => setActiveScreen("orders")}
            onReplayOnboarding={handleReplayOnboarding}
            onSignedOut={() => setCurrentUser(null)}
          />
        )}

        {activeScreen === "auth" && (
          <AuthScreen
            onAuthSuccess={(user) => {
              void (async () => {
                const resolvedCount = await syncCartOwner(user.id);
                setCurrentUser(user);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                if (user.role === "CUSTOMER") {
                  setActiveScreen(resolvedCount > 0 ? "checkout" : "home");
                } else {
                  setActiveScreen("home");
                }
              })();
            }}
            onCancel={() => setActiveScreen("account")}
            onTrackAsGuest={() => setActiveScreen("orders")}
          />
        )}
      </Animated.View>

      {/* True Floating Capsule Bottom Navigation Dock (Only on Primary Tabs & Cart, When Keyboard Closed) */}
      {!isKeyboardVisible &&
      (activeScreen === "home" ||
        activeScreen === "menu" ||
        activeScreen === "cart" ||
        activeScreen === "orders" ||
        activeScreen === "account") ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.dockWrapper,
            { bottom: Math.max(insets.bottom + 6, 14) },
          ]}
        >
          {totalItemCount > 0 &&
          (activeScreen === "home" || activeScreen === "menu") ? (
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setActiveScreen("cart");
              }}
              accessibilityRole="button"
              accessibilityLabel={`View order tray with ${totalItemCount} items, subtotal ${formatPesewasToGhs(
                cartSubtotalPesewas
              )}`}
              style={({ pressed }) => [
                styles.floatingTrayBar,
                pressed && { transform: [{ scale: 0.985 }] },
              ]}
            >
              <View style={styles.floatingTrayLeft}>
                <View style={styles.floatingTrayCountPill}>
                  <Text style={styles.floatingTrayCountText}>
                    {totalItemCount}
                  </Text>
                </View>
                <View>
                  <Text style={styles.floatingTrayTitle}>View Order Tray</Text>
                  <Text style={styles.floatingTraySub}>
                    Ready for Sunyani delivery or pickup
                  </Text>
                </View>
              </View>

              <View style={styles.floatingTrayRight}>
                <Text style={styles.floatingTrayAmount}>
                  {formatPesewasToGhs(cartSubtotalPesewas)}
                </Text>
                <ArrowRight size={15} color={SikaColors.text} />
              </View>
            </Pressable>
          ) : null}

          <View style={styles.dockPill}>
            {MOBILE_TAB_NAV.map((tab) => {
              const focused = activeTab === tab.id;
              const iconColor = focused
                ? SikaColors.text
                : SikaColors.secondaryText;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    triggerLightHaptic();
                    LayoutAnimation.configureNext(
                      LayoutAnimation.create(
                        220,
                        LayoutAnimation.Types.easeInEaseOut,
                        LayoutAnimation.Properties.opacity
                      )
                    );
                    if (tab.id === "home") setActiveScreen("home");
                    else if (tab.id === "menu") navigateToMenu("all", "");
                    else if (tab.id === "orders") setActiveScreen("orders");
                    else setActiveScreen("account");
                  }}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.accessibilityLabel}
                  accessibilityState={{ selected: focused }}
                  style={({ pressed }) => [
                    styles.tabItem,
                    focused && styles.tabItemActive,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  {renderTabIcon(tab.id, iconColor, focused)}
                  {focused ? (
                    <Text style={styles.tabLabelActive} numberOfLines={1}>
                      {tab.label}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ToastProvider>
        <CartProvider>
          <SikaMobileShell />
        </CartProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bootSplash: {
    flex: 1,
    backgroundColor: SikaColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SikaSpace.md,
    paddingBottom: SikaSpace.md,
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  brandCluster: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm + 2,
    paddingRight: SikaSpace.sm,
  },
  brandTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandTitle: {
    color: SikaColors.text,
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: SikaColors.accent,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: SikaColors.surface,
  },
  cartBadgeText: {
    color: SikaColors.text,
    fontSize: 10,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  stage: {
    flex: 1,
  },
  dockWrapper: {
    position: "absolute",
    left: 18,
    right: 18,
    gap: 10,
    zIndex: 30,
  },
  floatingTrayBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 22,
    backgroundColor: SikaColors.accent,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#000000",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  floatingTrayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  floatingTrayCountPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(16, 16, 16, 0.32)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  floatingTrayCountText: {
    color: SikaColors.text,
    fontSize: 12,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  floatingTrayTitle: {
    color: SikaColors.text,
    fontSize: 13.5,
    fontWeight: "900",
  },
  floatingTraySub: {
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 1,
  },
  floatingTrayRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 16, 16, 0.26)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },
  floatingTrayAmount: {
    color: SikaColors.text,
    fontSize: 13,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  dockPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    backgroundColor: "rgba(24, 24, 24, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    shadowColor: "#000000",
    shadowOpacity: 0.65,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: "#2B1416",
    borderColor: "rgba(215, 25, 32, 0.65)",
    paddingHorizontal: 20,
  },
  tabLabelActive: {
    color: SikaColors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
