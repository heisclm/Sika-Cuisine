/**
 * @file packages/shared/src/navigation.ts
 * @description Single source of truth for Sika Cuisine navigation destinations and verified restaurant metadata.
 *
 * Both the Web Desktop Navbar and Responsive Web Mobile Side Drawer consume `WEB_PRIMARY_NAV` so
 * labels, order, destination URLs, and active route detection never drift apart.
 */

export type WebNavIconKey = "home" | "utensils" | "receipt" | "info" | "phone";

export interface WebNavItem {
  name: string;
  href: string;
  description: string;
  icon: WebNavIconKey;
}

/**
 * Primary navigation links rendered identically across Web Desktop Navbar and Mobile Side Drawer.
 */
export const WEB_PRIMARY_NAV: readonly WebNavItem[] = [
  { name: "Home", href: "/", description: "Signature delicacies & daily highlights", icon: "home" },
  { name: "Menu", href: "/menu", description: "Browse all dishes, packages & sides", icon: "utensils" },
  { name: "Orders", href: "/orders", description: "Track live kitchen status & order history", icon: "receipt" },
  { name: "About", href: "/about", description: "Sunyani culinary craft & standards", icon: "info" },
  { name: "Contact", href: "/contact", description: "Location, hours & direct inquiries", icon: "phone" },
] as const;

export type MobileTabId = "home" | "menu" | "orders" | "account";

export interface MobileTabItem {
  id: MobileTabId;
  label: string;
  accessibilityLabel: string;
}

/** Primary bottom tab destinations for the native Expo mobile application. */
export const MOBILE_TAB_NAV: readonly MobileTabItem[] = [
  { id: "home", label: "Home", accessibilityLabel: "Home showcase" },
  { id: "menu", label: "Menu", accessibilityLabel: "Browse full menu" },
  { id: "orders", label: "Orders", accessibilityLabel: "Order history and tracking" },
  { id: "account", label: "Account", accessibilityLabel: "Customer profile and delivery rates" },
] as const;

/** Verified Sika Cuisine restaurant identity and contact details (Sunyani, Ghana). */
export const RESTAURANT_INFO = {
  brandName: "Sika Cuisine",
  city: "Sunyani, Ghana",
  address: "Commercial Road, Sunyani Central, Bono Region, Ghana",
  landmark: "Opposite TotalEnergies Station, Commercial Rd",
  primaryPhone: "0533376760",
  primaryPhoneIntl: "+233533376760",
  secondaryPhone: "0554406681",
  secondaryPhoneIntl: "+233554406681",
  email: "orders@sikacuisine.com",
  hoursWeekday: "Mon – Sat: 10:00 AM – 10:00 PM",
  hoursSunday: "Sunday: 12:00 PM – 9:00 PM",
  whatsappBaseUrl: "https://wa.me/233533376760",
} as const;
