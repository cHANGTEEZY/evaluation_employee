import { useEffect, useRef, useCallback } from "react";
import * as Network from "expo-network";
import { useSyncStore } from "./sync-store";
import { useSettingsStore } from "../settings-store";
import { processQueue } from "./sync-manager";
import { getPendingSyncValuations } from "../schema";
import { useAuthSession } from "../auth-store";
import { toast } from "burnt";
const AUTO_SYNC_DEBOUNCE_MS = 3000;
const MIN_AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
export function useAutoSync() {
    const { sessionInfo, isAuthenticated, user } = useAuthSession();
    const { isSyncing, setOnlineStatus } = useSyncStore();
    const { autoSyncEnabled, autoSyncOnWifiOnly } = useSettingsStore();
    const lastAutoSyncRef = useRef<number>(0);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);
    const checkAndTriggerAutoSync = useCallback(async (networkState: Network.NetworkState) => {
        if (!isMountedRef.current)
            return;
        if (!autoSyncEnabled)
            return;
        if (!isAuthenticated || !sessionInfo?.token)
            return;
        if (isSyncing)
            return;
        const isConnected = networkState.isConnected && networkState.isInternetReachable !== false;
        if (!isConnected)
            return;
        if (autoSyncOnWifiOnly &&
            networkState.type !== Network.NetworkStateType.WIFI) {
            console.log("[AutoSync] Skipping - WiFi only mode but not on WiFi");
            return;
        }
        const now = Date.now();
        if (now - lastAutoSyncRef.current < MIN_AUTO_SYNC_INTERVAL_MS) {
            console.log("[AutoSync] Skipping - too soon since last auto-sync");
            return;
        }
        const userId = user?.id ?? null;
        const pendingValuations = await getPendingSyncValuations(userId);
        if (pendingValuations.length === 0) {
            console.log("[AutoSync] No pending items to sync");
            return;
        }
        console.log(`[AutoSync] Triggering auto-sync for ${pendingValuations.length} items`);
        lastAutoSyncRef.current = now;
        toast({
            title: "Auto-syncing...",
            message: `Syncing ${pendingValuations.length} pending item${pendingValuations.length > 1 ? "s" : ""}`,
            preset: "none",
        });
        const result = await processQueue(sessionInfo.token, userId);
        if (!isMountedRef.current)
            return;
        if (result.synced > 0 || result.failed > 0) {
            toast({
                title: result.failed > 0
                    ? "Auto-sync completed with errors"
                    : "Auto-sync complete",
                message: result.synced > 0
                    ? `${result.synced} item${result.synced > 1 ? "s" : ""} synced${result.failed > 0 ? `, ${result.failed} failed` : ""}`
                    : `${result.failed} item${result.failed > 1 ? "s" : ""} failed to sync`,
                preset: result.failed > 0 ? "error" : "done",
            });
        }
    }, [
        autoSyncEnabled,
        autoSyncOnWifiOnly,
        isAuthenticated,
        sessionInfo?.token,
        isSyncing,
    ]);
    const handleNetworkChange = useCallback((networkState: Network.NetworkState) => {
        const isConnected = networkState.isConnected && networkState.isInternetReachable !== false;
        setOnlineStatus(isConnected ?? false);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            checkAndTriggerAutoSync(networkState);
        }, AUTO_SYNC_DEBOUNCE_MS);
    }, [checkAndTriggerAutoSync, setOnlineStatus]);
    useEffect(() => {
        isMountedRef.current = true;
        const checkInitial = async () => {
            try {
                const networkState = await Network.getNetworkStateAsync();
                handleNetworkChange(networkState);
            }
            catch (error) {
                console.error("[AutoSync] Error checking initial network state:", error);
            }
        };
        checkInitial();
        const subscription = Network.addNetworkStateListener(handleNetworkChange);
        return () => {
            isMountedRef.current = false;
            subscription.remove();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [handleNetworkChange]);
    useEffect(() => {
        if (autoSyncEnabled) {
            const checkNetwork = async () => {
                try {
                    const networkState = await Network.getNetworkStateAsync();
                    setTimeout(() => {
                        checkAndTriggerAutoSync(networkState);
                    }, 1000);
                }
                catch (error) {
                    console.error("[AutoSync] Error on setting change:", error);
                }
            };
            checkNetwork();
        }
    }, [autoSyncEnabled, checkAndTriggerAutoSync]);
}
