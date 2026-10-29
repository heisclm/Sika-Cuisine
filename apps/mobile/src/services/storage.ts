/**
 * @file apps/mobile/src/services/storage.ts
 * @description Hardware-backed secure storage for Sika Cuisine authentication tokens and user credentials.
 *
 * CYBERSECURITY ARCHITECTURE:
 * - Mobile Token Strategy: Web clients utilize HTTP-only, SameSite=Lax session cookies.
 *   Mobile native clients operate via Authorization: Bearer <JWT> headers.
 * - Hardware Key Protection: expo-secure-store encrypts secrets at rest using Android Keystore (AES-256 GCM)
 *   and iOS Keychain Services. Secrets are never exposed to insecure AsyncStorage or plain file systems.
 */

import * as SecureStore from "expo-secure-store";
import { UserDTO } from "@sika/shared";

/** Storage key constants partitioned for Sika Cuisine */
const AUTH_TOKEN_KEY = "sika_auth_token";
const USER_PROFILE_KEY = "sika_user_profile";

/**
 * Persists a signed JWT authentication token in hardware-encrypted device storage.
 *
 * @param token - Base64 encoded JSON Web Token from POST /api/v1/auth/login
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.error("[SecureStore Error]: Unable to persist JWT auth token", err);
  }
}

/**
 * Retrieves the hardware-encrypted JWT auth token for outbound API authorization.
 *
 * @returns Promise<string | null> - Token string or null if unauthenticated or on read failure
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (err) {
    console.error("[SecureStore Error]: Unable to retrieve JWT auth token", err);
    return null;
  }
}

/**
 * Irrevocably deletes stored authentication credentials and user profile upon customer logout.
 */
export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
  } catch (err) {
    console.error("[SecureStore Error]: Unable to purge credentials from Keychain/Keystore", err);
  }
}

/**
 * Caches customer profile snapshot in encrypted storage for zero-latency app boot.
 *
 * @param user - Authenticated customer DTO
 */
export async function saveCurrentUser(user: UserDTO): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("[SecureStore Error]: Unable to persist customer profile snapshot", err);
  }
}

/**
 * Retrieves cached customer profile snapshot from encrypted storage.
 *
 * @returns Promise<UserDTO | null> - User profile object or null if session is inactive
 */
export async function getCurrentUser(): Promise<UserDTO | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}
