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

/** Default fallback points to Android emulator loopback addressing workstation localhost */
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://10.0.2.2:3000/api/v1";

/**
 * Standard envelope returned by apiRequest across all HTTP interactions.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isOffline?: boolean;
}

/**
 * Dispatches an HTTP request to the shared Next.js REST API with automatic Bearer token injection and timeout.
 *
 * @template T - Expected shape of response payload
 * @param endpoint - Relative path (e.g., "/orders" or "menu/items")
 * @param options - Fetch options (method, body, custom headers)
 * @returns Promise<ApiResponse<T>> - Normalized response envelope
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Automatically attach authenticated customer JWT if stored
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // 12-second defensive timeout for mobile cellular networks in Ghana
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: json.error || `Server returned error (${response.status})`,
      };
    }

    return {
      success: true,
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
