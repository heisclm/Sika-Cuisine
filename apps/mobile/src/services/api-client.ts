import Constants from "expo-constants";
import { getAuthToken } from "./storage";

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://10.0.2.2:3000/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isOffline?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
