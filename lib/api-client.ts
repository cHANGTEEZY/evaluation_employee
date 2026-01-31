import axios from "axios";
import { BASE_API_URL } from "../constants";
import { useAuthStore } from "./auth-store";

export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get session from auth store
    const session = useAuthStore.getState().session;
    const token = (session as any)?.session?.token;

    if (token) {
      // Better-auth compatibility: send token as a cookie
      // Some backends might also accept Authorization: Bearer <token>
      config.headers["Cookie"] = `better-auth.session_token=${token}`;

      // Also add Authorization header just in case the backend supports it
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "[API Response Error] 401 Unauthorized - User session might be expired",
      );
      // Optional: Trigger sign out if session is invalid
      // useAuthStore.getState().signOut();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "An unknown error occurred";
    console.error(`[API Response Error] ${error.config?.url}:`, message);
    return Promise.reject(error);
  },
);
