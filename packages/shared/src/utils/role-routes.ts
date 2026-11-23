import { Role } from "../contracts/order";

export type OperationalWorkspace = "admin" | "cashier" | "kitchen" | "rider";

export interface RoleDashboardConfig {
  path: string;
  label: string;
  title: string;
  shortLabel: string;
}

export const ROLE_DASHBOARDS: Record<Role, RoleDashboardConfig> = {
  ADMIN: {
    path: "/admin",
    label: "Open Admin Console",
    title: "Admin Operations Console",
    shortLabel: "Admin Console",
  },
  STAFF_CASHIER: {
    path: "/cashier",
    label: "Open Cashier Desk",
    title: "Cashier & Dispatch Desk",
    shortLabel: "Cashier Desk",
  },
  STAFF_KITCHEN: {
    path: "/kitchen",
    label: "Open Kitchen Display",
    title: "Kitchen Display System (KDS)",
    shortLabel: "Kitchen KDS",
  },
  DELIVERY_RIDER: {
    path: "/rider",
    label: "Open Rider Dispatch",
    title: "Rider Dispatch Portal",
    shortLabel: "Rider Dispatch",
  },
  CUSTOMER: {
    path: "/account",
    label: "Open My Account",
    title: "Customer Account",
    shortLabel: "My Account",
  },
};

/**
 * Resolves the role-appropriate dashboard destination and CTA label.
 * Defaults gracefully to CUSTOMER (`/account`) if role is missing or unrecognized.
 */
export function getDashboardForRole(role?: string | null): RoleDashboardConfig {
  if (role && Object.prototype.hasOwnProperty.call(ROLE_DASHBOARDS, role)) {
    return ROLE_DASHBOARDS[role as Role];
  }
  return ROLE_DASHBOARDS.CUSTOMER;
}

/**
 * Checks whether an authenticated role is permitted to view a specific operational workspace.
 */
export function canAccessWorkspace(
  role: string | null | undefined,
  workspace: OperationalWorkspace
): boolean {
  if (!role) return false;
  switch (workspace) {
    case "admin":
      return role === "ADMIN";
    case "cashier":
      return role === "ADMIN" || role === "STAFF_CASHIER";
    case "kitchen":
      return role === "ADMIN" || role === "STAFF_KITCHEN";
    case "rider":
      return role === "DELIVERY_RIDER";
    default:
      return false;
  }
}

/**
 * Returns true strictly when a menu item PATCH payload toggles availability (`{ isAvailable }`)
 * without modifying prices, descriptions, photos, categories, or featured flags.
 */
export function isAvailabilityOnlyMenuPatch(payload: Record<string, unknown>): boolean {
  const keys = Object.keys(payload);
  return keys.length === 1 && keys[0] === "isAvailable";
}
