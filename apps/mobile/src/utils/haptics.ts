import { Platform, Vibration } from "react-native";

type ExpoHapticsModule = {
  impactAsync?: (style: unknown) => Promise<void>;
  notificationAsync?: (type: unknown) => Promise<void>;
  ImpactFeedbackStyle?: { Light?: unknown; Medium?: unknown };
  NotificationFeedbackType?: { Success?: unknown };
};

let cachedExpoHaptics: ExpoHapticsModule | null | undefined;

function resolveExpoHaptics(): ExpoHapticsModule | null {
  if (cachedExpoHaptics !== undefined) return cachedExpoHaptics;
  try {
    // Dynamic require avoids hard native binary dependency if Expo Go build omits expo-haptics
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedExpoHaptics = require("expo-haptics") as ExpoHapticsModule;
  } catch {
    cachedExpoHaptics = null;
  }
  return cachedExpoHaptics;
}

/**
 * Triggers a subtle tactile tap feedback on interactive controls without
 * risking native crashes or triggering iOS's 400ms Vibration fallback.
 */
export function triggerLightHaptic(): void {
  if (Platform.OS === "web") return;
  try {
    const haptics = resolveExpoHaptics();
    if (haptics?.impactAsync && haptics.ImpactFeedbackStyle?.Light) {
      void haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (Platform.OS === "android") {
      Vibration.vibrate(10);
    }
  } catch {
    // Ignore haptic failures on restricted devices or emulators
  }
}

/**
 * Triggers a positive confirmation tactile pulse after actions like order
 * creation or adding customized items to the tray.
 */
export function triggerSuccessHaptic(): void {
  if (Platform.OS === "web") return;
  try {
    const haptics = resolveExpoHaptics();
    if (haptics?.notificationAsync && haptics.NotificationFeedbackType?.Success) {
      void haptics.notificationAsync(haptics.NotificationFeedbackType.Success);
      return;
    }
    if (Platform.OS === "android") {
      Vibration.vibrate([0, 12, 40, 18]);
    }
  } catch {
    // Ignore haptic failures on restricted devices or emulators
  }
}
