import * as SecureStore from "expo-secure-store";
import { UserDTO } from "@sika/shared";

const AUTH_TOKEN_KEY = "sika_auth_token";
const USER_PROFILE_KEY = "sika_user_profile";

/**
 * Persists JWT auth token in hardware-encrypted device storage.
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch (err) {
    console.error("[SecureStore Error]: Unable to save auth token", err);
  }
}

/**
 * Retrieves the stored JWT auth token.
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (err) {
    console.error("[SecureStore Error]: Unable to retrieve auth token", err);
    return null;
  }
}

/**
 * Clears stored authentication credentials upon logout.
 */
export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
  } catch (err) {
    console.error("[SecureStore Error]: Unable to remove credentials", err);
  }
}

/**
 * Saves current user profile.
 */
export async function saveCurrentUser(user: UserDTO): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("[SecureStore Error]: Unable to save user profile", err);
  }
}

/**
 * Retrieves current user profile.
 */
export async function getCurrentUser(): Promise<UserDTO | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}
