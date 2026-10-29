import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { CartProvider, useCart } from "./src/context/CartContext";
import { MenuScreen } from "./src/screens/MenuScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { OrderTrackingScreen } from "./src/screens/OrderTrackingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

type ScreenTab = "menu" | "cart" | "checkout" | "tracking" | "profile";

function AppContent() {
  const [activeTab, setActiveTab] = useState<ScreenTab>("menu");
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>("SIKA-2026-1042");
  const { totalItemCount } = useCart();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0e12" />

      {/* Top Application Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.brandTitle}>SIKA CUISINE</Text>
          <Text style={styles.brandSubtitle}>SUNYANI, GHANA</Text>
        </View>

        {activeTab !== "cart" && activeTab !== "checkout" && (
          <TouchableOpacity
            style={styles.headerCartButton}
            onPress={() => setActiveTab("cart")}
            accessibilityLabel="View Cart"
          >
            <Text style={styles.headerCartIcon}>🛍️</Text>
            {totalItemCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{totalItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Main Screen Body */}
      <View style={styles.body}>
        {activeTab === "menu" && (
          <MenuScreen onNavigateToCart={() => setActiveTab("cart")} />
        )}

        {activeTab === "cart" && (
          <CartScreen
            onNavigateToMenu={() => setActiveTab("menu")}
            onNavigateToCheckout={() => setActiveTab("checkout")}
          />
        )}

        {activeTab === "checkout" && (
          <CheckoutScreen
            onBackToCart={() => setActiveTab("cart")}
            onOrderPlaced={(orderNumber) => {
              setActiveOrderNumber(orderNumber);
              setActiveTab("tracking");
            }}
          />
        )}

        {activeTab === "tracking" && (
          <OrderTrackingScreen orderNumber={activeOrderNumber} />
        )}

        {activeTab === "profile" && (
          <ProfileScreen
            onTrackSampleOrder={() => setActiveTab("tracking")}
          />
        )}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "menu" && styles.tabButtonActive]}
          onPress={() => setActiveTab("menu")}
        >
          <Text style={styles.tabIcon}>🍲</Text>
          <Text
            style={[styles.tabLabel, activeTab === "menu" && styles.tabLabelActive]}
          >
            Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            (activeTab === "cart" || activeTab === "checkout") && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("cart")}
        >
          <View style={styles.tabCartIconWrap}>
            <Text style={styles.tabIcon}>🛍️</Text>
            {totalItemCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{totalItemCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              (activeTab === "cart" || activeTab === "checkout") && styles.tabLabelActive,
            ]}
          >
            Cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "tracking" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("tracking")}
        >
          <Text style={styles.tabIcon}>🛵</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "tracking" && styles.tabLabelActive,
            ]}
          >
            Tracking
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "profile" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "profile" && styles.tabLabelActive,
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0d0e12",
  },
  header: {
    height: 56,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#12141a",
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: "#e11d48",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  headerCartButton: {
    position: "relative",
    padding: 6,
  },
  headerCartIcon: {
    fontSize: 20,
  },
  headerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#e11d48",
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  body: {
    flex: 1,
  },
  tabBar: {
    height: 62,
    flexDirection: "row",
    backgroundColor: "#12141a",
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderTopWidth: 1,
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabButtonActive: {
    borderTopColor: "#e11d48",
    borderTopWidth: 2,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabCartIconWrap: {
    position: "relative",
  },
  tabBadge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: "#e11d48",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  tabBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
  tabLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#e11d48",
    fontWeight: "700",
  },
});
