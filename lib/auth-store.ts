import type { Atom } from "nanostores";
import { create } from "zustand";
import { authClient } from "./auth-client";
import * as SecureStore from "expo-secure-store";

// `authClient.useSession` is a nanostores atom that auto-fetches /get-session
// when it gets its first subscriber (see better-auth's session atom).

type UseSessionAtomValue = typeof authClient extends {
  useSession: Atom<infer V>;
}
  ? V
  : {
      data: unknown;
      error: unknown;
      isPending: boolean;
      isRefetching?: boolean;
      refetch: (queryParams?: unknown) => Promise<void>;
    };

type SessionData = UseSessionAtomValue extends { data: infer D } ? D : unknown;

type Session = {
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    roleId: string;
    status: string;
    id: string;
    role: "user" | "admin" | "moderator";
  };
  session: {
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string;
    userAgent: string;
    userId: string;
    id: string;
  };
};

type AuthMode = "user" | "guest" | null;

type AuthStoreState = {
  session: SessionData;
  mode: AuthMode;
  isPending: boolean;
  isRefetching: boolean;
  error: unknown;
  initialized: boolean;

  init: () => Promise<void>;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
  setMode: (mode: AuthMode) => Promise<void>;
};

let unsubscribeSession: null | (() => void) = null;

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  session: null as SessionData,
  mode: null,
  isPending: true,
  isRefetching: false,
  error: null,
  initialized: false,

  init: async () => {
    if (get().initialized) return;

    // Load persisted mode
    try {
      const storedMode = await SecureStore.getItemAsync("auth_mode");
      if (storedMode === "guest" || storedMode === "user") {
        set({ mode: storedMode as AuthMode });
      }
    } catch (e) {
      console.error("Failed to load auth mode", e);
    }

    set({ initialized: true });

    // Subscribe once; nanostores will start fetching session automatically.
    unsubscribeSession = authClient.useSession.subscribe((value: any) => {
      set({
        session: value?.data ?? null,
        isPending: !!value?.isPending,
        isRefetching: !!value?.isRefetching,
        error: value?.error ?? null,
      });
    });
  },

  refetch: async () => {
    const atomValue: any = authClient.useSession.get();
    await atomValue?.refetch?.();
  },

  signOut: async () => {
    await authClient.signOut();
    await SecureStore.deleteItemAsync("auth_mode");
    set({ mode: null });
    // After signout, better-auth will toggle the session signal and refetch.
  },

  setMode: async (mode: AuthMode) => {
    set({ mode });
    if (mode) {
      await SecureStore.setItemAsync("auth_mode", mode);
    } else {
      await SecureStore.deleteItemAsync("auth_mode");
    }
  },
}));

export function useAuthSession() {
  const session = useAuthStore((s) => s.session as Session | null);
  const mode = useAuthStore((s) => s.mode);
  const isPending = useAuthStore((s) => s.isPending);
  const isRefetching = useAuthStore((s) => s.isRefetching);
  const error = useAuthStore((s) => s.error);
  const refetch = useAuthStore((s) => s.refetch);
  const init = useAuthStore((s) => s.init);
  const setMode = useAuthStore((s) => s.setMode);
  const signOut = useAuthStore((s) => s.signOut);

  // session from /get-session is typically `{ user, session }`.
  const user = (session as any)?.user ?? null;
  const sessionInfo = (session as any)?.session ?? null;
  const organization = (session as any)?.organization ?? null;
  const branch = (session as any)?.branch ?? null;
  const isAuthenticated = !!user;
  const isGuest = mode === "guest";

  return {
    init,
    session,
    user,
    sessionInfo,
    organization,
    branch,
    isAuthenticated,
    isGuest,
    mode,
    isPending,
    isRefetching,
    error,
    refetch,
    setMode,
    signOut,
  };
}

export function cleanupAuthStoreSubscription() {
  unsubscribeSession?.();
  unsubscribeSession = null;
}
