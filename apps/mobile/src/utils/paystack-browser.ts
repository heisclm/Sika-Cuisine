import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

/**
 * Computes the mobile deep-link callback URL passed to the backend so Paystack redirects
 * automatically return the customer back into the Sika Cuisine mobile app.
 */
export function getMobilePaymentReturnUrl(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (
      Constants as unknown as {
        manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
      }
    ).manifest2?.extra?.expoGo?.debuggerHost;

  if (
    hostUri &&
    (Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === "storeClient")
  ) {
    return `exp://${hostUri}/--/payment-callback`;
  }

  return "sikacuisine://payment-callback";
}

/**
 * Launches Paystack Hosted Checkout inside an in-app OS authentication browser sheet
 * (SafariViewController on iOS / Chrome Custom Tabs on Android), falling back seamlessly
 * to standard in-app browser or system browser if a lock/activity error occurs.
 */
export async function openInAppPaystackCheckout(
  authorizationUrl: string,
  returnUrl: string
): Promise<"returned" | "dismissed" | "fallback" | "failed"> {
  try {
    await WebBrowser.dismissBrowser().catch(() => {});
    const result = await WebBrowser.openAuthSessionAsync(
      authorizationUrl,
      returnUrl,
      {
        preferEphemeralSession: false,
        showInRecents: true,
      }
    );

    if (result.type === "success") {
      return "returned";
    }
    if (result.type === "locked") {
      await WebBrowser.openBrowserAsync(authorizationUrl);
      return "fallback";
    }
    return "dismissed";
  } catch {
    try {
      await WebBrowser.openBrowserAsync(authorizationUrl);
      return "fallback";
    } catch {
      try {
        await Linking.openURL(authorizationUrl);
        return "fallback";
      } catch {
        return "failed";
      }
    }
  }
}
