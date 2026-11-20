import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChevronRight,
  Clock,
  LogOut,
  MapPin,
  Phone,
  Receipt,
  RotateCcw,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react-native";
import {
  RESTAURANT_INFO,
  SUNYANI_DELIVERY_ZONES,
  UserDTO,
  formatPesewasToGhs,
} from "@sika/shared";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../services/api-client";
import { clearOrdersCache } from "../services/offline-order-cache";
import { getCurrentUser, removeAuthToken } from "../services/storage";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface ProfileScreenProps {
  onNavigateToAuth: () => void;
  onNavigateToOrders: () => void;
  onReplayOnboarding: () => void;
}

/**
 * Customer Account, Restaurant Details, Sunyani Delivery Rates, and Session Controls.
 */
export function ProfileScreen({
  onNavigateToAuth,
  onNavigateToOrders,
  onReplayOnboarding,
}: ProfileScreenProps) {
  const { info } = useToast();
  const [user, setUser] = useState<UserDTO | null>(null);

  const loadUser = useCallback(async () => {
    const localUser = await getCurrentUser();
    setUser(localUser);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSignOut = async () => {
    const current = await getCurrentUser();
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => {});
    await removeAuthToken();
    if (current?.id) {
      await clearOrdersCache(current.id);
    }
    setUser(null);
    info("Signed Out", "Your device credentials have been cleared.");
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Account Identity Card */}
      <View style={styles.card}>
        {user ? (
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <UserIcon size={24} color={SikaColors.accentLight} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{user.fullName}</Text>
                <Badge label={user.role.replace(/_/g, " ")} variant="brand" />
              </View>
              <Text style={styles.metaText}>{user.email}</Text>
              <Text style={styles.metaMono}>{user.phone}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.guestBlock}>
            <View style={styles.guestRow}>
              <View style={styles.avatar}>
                <ShieldCheck size={24} color={SikaColors.accentLight} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>Guest Mode</Text>
                <Text style={styles.metaText}>
                  Sign in to prefill checkout details and sync order history.
                </Text>
              </View>
            </View>
            <Button
              title="Sign In or Create Account"
              variant="primary"
              size="md"
              fullWidth
              onPress={onNavigateToAuth}
            />
          </View>
        )}
      </View>

      {/* Quick Shortcuts */}
      <View style={styles.card}>
        <Pressable onPress={onNavigateToOrders} style={styles.actionRow}>
          <View style={styles.actionLeft}>
            <Receipt size={18} color={SikaColors.accentLight} />
            <Text style={styles.actionText}>View &amp; Track Orders</Text>
          </View>
          <ChevronRight size={17} color={SikaColors.muted} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable onPress={onReplayOnboarding} style={styles.actionRow}>
          <View style={styles.actionLeft}>
            <RotateCcw size={18} color={SikaColors.accentLight} />
            <Text style={styles.actionText}>Replay Onboarding Tour</Text>
          </View>
          <ChevronRight size={17} color={SikaColors.muted} />
        </Pressable>

        {user ? (
          <>
            <View style={styles.divider} />
            <Pressable onPress={handleSignOut} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <LogOut size={18} color={SikaColors.error} />
                <Text style={[styles.actionText, { color: "#FDA4AF" }]}>Sign Out</Text>
              </View>
              <ChevronRight size={17} color={SikaColors.error} />
            </Pressable>
          </>
        ) : null}
      </View>

      {/* Restaurant Info & Direct Dial */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Sika Cuisine Sunyani</Text>

        <View style={styles.infoItem}>
          <MapPin size={16} color={SikaColors.accentLight} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Kitchen &amp; Counter Address</Text>
            <Text style={styles.infoSub}>{RESTAURANT_INFO.address}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Clock size={16} color={SikaColors.success} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Service Hours (GMT)</Text>
            <Text style={styles.infoSub}>{RESTAURANT_INFO.hoursWeekday}</Text>
            <Text style={styles.infoSub}>{RESTAURANT_INFO.hoursSunday}</Text>
          </View>
        </View>

        <View style={styles.phoneBtnsRow}>
          <Pressable
            onPress={() => Linking.openURL(`tel:${RESTAURANT_INFO.primaryPhoneIntl}`)}
            style={styles.phoneChip}
          >
            <Phone size={14} color={SikaColors.accentLight} />
            <Text style={styles.phoneChipText}>{RESTAURANT_INFO.primaryPhone}</Text>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(`tel:${RESTAURANT_INFO.secondaryPhoneIntl}`)}
            style={styles.phoneChip}
          >
            <Phone size={14} color={SikaColors.accentLight} />
            <Text style={styles.phoneChipText}>{RESTAURANT_INFO.secondaryPhone}</Text>
          </Pressable>
        </View>
      </View>

      {/* Sunyani Delivery Rates */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Sunyani Delivery Zones</Text>
        <Text style={styles.zoneHint}>
          Counter pickup on Commercial Road is always GHS 0.00.
        </Text>

        <View style={styles.zonesList}>
          {SUNYANI_DELIVERY_ZONES.map((zone) => (
            <View key={zone.id} style={styles.zoneRow}>
              <View style={styles.zoneLeft}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneAreas}>{zone.description}</Text>
              </View>
              <Text style={styles.zoneFee}>
                {formatPesewasToGhs(zone.feePesewas)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footerVersion}>
        Sika Cuisine Mobile &bull; Expo SDK 58 &bull; Sunyani, Ghana
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  scrollContent: {
    padding: SikaSpace.lg,
    gap: SikaSpace.lg,
    paddingBottom: 36,
  },
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.md,
  },
  guestBlock: {
    gap: SikaSpace.lg,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash12,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SikaSpace.sm,
  },
  name: {
    color: SikaColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  metaText: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    marginTop: 3,
  },
  metaMono: {
    color: SikaColors.muted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SikaSpace.sm + 2,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.md,
  },
  actionText: {
    color: SikaColors.warmWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: SikaColors.border,
    marginVertical: SikaSpace.xs,
  },
  cardHeading: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: SikaSpace.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SikaSpace.md,
    marginBottom: SikaSpace.md,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  infoSub: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  phoneBtnsRow: {
    flexDirection: "row",
    gap: SikaSpace.sm,
    marginTop: SikaSpace.xs,
  },
  phoneChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingVertical: 10,
  },
  phoneChipText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "800",
  },
  zoneHint: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginBottom: SikaSpace.md,
  },
  zonesList: {
    gap: SikaSpace.sm,
  },
  zoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    padding: SikaSpace.md,
  },
  zoneLeft: {
    flex: 1,
    paddingRight: SikaSpace.md,
  },
  zoneName: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  zoneAreas: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    marginTop: 2,
  },
  zoneFee: {
    color: SikaColors.accentLight,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  footerVersion: {
    color: SikaColors.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: SikaSpace.xs,
  },
});
