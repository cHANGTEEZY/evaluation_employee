import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { BASE_API_URL } from "../constants";
console.log("[Auth Client] Initializing with BASE_API_URL:", BASE_API_URL);
export const authClient = createAuthClient({
    baseURL: BASE_API_URL,
    basePath: "/api/auth",
    fetchOptions: {
        credentials: "include",
        onRequest: (ctx) => {
            console.log("[Auth Client] Request URL:", ctx.url);
            const options = (ctx as any).options;
            if (options) {
                console.log("[Auth Client] Request Method:", options.method);
                console.log("[Auth Client] Request Headers:", options.headers);
            }
        },
        onResponse: (ctx) => {
            console.log("[Auth Client] Response Status:", ctx.response.status);
            console.log("[Auth Client] Response URL:", ctx.response.url);
        },
        onError: (ctx) => {
            console.error("[Auth Client] Fetch Error:", ctx.error);
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
