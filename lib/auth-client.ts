import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { BASE_API_URL } from "../constants";

export const authClient = createAuthClient({
  // baseURL: "http://192.168.0.25:3000",
  baseURL: "https://novella-cantoral-terrance.ngrok-free.dev",
  // baseURL: BASE_API_URL,
  plugins: [
    expoClient({
      scheme: "evaluationapp",
      storagePrefix: "evaluationapp",
      storage: SecureStore,
    }),
  ],
});

export type AuthClient = typeof authClient;
