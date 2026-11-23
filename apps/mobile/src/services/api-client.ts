/**
 * @file apps/mobile/src/services/api-client.ts
 * @description Centralized HTTP networking client for Sika Cuisine mobile application.
 *
 * RESILIENCE & NETWORKING DESIGN:
 * 1. Base URL Resolution: Resolves API origin dynamically from app.json extra config.
 *    Falls back to Android emulator host loopback (10.0.2.2:3000) for local development.
 * 2. Automated Bearer Injection: Queries SecureStore asynchronously to attach the Authorization header.
 * 3. Defensive Timeout (12s): Cancels sluggish requests via AbortController to prevent indefinite UI hangs.
 * 4. Offline Classification: Differentiates structural HTTP errors (4xx/5xx) from transport failures (AbortError,
 *    socket disconnects) to safely toggle isOffline state and trigger cached fallback data.
 */

import Constants from "expo-constants";
import { getAuthToken } from "./storage";

/**
 * Resolves the REST API base URL in priority order:
 * 1. EXPO_PUBLIC_API_URL (set in apps/mobile/.env or EAS Build environment)
 * 2. app.json extra.apiUrl override
 * 3. Android emulator host loopback pointing to local Next.js server
 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "http://10.0.2.2:3000/api/v1";

/**
 * Origin of the paired Sika Cuisine Web Operations Console (`WEB_ORIGIN`).
 */
export const WEB_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

/**
 * Standard envelope returned by apiRequest across all HTTP interactions.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  status?: number;
  data?: T;
  error?: string;
  isOffline?: boolean;
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Dispatches an HTTP request to the shared Next.js REST API with automatic Bearer token injection and timeout.
 *
 * @template T - Expected shape of response payload
 * @param endpoint - Relative path (e.g., "/orders" or "menu/items")
 * @param options - Fetch options (method, body, custom headers, optional timeoutMs)
 * @returns Promise<ApiResponse<T>> - Normalized response envelope
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Automatically attach authenticated customer JWT if stored
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Defensive timeout for mobile cellular networks in Ghana (30s for payment init, 12s default)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        data: json,
        error: json.error || `Server returned error (${response.status})`,
      };
    }

    return {
      success: true,
      status: response.status,
      data: json,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Network timeout: The server took too long to respond. Please check your connection.",
        isOffline: true,
      };
    }
    return {
      success: false,
      error: "Network unavailable: You are currently offline or unable to reach Sika Cuisine servers.",
      isOffline: true,
    };
  }
}
