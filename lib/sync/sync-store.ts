import { create } from "zustand";
export interface SyncQueueItem {
    id: string;
    entityType: "valuation" | "image";
    entityId: string;
    action: "create" | "update" | "delete";
    status: "pending" | "in_progress" | "completed" | "failed";
    attempts: number;
    lastAttemptAt: string | null;
    errorMessage: string | null;
}
export interface SyncState {
    isOnline: boolean;
    isSyncing: boolean;
    syncProgress: {
        current: number;
        total: number;
    };
    lastSyncedAt: string | null;
    pendingItems: SyncQueueItem[];
    failedItems: SyncQueueItem[];
    setOnlineStatus: (isOnline: boolean) => void;
    startSync: () => void;
    stopSync: () => void;
    updateProgress: (current: number, total: number) => void;
    setLastSyncedAt: (timestamp: string) => void;
    setPendingItems: (items: SyncQueueItem[]) => void;
    setFailedItems: (items: SyncQueueItem[]) => void;
    reset: () => void;
}
const initialState = {
    isOnline: true,
    isSyncing: false,
    syncProgress: { current: 0, total: 0 },
    lastSyncedAt: null,
    pendingItems: [],
    failedItems: [],
};
export const useSyncStore = create<SyncState>((set) => ({
    ...initialState,
    setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
    startSync: () => set({
        isSyncing: true,
        syncProgress: { current: 0, total: 0 },
    }),
    stopSync: () => set({ isSyncing: false }),
    updateProgress: (current: number, total: number) => set({ syncProgress: { current, total } }),
    setLastSyncedAt: (timestamp: string) => set({ lastSyncedAt: timestamp }),
    setPendingItems: (items: SyncQueueItem[]) => set({ pendingItems: items }),
    setFailedItems: (items: SyncQueueItem[]) => set({ failedItems: items }),
    reset: () => set(initialState),
}));
