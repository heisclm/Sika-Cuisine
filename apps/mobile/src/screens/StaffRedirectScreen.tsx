import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react-native";
import { formatFirstName, getDashboardForRole, UserDTO } from "@sika/shared";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SikaModal } from "../components/ui/SikaModal";
import { WEB_ORIGIN } from "../services/api-client";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface StaffRedirectScreenProps {
  user: UserDTO;
  onSignOut: () => Promise<void>;
}

function getStaffWorkspaceCopy(role: string): string {
  switch (role) {
    case "STAFF_KITCHEN":
      return "The live Kitchen Display System (KDS) and dish sold-out controls run inside the dedicated Sika Cuisine Web Kitchen workspace for kitchen tablets and displays.";
    case "STAFF_CASHIER":
      return "Order confirmation, counter pickup handovers, and rider dispatch assignments run inside the dedicated Sika Cuisine Web Cashier & Dispatch Desk.";
    default:
      return "Menu CMS, Sunyani delivery zone pricing, revenue analytics, and team management run inside the full Sika Cuisine Web Admin Operations Console.";
  }
}

/**
 * Clean landing screen shown when an ADMIN, STAFF_KITCHEN, or STAFF_CASHIER
 * signs into the native mobile app, directing them to their exact role-matched Web workspace.
 */
export function StaffRedirectScreen({ user, onSignOut }: StaffRedirectScreenProps) {
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const dashboard = getDashboardForRole(user.role);
  const targetUrl = `${WEB_ORIGIN}${dashboard.path}`;

  const handleOpenDashboard = () => {
    void Linking.openURL(targetUrl);
  };

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      setSignOutModalVisible(false);
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 24, SikaSpace.xxl),
          paddingBottom: Math.max(insets.bottom + 24, SikaSpace.xxl),
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <ShieldCheck size={30} color={SikaColors.accentLight} />
        </View>

        <View style={styles.badgeRow}>
          <Badge label={user.role.replace(/_/g, " ")} variant="brand" />
        </View>

        <Text style={styles.title}>{dashboard.title}</Text>
        <Text style={styles.greeting} numberOfLines={1}>
          Signed in as {formatFirstName(user.fullName, "Staff")}
        </Text>

        <Text style={styles.body}>{getStaffWorkspaceCopy(user.role)}</Text>

        <View style={styles.urlPill}>
          <Text style={styles.urlText} numberOfLines={1}>
            {targetUrl}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={dashboard.label}
            variant="primary"
            size="lg"
            fullWidth
            trailingIcon={<ExternalLink size={16} color={SikaColors.text} />}
            onPress={handleOpenDashboard}
          />

          <Button
            title="Sign Out & Switch Account"
            variant="secondary"
            size="md"
            fullWidth
            loading={signingOut}
            leadingIcon={<LogOut size={15} color={SikaColors.warmWhite} />}
            onPress={() => setSignOutModalVisible(true)}
          />
        </View>
      </View>

      <SikaModal
        visible={signOutModalVisible}
        tone="error"
        icon={<LogOut size={24} color={SikaColors.error} />}
        badgeLabel="Staff Session"
        badgeVariant="error"
        title="Sign Out & Switch Account?"
        message="You will be returned to the customer menu and can sign in with a customer or courier account."
        metaRows={[
          { label: "Staff Member", value: user.fullName },
          { label: "Role", value: user.role.replace(/_/g, " ") },
        ]}
        primaryLabel="Sign Out"
        primaryLoading={signingOut}
        onPrimaryPress={() => void handleConfirmSignOut()}
        secondaryLabel="Cancel"
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
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SikaSpace.lg,
  },
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.xl,
    alignItems: "center",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SikaSpace.md,
  },
  badgeRow: {
    marginBottom: SikaSpace.sm + 2,
  },
  title: {
    color: SikaColors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  greeting: {
    color: SikaColors.accentLight,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  body: {
    color: SikaColors.secondaryText,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginTop: SikaSpace.md,
  },
  urlPill: {
    width: "100%",
    marginTop: SikaSpace.lg,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  urlText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    width: "100%",
    gap: SikaSpace.sm + 2,
    marginTop: SikaSpace.xl,
  },
});
