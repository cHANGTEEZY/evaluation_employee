import type { Atom } from "nanostores";
import { create } from "zustand";
import { authClient } from "./auth-client";

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

type AuthStoreState = {
  session: SessionData;
  isPending: boolean;
  isRefetching: boolean;
  error: unknown;
  initialized: boolean;

  init: () => void;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
};

let unsubscribeSession: null | (() => void) = null;

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  session: null as SessionData,
  isPending: true,
  isRefetching: false,
  error: null,
  initialized: false,

  init: () => {
    if (get().initialized) return;

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
    // After signout, better-auth will toggle the session signal and refetch.
  },
}));

export function useAuthSession() {
  const session = useAuthStore((s) => s.session as Session | null);
  const isPending = useAuthStore((s) => s.isPending);
  const isRefetching = useAuthStore((s) => s.isRefetching);
  const error = useAuthStore((s) => s.error);
  const refetch = useAuthStore((s) => s.refetch);
  const init = useAuthStore((s) => s.init);

  // session from /get-session is typically `{ user, session }`.
  const user = (session as Session)?.user ?? null;
  const sessionInfo = (session as Session)?.session ?? null;
  const isAuthenticated = !!user;

  return {
    init,
    session,
    user,
    sessionInfo,
    isAuthenticated,
    isPending,
    isRefetching,
    error,
    refetch,
  };
}

export function cleanupAuthStoreSubscription() {
  unsubscribeSession?.();
  unsubscribeSession = null;
}
