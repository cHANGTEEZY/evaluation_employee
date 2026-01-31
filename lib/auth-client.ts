import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { BASE_API_URL } from "../constants";

// Debug: Log the base URL being used
console.log("[Auth Client] Initializing with BASE_API_URL:", BASE_API_URL);

export const authClient = createAuthClient({
  baseURL: BASE_API_URL,
  basePath: "/api/auth", // Explicitly set the auth path
  fetchOptions: {
    credentials: "include", // Required for cross-origin cookies
    onRequest: (ctx) => {
      // Debug: Log outgoing requests
      console.log("[Auth Client] Request URL:", ctx.url);
      // Accessing method and headers safely via casting if needed for debug
      const options = (ctx as any).options;
      if (options) {
        console.log("[Auth Client] Request Method:", options.method);
        console.log("[Auth Client] Request Headers:", options.headers);
      }
    },
    onResponse: (ctx) => {
      // Debug: Log responses
      console.log("[Auth Client] Response Status:", ctx.response.status);
      console.log("[Auth Client] Response URL:", ctx.response.url);
    },
    onError: (ctx) => {
      // Debug: Log errors
      console.error("[Auth Client] Fetch Error:", ctx.error);
      // ctx.url might not exist on ErrorContext in this version
    },
  },
  plugins: [
    expoClient({
      scheme: "evaluationapp",
      storagePrefix: "evaluationapp",
      storage: SecureStore,
    }),
  ],
});

export type AuthClient = typeof authClient;
