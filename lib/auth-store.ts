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

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  session: null as SessionData,
  isPending: true,
  isRefetching: false,
  error: null,
  initialized: false,

  init: async () => {
    if (get().initialized) return;

    set({ initialized: true });

    // Set a timeout to stop pending state if auth takes too long
    const timeout = setTimeout(() => {
      if (get().isPending) {
        set({ isPending: false });
      }
    }, AUTH_TIMEOUT);

    // Subscribe once; nanostores will start fetching session automatically.
    unsubscribeSession = authClient.useSession.subscribe((value: any) => {
      clearTimeout(timeout);
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
    try {
      await authClient.signOut();
    } catch (e) {
      console.error("Sign out failed", e);
    }
  },
}));

/**
 * Provides reactive access to the current authentication session, derived values, status flags, and related actions.
 *
 * @returns An object with the following fields:
 * - `init` - Initializes the auth store; should be awaited by callers before relying on initial state.
 * - `session` - Raw session payload or `null` when no session exists.
 * - `user` - Authenticated user object or `null` if unauthenticated.
 * - `sessionInfo` - Session metadata (e.g., token, expiresAt) or `null` if unavailable.
 * - `organization` - Organization data from the session payload or `null`.
 * - `branch` - Branch data from the session payload or `null`.
 * - `isAuthenticated` - `true` if a `user` is present, `false` otherwise.
 * - `isPending` - `true` while initial session resolution is in progress, `false` otherwise.
 * - `isRefetching` - `true` when an active refetch of session data is in progress, `false` otherwise.
 * - `error` - Error encountered during session retrieval, or `null` if none.
 * - `refetch` - Function to trigger a session refetch.
 * - `signOut` - Function to sign out the current user.
 */
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