import axios from "axios";
import { BASE_API_URL, ADMIN_SESSION_COOKIE_NAME } from "../constants";
import { useAuthStore } from "./auth-store";
export const apiClient = axios.create({
    baseURL: BASE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
});
apiClient.interceptors.request.use((config) => {
    const session = useAuthStore.getState().session;
    const token = (session as any)?.session?.token;
    if (token) {
        config.headers["Cookie"] = `${ADMIN_SESSION_COOKIE_NAME}=${token}`;
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
}, (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
});
apiClient.interceptors.response.use((response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
}, (error) => {
    if (error.response?.status === 401) {
        console.warn("[API Response Error] 401 Unauthorized - User session might be expired");
    }
    const message = error.response?.data?.message ||
        error.message ||
        "An unknown error occurred";
    console.error(`[API Response Error] ${error.config?.url}:`, message);
    return Promise.reject(error);
});
