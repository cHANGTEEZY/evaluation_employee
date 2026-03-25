import Constants from "expo-constants";

const DEFAULT_API_URL =
  "https://evaluation-backend-production-dac9.up.railway.app";

type AppExtra = {
  apiUrl?: string;
  galliMapsApiKey?: string;
};

function getExtra(): AppExtra {
  const raw = Constants.expoConfig?.extra;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as AppExtra;
  }
  return {};
}

export const BASE_API_URL =
  getExtra().apiUrl?.trim() ||
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  DEFAULT_API_URL;

/** Galli Maps access token (style URL, search, reverse, property evaluation). */
export function getGalliMapsApiKey(): string {
  return (
    getExtra().galliMapsApiKey?.trim() ||
    process.env.EXPO_PUBLIC_GALLI_MAPS_API_KEY?.trim() ||
    ""
  );
}

/** Cookie name for admin API session (must match backend cookiePrefix "better-auth-admin"). */
export const ADMIN_SESSION_COOKIE_NAME = "better-auth-admin.session_token";
