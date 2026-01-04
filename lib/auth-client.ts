import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "https://novella-cantoral-terrance.ngrok-free.dev",
  plugins: [
    expoClient({
      scheme: "evaluationapp",
      storagePrefix: "evaluationapp",
      storage: SecureStore,
    }),
  ],
});

export type AuthClient = typeof authClient;
