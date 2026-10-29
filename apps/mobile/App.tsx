import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { OrderTrackingScreen } from "./src/screens/OrderTrackingScreen";

type ScreenTab = "menu" | "cart" | "tracking" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>("tracking");
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>("SIKA-2026-1042");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0e12" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.brandTitle}>SIKA CUISINE</Text>
          <Text style={styles.brandSubtitle}>SUNYANI, GHANA</Text>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === "tracking" && (
          <OrderTrackingScreen orderNumber={activeOrderNumber} />
        )}

        {activeTab === "menu" && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderHeading}>Sika Cuisine Menu</Text>
            <Text style={styles.placeholderText}>
              Browse grilled delicacies, authentic Ghanaian soups, and artisan pizzas.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onClick={() => setActiveTab("tracking")}
            >
              <Text style={styles.primaryButtonText}>Track Sample Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "cart" && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderHeading}>Your Cart</Text>
            <Text style={styles.placeholderText}>
              Review your selected dishes before submitting your order.
            </Text>
          </View>
        )}

        {activeTab === "profile" && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderHeading}>Customer Profile</Text>
            <Text style={styles.placeholderText}>
              Manage your delivery addresses across Sunyani and past order receipts.
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "menu" && styles.tabButtonActive]}
          onPress={() => setActiveTab("menu")}
        >
          <Text
            style={[styles.tabLabel, activeTab === "menu" && styles.tabLabelActive]}
          >
            Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "cart" && styles.tabButtonActive]}
          onPress={() => setActiveTab("cart")}
        >
          <Text
            style={[styles.tabLabel, activeTab === "cart" && styles.tabLabelActive]}
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
          <Text
            style={[
              styles.tabLabel,
              activeTab === "tracking" && styles.tabLabelActive,
            ]}
          >
            Track Order
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "profile" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("profile")}
        >
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0d0e12",
  },
  header: {
    height: 56,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    borderBottomWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
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
  body: {
    flex: 1,
  },
  tabBar: {
    height: 60,
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
  tabLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#e11d48",
    fontWeight: "700",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderHeading: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
