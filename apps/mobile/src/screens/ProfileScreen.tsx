import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SUNYANI_DELIVERY_ZONES, formatPesewasToGhs } from "@sika/shared";

interface ProfileScreenProps {
  onTrackSampleOrder: () => void;
}

export function ProfileScreen({ onTrackSampleOrder }: ProfileScreenProps) {
  const handleCallSupport = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>SC</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Sika Customer</Text>
          <Text style={styles.userSubtitle}>Sunyani, Bono Region, Ghana</Text>
        </View>
      </View>

      {/* Quick Action: Track Active Order */}
      <TouchableOpacity
        style={styles.trackCard}
        onPress={onTrackSampleOrder}
        activeOpacity={0.85}
      >
        <View style={styles.trackCardLeft}>
          <Text style={styles.trackCardIcon}>🛵</Text>
          <View>
            <Text style={styles.trackCardTitle}>Recent Order Tracking</Text>
            <Text style={styles.trackCardSubtitle}>
              Check real-time kitchen status & delivery progress
            </Text>
          </View>
        </View>
        <Text style={styles.trackCardArrow}>→</Text>
      </TouchableOpacity>

      {/* Sunyani Delivery Zones Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>SUNYANI DELIVERY ZONES & RATES</Text>
        <Text style={styles.sectionSubtitle}>
          Authoritative pricing based on distance from Sika Cuisine Sunyani:
        </Text>

        <View style={styles.zoneList}>
          {SUNYANI_DELIVERY_ZONES.map((zone) => (
            <View key={zone.id} style={styles.zoneItem}>
              <View style={styles.zoneHeader}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneFee}>
                  {formatPesewasToGhs(zone.feePesewas)}
                </Text>
              </View>
              <Text style={styles.zoneDesc}>{zone.description}</Text>
              <Text style={styles.zoneEst}>⏱ Est. {zone.estimatedMinutes} mins</Text>
            </View>
          ))}
        </View>

        <View style={styles.pickupHighlight}>
          <Text style={styles.pickupHighlightText}>
            🛍️ Collection / Pickup orders from Sika Cuisine incur GH₵ 0.00 delivery fee.
          </Text>
        </View>
      </View>

      {/* Restaurant Contact & Support */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>RESTAURANT ASSISTANCE</Text>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => handleCallSupport("+233 53 337 6760")}
        >
          <Text style={styles.contactIcon}>📞</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Kitchen Dispatch Hotline</Text>
            <Text style={styles.contactValue}>+233 53 337 6760</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => handleCallSupport("+233 55 440 6681")}
        >
          <Text style={styles.contactIcon}>📱</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Customer Care Line</Text>
            <Text style={styles.contactValue}>+233 55 440 6681</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.hoursBox}>
          <Text style={styles.hoursLabel}>🕒 Operating Hours</Text>
          <Text style={styles.hoursValue}>Monday – Sunday: 8:00 AM – 10:00 PM</Text>
        </View>
      </View>

      {/* University Project Notice */}
      <View style={styles.projectCard}>
        <Text style={styles.projectTitle}>SIKA CUISINE SYSTEM</Text>
        <Text style={styles.projectDesc}>
          Final-Year Engineering Project — A Web-Based Food Ordering and Delivery
          Tracking System for Sika Cuisine Restaurant, Sunyani, Ghana.
        </Text>
        <Text style={styles.projectVersion}>Version 1.0.0 (Expo SDK 52)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0e12",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161720",
    borderRadius: 20,
    padding: 16,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarInitials: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },
  userSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
  },
  trackCard: {
    backgroundColor: "rgba(225, 29, 72, 0.12)",
    borderColor: "rgba(225, 29, 72, 0.35)",
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    marginBottom: 14,
  },
  trackCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  trackCardIcon: {
    fontSize: 24,
  },
  trackCardTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  trackCardSubtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  trackCardArrow: {
    color: "#e11d48",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionCard: {
    backgroundColor: "#161720",
    borderRadius: 20,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#d1d5db",
    fontSize: 12,
    marginBottom: 12,
  },
  zoneList: {
    gap: 10,
    marginBottom: 10,
  },
  zoneItem: {
    backgroundColor: "#1c1e29",
    borderRadius: 12,
    padding: 12,
  },
  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  zoneName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  zoneFee: {
    color: "#e11d48",
    fontSize: 13,
    fontWeight: "800",
  },
  zoneDesc: {
    color: "#9ca3af",
    fontSize: 11,
    lineHeight: 16,
  },
  zoneEst: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
  },
  pickupHighlight: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  pickupHighlightText: {
    color: "#6ee7b7",
    fontSize: 12,
    fontWeight: "600",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1e29",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    color: "#9ca3af",
    fontSize: 11,
  },
  contactValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },
  hoursBox: {
    paddingTop: 8,
  },
  hoursLabel: {
    color: "#d1d5db",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  hoursValue: {
    color: "#9ca3af",
    fontSize: 12,
  },
  projectCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  projectTitle: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  projectDesc: {
    color: "#9ca3af",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 6,
  },
  projectVersion: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "600",
  },
});
