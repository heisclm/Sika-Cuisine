import React, { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Bike,
  Clock,
  LogOut,
  Mail,
  MessageCircle,
  Pause,
  Phone,
  Play,
  RefreshCw,
  User as UserIcon,
} from "lucide-react-native";
import {
  RESTAURANT_INFO,
  UserDTO,
  formatInitials,
  formatTimeOfDayGreeting,
} from "@sika/shared";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { SikaModal } from "../../components/ui/SikaModal";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { triggerLightHaptic } from "../../utils/haptics";

interface RiderProfileScreenProps {
  user: UserDTO;
  autoRefreshPaused: boolean;
  lastSyncedAt: string | null;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  onSignOut: () => Promise<void>;
}

/**
 * Courier profile, live polling controls, Sunyani Dispatch Desk contacts,
 * and one-tap sign out for authenticated DELIVERY_RIDER accounts.
 */
export function RiderProfileScreen({
  user,
  autoRefreshPaused,
  lastSyncedAt,
  onToggleAutoRefresh,
  onManualRefresh,
  onSignOut,
}: RiderProfileScreenProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      setSignOutModalVisible(false);
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  const formattedSyncTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Pending sync";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Rider Identity (2-Zone Courier Card) */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>
              {formatInitials(user.fullName, "SR")}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.badgeWrap}>
              <Badge label="DELIVERY RIDER" variant="brand" />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {formatTimeOfDayGreeting(user.fullName)}
            </Text>
          </View>
        </View>

        <View style={styles.profileDivider} />

        <View style={styles.contactGrid}>
          <View style={styles.contactRow}>
            <View style={styles.contactLeft}>
              <UserIcon size={13} color={SikaColors.muted} />
              <Text style={styles.contactLabel}>Full Name</Text>
            </View>
            <Text style={styles.contactValue} numberOfLines={1}>
              {user.fullName}
            </Text>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactLeft}>
              <Mail size={13} color={SikaColors.muted} />
              <Text style={styles.contactLabel}>Email</Text>
            </View>
            <Text style={styles.contactValue} numberOfLines={1}>
              {user.email}
            </Text>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactLeft}>
              <Phone size={13} color={SikaColors.muted} />
              <Text style={styles.contactLabel}>Mobile</Text>
            </View>
            <Text style={styles.contactValueMono} numberOfLines={1}>
              {user.phone}
            </Text>
          </View>
        </View>
      </View>

      {/* Dispatch Sync Controls */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Dispatch Sync Controls</Text>
        <View style={styles.syncInfoRow}>
          <Clock size={15} color={SikaColors.success} />
          <Text style={styles.syncText}>Last synced: {formattedSyncTime}</Text>
        </View>

        <View style={styles.btnGrid}>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onToggleAutoRefresh();
            }}
            style={styles.controlBtn}
          >
            {autoRefreshPaused ? (
              <Play size={15} color={SikaColors.success} />
            ) : (
              <Pause size={15} color={SikaColors.warning} />
            )}
            <Text style={styles.controlBtnText}>
              {autoRefreshPaused ? "Resume 15s Sync" : "Pause 15s Sync"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onManualRefresh();
            }}
            style={styles.controlBtn}
          >
            <RefreshCw size={15} color={SikaColors.accentLight} />
            <Text style={styles.controlBtnText}>Sync Queue Now</Text>
          </Pressable>
        </View>
      </View>

      {/* Sunyani Dispatch Desk */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Commercial Road Dispatch Desk</Text>
        <Text style={styles.helperCopy}>
          Call or message the Sunyani kitchen counter if a customer is unreachable or an address needs clarification.
        </Text>

        <View style={styles.btnGrid}>
          <Pressable
            onPress={() =>
              Linking.openURL(`tel:${RESTAURANT_INFO.primaryPhoneIntl}`)
            }
            style={styles.controlBtn}
          >
            <Phone size={15} color={SikaColors.accentLight} />
            <Text style={styles.controlBtnText}>{RESTAURANT_INFO.primaryPhone}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL(`tel:${RESTAURANT_INFO.secondaryPhoneIntl}`)
            }
            style={styles.controlBtn}
          >
            <Phone size={15} color={SikaColors.accentLight} />
            <Text style={styles.controlBtnText}>{RESTAURANT_INFO.secondaryPhone}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => Linking.openURL(RESTAURANT_INFO.whatsappBaseUrl)}
          style={styles.whatsappBtn}
        >
          <MessageCircle size={16} color={SikaColors.success} />
          <Text style={styles.whatsappBtnText}>Message Dispatch on WhatsApp</Text>
        </Pressable>
      </View>

      {/* Sign Out */}
      <Button
        title="Sign Out of Dispatch"
        variant="secondary"
        size="lg"
        fullWidth
        loading={signingOut}
        leadingIcon={<LogOut size={16} color={SikaColors.error} />}
        onPress={() => setSignOutModalVisible(true)}
      />

      <SikaModal
        visible={signOutModalVisible}
        tone="error"
        icon={<LogOut size={24} color={SikaColors.error} />}
        badgeLabel="Courier Session"
        badgeVariant="error"
        title="Sign Out of Dispatch?"
        message="You will stop receiving live Sunyani dispatch queue updates on this device until you sign in again."
        metaRows={[
          { label: "Courier", value: user.fullName },
          { label: "Phone", value: user.phone },
        ]}
        primaryLabel="Sign Out of Dispatch"
        primaryLoading={signingOut}
        onPrimaryPress={() => void handleConfirmSignOut()}
        secondaryLabel="Stay Active"
        onSecondaryPress={() => {
          if (!signingOut) setSignOutModalVisible(false);
        }}
        onRequestClose={() => {
          if (!signingOut) setSignOutModalVisible(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  scrollContent: {
    padding: SikaSpace.md,
    paddingBottom: 110,
    gap: SikaSpace.md,
  },
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    gap: SikaSpace.sm + 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: SikaColors.warmWhite,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  badgeWrap: {
    alignSelf: "flex-start",
  },
  name: {
    color: SikaColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  profileDivider: {
    height: 1,
    backgroundColor: SikaColors.border,
    marginVertical: SikaSpace.xs,
  },
  contactGrid: {
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SikaSpace.md,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexShrink: 0,
  },
  contactLabel: {
    color: SikaColors.secondaryText,
    fontSize: 11.5,
    fontWeight: "600",
  },
  contactValue: {
    color: SikaColors.warmWhite,
    fontSize: 12.5,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  contactValueMono: {
    color: SikaColors.warmWhite,
    fontSize: 12.5,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  cardHeading: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  syncInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  syncText: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
  },
  helperCopy: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },
  btnGrid: {
    flexDirection: "row",
    gap: SikaSpace.sm,
    marginTop: 2,
  },
  controlBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
  },
  controlBtnText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
  },
  whatsappBtnText: {
    color: SikaColors.success,
    fontSize: 12.5,
    fontWeight: "800",
  },
});
