import type { Atom } from "nanostores";
import { create } from "zustand";
import { authClient } from "./auth-client";
import * as SecureStore from "expo-secure-store";

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

type AuthStoreState = {
  session: SessionData;
  isPending: boolean;
  isRefetching: boolean;
  error: unknown;
  initialized: boolean;

  init: () => Promise<void>;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
};

let unsubscribeSession: null | (() => void) = null;

const AUTH_TIMEOUT = 5000; // 5 seconds max to wait for session
const PERSISTED_SESSION_KEY = "evaluationapp_persisted_session";

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  session: null as SessionData,
  isPending: true,
  isRefetching: false,
  error: null,
  initialized: false,

  init: async () => {
    if (get().initialized) return;

    set({ initialized: true });

    // Try to restore last known session from SecureStore so we can stay
    // \"signed in\" when offline or before the first network request completes.
    try {
      const raw = await SecureStore.getItemAsync(PERSISTED_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionData;
        if (parsed && !get().session) {
          set({ session: parsed });
        }
      }
    } catch (e) {
      console.error("Failed to restore persisted auth session", e);
    }

    // Set a timeout to stop pending state if auth takes too long
    const timeout = setTimeout(() => {
      if (get().isPending) {
        set({ isPending: false });
      }
    }, AUTH_TIMEOUT);

    // Subscribe once; nanostores will start fetching session automatically.
    unsubscribeSession = authClient.useSession.subscribe((value: any) => {
      clearTimeout(timeout);

      const isPending = !!value?.isPending;
      let nextSession: SessionData = get().session;

      // When we get fresh data, always trust it and persist it.
      if (value?.data) {
        nextSession = value.data as SessionData;
      } else if (!isPending) {
        // Only treat \"no data\" as a real sign-out once the request finished.
        if (!value?.error || (value.error as any)?.status === 401) {
          // No error (clean unauthenticated) or explicit 401 -> clear session.
          nextSession = null as SessionData;
        } else {
          // Network / other errors after the request finished:
          // keep whatever session we already have so the user stays signed in
          // when offline.
        }
      }

      set({
        session: nextSession,
        isPending,
        isRefetching: !!value?.isRefetching,
        error: value?.error ?? null,
      });

      // Persist or clear the session asynchronously
      (async () => {
        try {
          if (nextSession) {
            await SecureStore.setItemAsync(
              PERSISTED_SESSION_KEY,
              JSON.stringify(nextSession),
            );
          } else if (!isPending && (!value?.error || (value.error as any)?.status === 401)) {
            await SecureStore.deleteItemAsync(PERSISTED_SESSION_KEY);
          }
        } catch (err) {
          console.error("Failed to update persisted auth session", err);
        }
      })();
    });
  },

  refetch: async () => {
    const atomValue: any = authClient.useSession.get();
    await atomValue?.refetch?.();
  },

  signOut: async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.error("Sign out failed", e);
    }
    // Clear in-memory and persisted session immediately on sign-out
    set({ session: null as SessionData });
    try {
      await SecureStore.deleteItemAsync(PERSISTED_SESSION_KEY);
    } catch (e) {
      console.error("Failed to clear persisted auth session", e);
    }
  },
}));

export function useAuthSession() {
  const session = useAuthStore((s) => s.session as Session | null);
  const isPending = useAuthStore((s) => s.isPending);
  const isRefetching = useAuthStore((s) => s.isRefetching);
  const error = useAuthStore((s) => s.error);
  const refetch = useAuthStore((s) => s.refetch);
  const init = useAuthStore((s) => s.init);
  const signOut = useAuthStore((s) => s.signOut);

  // session from /get-session is typically `{ user, session }`.
  const user = (session as any)?.user ?? null;
  const sessionInfo = (session as any)?.session ?? null;
  const organization = (session as any)?.organization ?? null;
  const branch = (session as any)?.branch ?? null;
  const isAuthenticated = !!user;

  return {
    init,
    session,
    user,
    sessionInfo,
    organization,
    branch,
    isAuthenticated,
    isPending,
    isRefetching,
    error,
    refetch,
    signOut,
  };
}

export function cleanupAuthStoreSubscription() {
  unsubscribeSession?.();
  unsubscribeSession = null;
}
