import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react-native";
import { RESTAURANT_INFO, UserDTO, formatFirstName, phoneRegex } from "@sika/shared";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { MOBILE_IMAGE_ASSETS } from "../data/dish-images";
import { apiRequest } from "../services/api-client";
import { removeAuthToken, saveAuthToken, saveCurrentUser } from "../services/storage";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { triggerLightHaptic } from "../utils/haptics";

interface AuthScreenProps {
  onAuthSuccess: (user: UserDTO) => void;
  onCancel?: () => void;
  onTrackAsGuest?: () => void;
  initialPortal?: "CUSTOMER" | "RIDER";
}

type AuthMode = "LOGIN" | "REGISTER" | "RECOVERY";
type AuthPortal = "CUSTOMER" | "RIDER";

/**
 * Customer authentication, registration, password assistance, and discreet Rider Portal
 * sign-in matching Web `/login`, `/register`, `/forgot-password`, and `/rider/login` flows.
 */
export function AuthScreen({
  onAuthSuccess,
  onCancel,
  onTrackAsGuest,
  initialPortal = "CUSTOMER",
}: AuthScreenProps) {
  const { success } = useToast();
  const [portal, setPortal] = useState<AuthPortal>(initialPortal);
  const [mode, setMode] = useState<AuthMode>("LOGIN");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    triggerLightHaptic();
    setErrorMessage(null);
    setRecoverySubmitted(false);
    setMode(nextMode);
  };

  const switchPortal = (nextPortal: AuthPortal) => {
    triggerLightHaptic();
    setErrorMessage(null);
    setRecoverySubmitted(false);
    setPortal(nextPortal);
    if (nextPortal === "RIDER" && mode === "REGISTER") {
      setMode("LOGIN");
    }
  };

  const handleAuthSubmit = async () => {
    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    const compactPhone = phone.replace(/\s+/g, "").trim();

    if (mode === "REGISTER") {
      if (fullName.trim().length < 2) {
        setErrorMessage("Please enter your full name (at least 2 characters).");
        return;
      }
      if (!phoneRegex.test(compactPhone)) {
        setErrorMessage(
          "Please enter a valid Ghanaian phone number (e.g. 0244123456)."
        );
        return;
      }
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (mode === "REGISTER") {
      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    } else if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const endpoint = mode === "LOGIN" ? "/auth/login" : "/auth/register";
    const body =
      mode === "LOGIN"
        ? { email: cleanEmail, password }
        : {
            fullName: fullName.trim(),
            phone: compactPhone,
            email: cleanEmail,
            password,
          };

    const res = await apiRequest<{
      success: boolean;
      user: UserDTO;
      token?: string;
    }>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.success || !res.data?.user) {
      setErrorMessage(
        res.error ||
          (mode === "LOGIN"
            ? "Invalid email or password."
            : "Unable to create your account.")
      );
      return;
    }

    if (portal === "RIDER" && res.data.user.role !== "DELIVERY_RIDER") {
      await apiRequest("/auth/logout", { method: "POST" }).catch(() => {});
      await removeAuthToken();
      setErrorMessage(
        "Access denied. This portal requires a registered Delivery Rider account."
      );
      return;
    }

    if (res.data.token) {
      await saveAuthToken(res.data.token);
    }
    await saveCurrentUser(res.data.user);
    const firstName = formatFirstName(res.data.user.fullName, "Guest");
    if (res.data.user.role === "DELIVERY_RIDER") {
      success(`Welcome back, ${firstName}`, "Sunyani Dispatch mode is active.");
    } else if (mode === "LOGIN") {
      success(
        `Welcome back, ${firstName}`,
        "Good to see you again. Ready when you are."
      );
    } else {
      success(
        `Welcome to Sika Cuisine, ${firstName}`,
        "Your account is set up and ready for ordering."
      );
    }
    onAuthSuccess(res.data.user);
  };

  const handleRecoverySubmit = async () => {
    setErrorMessage(null);
    const clean = recoveryIdentifier.trim();
    if (!clean) {
      setErrorMessage("Please enter your registered email or phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message?: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ identifier: clean }),
        }
      );

      if (!res.success) {
        setErrorMessage(
          res.error || "Unable to dispatch password recovery instructions right now."
        );
        return;
      }
      setRecoverySubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {onCancel ? (
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Back to Account"
            style={styles.backBtn}
          >
            <ArrowLeft size={15} color={SikaColors.warmWhite} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}

        <View style={styles.card}>
          {/* Centered Brand Header matching Web Auth Cards */}
          <View style={styles.cardHeader}>
            <Image
              source={MOBILE_IMAGE_ASSETS.logo}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            {portal === "RIDER" && mode === "LOGIN" ? (
              <View style={styles.riderPortalBadge}>
                <Bike size={13} color={SikaColors.accentLight} />
                <Text style={styles.riderPortalBadgeText}>
                  SUNYANI DISPATCH PORTAL
                </Text>
              </View>
            ) : (
              <Text style={styles.eyebrow}>
                {mode === "LOGIN"
                  ? "CUSTOMER SIGN IN"
                  : mode === "REGISTER"
                  ? "NEW CUSTOMER"
                  : "ACCOUNT RECOVERY"}
              </Text>
            )}
            <Text style={styles.title}>
              {portal === "RIDER" && mode === "LOGIN"
                ? "Delivery Rider Sign In"
                : mode === "LOGIN"
                ? "Welcome Back to Sika"
                : mode === "REGISTER"
                ? "Create Sika Account"
                : "Reset Your Password"}
            </Text>
            <Text style={styles.subtitle}>
              {portal === "RIDER" && mode === "LOGIN"
                ? "Sign in with your assigned courier account to pick up and complete Sunyani drops."
                : mode === "LOGIN"
                ? "Sign in to view your saved profile, order history, and active deliveries."
                : mode === "REGISTER"
                ? "Save your contact details for faster Sunyani delivery and pickup tracking."
                : "Enter your registered email or Ghanaian phone number and we will email a secure reset link."}
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {mode === "RECOVERY" ? (
            <View style={styles.formStack}>
              {recoverySubmitted ? (
                <View style={styles.recoverySuccessBox}>
                  <CheckCircle2 size={28} color={SikaColors.success} />
                  <Text style={styles.recoverySuccessTitle}>
                    Check Your Email
                  </Text>
                  <Text style={styles.recoverySuccessCopy}>
                    If an active account matches{" "}
                    <Text style={{ color: SikaColors.text, fontWeight: "700" }}>
                      {recoveryIdentifier}
                    </Text>
                    , a password reset link expiring in 30 minutes has been dispatched. Need help? Contact Sunyani support below.
                  </Text>

                  <View style={styles.recoveryBtns}>
                    <Pressable
                      onPress={() =>
                        Linking.openURL(`tel:${RESTAURANT_INFO.primaryPhoneIntl}`)
                      }
                      style={styles.callActionBtn}
                    >
                      <Phone size={14} color={SikaColors.text} />
                      <Text style={styles.callActionText}>
                        Call {RESTAURANT_INFO.primaryPhone}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        Linking.openURL(
                          `${RESTAURANT_INFO.whatsappBaseUrl}?text=${encodeURIComponent(
                            `Hello Sika Cuisine, I need help resetting password for account: ${recoveryIdentifier}`
                          )}`
                        )
                      }
                      style={styles.waActionBtn}
                    >
                      <MessageCircle size={14} color={SikaColors.success} />
                      <Text style={styles.waActionText}>WhatsApp Desk</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>REGISTERED EMAIL OR PHONE NUMBER *</Text>
                  <View style={styles.inputRow}>
                    <Mail size={16} color={SikaColors.muted} />
                    <TextInput
                      value={recoveryIdentifier}
                      onChangeText={setRecoveryIdentifier}
                      autoCapitalize="none"
                      placeholder="kwame@example.com or 0244123456"
                      placeholderTextColor={SikaColors.muted}
                      style={styles.input}
                    />
                  </View>
                  <Button
                    title="Send Reset Instructions"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    onPress={handleRecoverySubmit}
                    style={styles.ctaSpacing}
                  />
                </>
              )}

              <View style={styles.recoveryFooter}>
                <Pressable
                  onPress={() => switchMode("LOGIN")}
                  style={styles.inlineBackBtn}
                >
                  <ArrowLeft size={14} color={SikaColors.secondaryText} />
                  <Text style={styles.inlineBackText}>Back to Sign In</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    Linking.openURL(`tel:${RESTAURANT_INFO.primaryPhoneIntl}`)
                  }
                >
                  <Text style={styles.phoneLink}>{RESTAURANT_INFO.primaryPhone}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.formStack}>
              {mode === "REGISTER" ? (
                <>
                  <Text style={styles.label}>FULL NAME *</Text>
                  <View style={styles.inputRow}>
                    <User size={16} color={SikaColors.muted} />
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Kwame Mensah"
                      placeholderTextColor={SikaColors.muted}
                      style={styles.input}
                    />
                  </View>

                  <Text style={styles.label}>GHANA MOBILE NUMBER *</Text>
                  <View style={styles.inputRow}>
                    <Phone size={16} color={SikaColors.muted} />
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="0244123456"
                      placeholderTextColor={SikaColors.muted}
                      style={styles.input}
                    />
                  </View>
                </>
              ) : null}

              <Text style={styles.label}>EMAIL ADDRESS *</Text>
              <View style={styles.inputRow}>
                <Mail size={16} color={SikaColors.muted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="kwame@example.com"
                  placeholderTextColor={SikaColors.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.labelHeaderRow}>
                <Text style={styles.labelNoTop}>PASSWORD *</Text>
                {mode === "LOGIN" ? (
                  <Pressable onPress={() => switchMode("RECOVERY")} hitSlop={6}>
                    <Text style={styles.forgotLink}>Forgot password?</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.inputRow}>
                <Lock size={16} color={SikaColors.muted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder={mode === "REGISTER" ? "Minimum 8 characters" : "••••••••"}
                  placeholderTextColor={SikaColors.muted}
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={17} color={SikaColors.secondaryText} />
                  ) : (
                    <Eye size={17} color={SikaColors.secondaryText} />
                  )}
                </Pressable>
              </View>

              {mode === "REGISTER" ? (
                <>
                  <View style={styles.labelHeaderRow}>
                    <Text style={styles.labelNoTop}>CONFIRM PASSWORD *</Text>
                    {confirmPassword.length > 0 ? (
                      <Text
                        style={[
                          styles.matchText,
                          {
                            color:
                              password === confirmPassword
                                ? SikaColors.success
                                : "#FDA4AF",
                          },
                        ]}
                      >
                        {password === confirmPassword
                          ? "Passwords match"
                          : "Does not match"}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.inputRow}>
                    <Lock size={16} color={SikaColors.muted} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Repeat your password"
                      placeholderTextColor={SikaColors.muted}
                      style={styles.input}
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} color={SikaColors.secondaryText} />
                      ) : (
                        <Eye size={17} color={SikaColors.secondaryText} />
                      )}
                    </Pressable>
                  </View>
                </>
              ) : null}

              <Button
                title={
                  portal === "RIDER" && mode === "LOGIN"
                    ? "Sign In to Dispatch"
                    : mode === "LOGIN"
                    ? "Sign In to Account"
                    : "Create Sika Account"
                }
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                trailingIcon={<ArrowRight size={16} color={SikaColors.text} />}
                onPress={handleAuthSubmit}
                style={styles.ctaSpacing}
              />

              {mode === "LOGIN" ? (
                portal === "RIDER" ? (
                  <View style={styles.loginFooter}>
                    <View style={styles.riderInviteNote}>
                      <ShieldCheck size={15} color={SikaColors.accentLight} />
                      <Text style={styles.riderInviteNoteText}>
                        Rider accounts are provisioned by Sika Cuisine Management. Contact dispatch if you need access.
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => switchPortal("CUSTOMER")}
                      style={styles.inlineSwitchRow}
                    >
                      <ArrowLeft size={13} color={SikaColors.accentLight} />
                      <Text style={styles.switchAccent}>
                        {" "}
                        Switch to Customer Sign In
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.loginFooter}>
                    <Pressable
                      onPress={() => switchMode("REGISTER")}
                      style={styles.inlineSwitchRow}
                    >
                      <Text style={styles.switchMuted}>
                        Don&apos;t have an account yet?{" "}
                      </Text>
                      <UserPlus size={13} color={SikaColors.accentLight} />
                      <Text style={styles.switchAccent}> Create an Account</Text>
                    </Pressable>

                    <View style={styles.orRow}>
                      <View style={styles.orLine} />
                      <Text style={styles.orLabel}>OR</Text>
                      <View style={styles.orLine} />
                    </View>

                    <Pressable
                      onPress={() => {
                        if (onTrackAsGuest) onTrackAsGuest();
                        else onCancel?.();
                      }}
                      style={styles.guestTrackBtn}
                    >
                      <Compass size={15} color={SikaColors.accentLight} />
                      <Text style={styles.guestTrackText}>
                        Track Existing Order as Guest
                      </Text>
                    </Pressable>

                    <View style={styles.riderDivider}>
                      <Text style={styles.riderSwitchLabel}>
                        Sika Delivery Team?
                      </Text>
                      <Pressable
                        onPress={() => switchPortal("RIDER")}
                        hitSlop={8}
                        style={styles.riderPortalTrigger}
                      >
                        <Bike size={14} color={SikaColors.accentLight} />
                        <Text style={styles.riderPortalLink}>
                          Rider Portal Sign In →
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )
              ) : (
                <Pressable
                  onPress={() => switchMode("LOGIN")}
                  style={styles.registerSwitchRow}
                >
                  <Text style={styles.switchMuted}>Already registered? </Text>
                  <Text style={styles.switchAccent}>Sign in instead</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  scrollContent: {
    padding: SikaSpace.md,
    paddingBottom: 36,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    marginBottom: SikaSpace.md,
  },
  backText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.lg,
    paddingVertical: SikaSpace.xl,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: SikaSpace.md,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: SikaSpace.sm,
  },
  eyebrow: {
    color: SikaColors.accentLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: SikaColors.warmWhite,
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },
  errorBox: {
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
    padding: SikaSpace.md,
    marginBottom: SikaSpace.sm,
  },
  errorText: {
    color: "#FDA4AF",
    fontSize: 12,
    lineHeight: 17,
  },
  formStack: {
    marginTop: SikaSpace.xs,
  },
  label: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: SikaSpace.md,
  },
  labelHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    marginTop: SikaSpace.md,
  },
  labelNoTop: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  forgotLink: {
    color: SikaColors.accentLight,
    fontSize: 12,
    fontWeight: "600",
  },
  matchText: {
    fontSize: 11,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    height: 46,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: SikaSpace.md,
  },
  input: {
    flex: 1,
    color: SikaColors.warmWhite,
    fontSize: 14,
  },
  ctaSpacing: {
    marginTop: SikaSpace.lg,
  },
  loginFooter: {
    marginTop: SikaSpace.lg,
    gap: SikaSpace.md,
  },
  inlineSwitchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  registerSwitchRow: {
    marginTop: SikaSpace.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  switchMuted: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
  },
  switchAccent: {
    color: SikaColors.accentLight,
    fontSize: 12.5,
    fontWeight: "700",
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: SikaColors.border,
  },
  orLabel: {
    color: SikaColors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  guestTrackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
  },
  guestTrackText: {
    color: SikaColors.warmWhite,
    fontSize: 12.5,
    fontWeight: "700",
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SikaSpace.sm,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.warningBorder,
    backgroundColor: SikaColors.warningBg,
    padding: SikaSpace.md,
  },
  noticeText: {
    flex: 1,
    color: SikaColors.warmWhite,
    fontSize: 12,
    lineHeight: 17,
  },
  recoverySuccessBox: {
    alignItems: "center",
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
    padding: SikaSpace.lg,
    marginTop: SikaSpace.md,
    gap: SikaSpace.sm,
  },
  recoverySuccessTitle: {
    color: SikaColors.warmWhite,
    fontSize: 16,
    fontWeight: "800",
  },
  recoverySuccessCopy: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
  },
  recoveryBtns: {
    flexDirection: "row",
    gap: SikaSpace.sm,
    width: "100%",
    marginTop: SikaSpace.xs,
  },
  callActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: SikaRadius.md,
    backgroundColor: SikaColors.accent,
  },
  callActionText: {
    color: SikaColors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  waActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
  },
  waActionText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  recoveryFooter: {
    marginTop: SikaSpace.lg,
    paddingTop: SikaSpace.md,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineBackText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  phoneLink: {
    color: SikaColors.accentLight,
    fontSize: 12,
    fontWeight: "800",
  },
  riderPortalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  riderPortalBadgeText: {
    color: SikaColors.accentLight,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  riderInviteNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    padding: SikaSpace.md,
  },
  riderInviteNoteText: {
    flex: 1,
    color: SikaColors.secondaryText,
    fontSize: 12,
    lineHeight: 17,
  },
  riderDivider: {
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    paddingTop: SikaSpace.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  riderSwitchLabel: {
    color: SikaColors.muted,
    fontSize: 12,
  },
  riderPortalTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  riderPortalLink: {
    color: SikaColors.accentLight,
    fontSize: 12.5,
    fontWeight: "800",
  },
});
