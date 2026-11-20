import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Home,
  Receipt,
  User,
  UtensilsCrossed,
} from "lucide-react-native";
import { MOBILE_TAB_NAV, MobileTabId } from "@sika/shared";
import { RestaurantClocheIcon } from "./src/components/icons/RestaurantClocheIcon";
import { CartProvider, useCart } from "./src/context/CartContext";
import { ToastProvider } from "./src/context/ToastContext";
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
import { SikaColors, SikaSpace } from "./src/theme";

const ONBOARDING_STORAGE_KEY = "@sika_onboarding_seen_v2";

type ActiveScreen =
  | "home"
  | "menu"
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
  const { totalItemCount } = useCart();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("home");
  const [menuCategoryId, setMenuCategoryId] = useState<string>("all");
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>("");

  const badgeScale = useRef(new Animated.Value(1)).current;
  const previousCountRef = useRef(totalItemCount);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((seen) => {
        setShowOnboarding(seen !== "true");
      })
      .catch(() => {
        setShowOnboarding(false);
      })
      .finally(() => {
        setOnboardingChecked(true);
      });
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
          <View>
            <Text style={styles.brandTitle}>SIKA CUISINE.</Text>
            <Text style={styles.brandSubtitle}>{getScreenSubtitle(activeScreen)}</Text>
          </View>
        </Pressable>

        {/* Circular Dining Cloche Tray Button matching Web Navbar */}
        <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
          <Pressable
            onPress={() => setActiveScreen("cart")}
            accessibilityRole="button"
            accessibilityLabel={`Open tray with ${totalItemCount} items`}
            style={styles.cartHeaderBtn}
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

      {/* Main Content Stage */}
      <View style={styles.stage}>
        {activeScreen === "home" && (
          <HomeScreen
            onNavigateToMenu={navigateToMenu}
            onOpenCart={() => setActiveScreen("cart")}
            onOpenOrders={() => setActiveScreen("orders")}
          />
        )}

        {activeScreen === "menu" && (
          <MenuScreen
            initialCategoryId={menuCategoryId}
            initialSearch={menuSearchQuery}
            onNavigateToCart={() => setActiveScreen("cart")}
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
          />
        )}

        {activeScreen === "tracking" && (
          <OrderTrackingScreen
            orderNumber={activeOrderNumber}
            onBack={() => setActiveScreen("orders")}
          />
        )}

        {activeScreen === "account" && (
          <ProfileScreen
            onNavigateToAuth={() => setActiveScreen("auth")}
            onNavigateToOrders={() => setActiveScreen("orders")}
            onReplayOnboarding={handleReplayOnboarding}
          />
        )}

        {activeScreen === "auth" && (
          <AuthScreen
            onAuthSuccess={() => setActiveScreen("account")}
            onCancel={() => setActiveScreen("account")}
            onTrackAsGuest={() => setActiveScreen("orders")}
          />
        )}
      </View>

      {/* Floating Capsule Bottom Navigation Dock */}
      <View
        style={[
          styles.dockWrapper,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <View style={styles.dockPill}>
          {MOBILE_TAB_NAV.map((tab) => {
            const focused = activeTab === tab.id;
            const iconColor = focused ? SikaColors.text : SikaColors.secondaryText;

            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  if (tab.id === "home") setActiveScreen("home");
                  else if (tab.id === "menu") navigateToMenu("all", "");
                  else if (tab.id === "orders") setActiveScreen("orders");
                  else setActiveScreen("account");
                }}
                accessibilityRole="tab"
                accessibilityLabel={tab.accessibilityLabel}
                accessibilityState={{ selected: focused }}
                style={[styles.tabItem, focused && styles.tabItemActive]}
              >
                {renderTabIcon(tab.id, iconColor, focused)}
                <Text
                  style={[styles.tabLabel, focused && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                {focused ? <View style={styles.activeDot} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
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
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm + 2,
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
  cartHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: SikaColors.border,
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
    backgroundColor: SikaColors.background,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  dockPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: SikaColors.border,
    padding: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 7,
    paddingBottom: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: "rgba(215, 25, 32, 0.18)",
    borderColor: "rgba(215, 25, 32, 0.50)",
  },
  tabLabel: {
    color: SikaColors.secondaryText,
    fontSize: 10.5,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: SikaColors.text,
    fontWeight: "800",
  },
  activeDot: {
    position: "absolute",
    bottom: 3,
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: SikaColors.accent,
  },
});
