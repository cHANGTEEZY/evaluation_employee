import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "https://evaluation-backend-ntpb.onrender.com",
  plugins: [
    expoClient({
      scheme: "evaluationapp",
      storagePrefix: "evaluationapp",
      storage: SecureStore,
    }),
  ],
});

export type AuthClient = typeof authClient;
