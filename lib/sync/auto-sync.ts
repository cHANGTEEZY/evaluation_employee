import { useEffect, useRef, useCallback } from "react";
import * as Network from "expo-network";
import { useSyncStore } from "./sync-store";
import { useSettingsStore } from "../settings-store";
import { processQueue } from "./sync-manager";
import { getPendingSyncValuations } from "../schema";
import { useAuthSession } from "../auth-store";
import { toast } from "burnt";

// Debounce delay to prevent multiple sync attempts
const AUTO_SYNC_DEBOUNCE_MS = 3000;

// Minimum interval between auto-syncs (5 minutes)
const MIN_AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Hook that monitors network connectivity and automatically syncs
 * when WiFi is connected (if enabled in settings)
 */
export function useAutoSync() {
  const { sessionInfo, isAuthenticated, user } = useAuthSession();
  const { isSyncing, setOnlineStatus } = useSyncStore();
  const { autoSyncEnabled, autoSyncOnWifiOnly } = useSettingsStore();

  const lastAutoSyncRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Function to check if auto-sync should run
  const checkAndTriggerAutoSync = useCallback(
    async (networkState: Network.NetworkState) => {
      // Guard checks
      if (!isMountedRef.current) return;
      if (!autoSyncEnabled) return;
      if (!isAuthenticated || !sessionInfo?.token) return;
      if (isSyncing) return;

      // Check network conditions
      const isConnected =
        networkState.isConnected && networkState.isInternetReachable !== false;
      if (!isConnected) return;

      // If WiFi-only is enabled, check network type
      if (
        autoSyncOnWifiOnly &&
        networkState.type !== Network.NetworkStateType.WIFI
      ) {
        console.log("[AutoSync] Skipping - WiFi only mode but not on WiFi");
        return;
      }

      // Check minimum interval
      const now = Date.now();
      if (now - lastAutoSyncRef.current < MIN_AUTO_SYNC_INTERVAL_MS) {
        console.log("[AutoSync] Skipping - too soon since last auto-sync");
        return;
      }

      // Check if there are pending items (current user only)
      const userId = user?.id ?? null;
      const pendingValuations = await getPendingSyncValuations(userId);
      if (pendingValuations.length === 0) {
        console.log("[AutoSync] No pending items to sync");
        return;
      }

      // All conditions met - trigger auto-sync
      console.log(
        `[AutoSync] Triggering auto-sync for ${pendingValuations.length} items`,
      );
      lastAutoSyncRef.current = now;

      // Show toast notification
      toast({
        title: "Auto-syncing...",
        message: `Syncing ${pendingValuations.length} pending item${pendingValuations.length > 1 ? "s" : ""}`,
        preset: "none",
      });

      // Run sync (current user's items only)
      const result = await processQueue(sessionInfo.token, userId);

      if (!isMountedRef.current) return;

      // Show result toast
      if (result.synced > 0 || result.failed > 0) {
        toast({
          title:
            result.failed > 0
              ? "Auto-sync completed with errors"
              : "Auto-sync complete",
          message:
            result.synced > 0
              ? `${result.synced} item${result.synced > 1 ? "s" : ""} synced${result.failed > 0 ? `, ${result.failed} failed` : ""}`
              : `${result.failed} item${result.failed > 1 ? "s" : ""} failed to sync`,
          preset: result.failed > 0 ? "error" : "done",
        });
      }
    },
    [
      autoSyncEnabled,
      autoSyncOnWifiOnly,
      isAuthenticated,
      sessionInfo?.token,
      isSyncing,
    ],
  );

  // Debounced network change handler
  const handleNetworkChange = useCallback(
    (networkState: Network.NetworkState) => {
      // Update online status
      const isConnected =
        networkState.isConnected && networkState.isInternetReachable !== false;
      setOnlineStatus(isConnected ?? false);

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the auto-sync check
      debounceTimerRef.current = setTimeout(() => {
        checkAndTriggerAutoSync(networkState);
      }, AUTO_SYNC_DEBOUNCE_MS);
    },
    [checkAndTriggerAutoSync, setOnlineStatus],
  );

  // Subscribe to network state changes
  useEffect(() => {
    isMountedRef.current = true;

    // Check initial network state
    const checkInitial = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        handleNetworkChange(networkState);
      } catch (error) {
        console.error(
          "[AutoSync] Error checking initial network state:",
          error,
        );
      }
    };
    checkInitial();

    // Subscribe to changes
    const subscription = Network.addNetworkStateListener(handleNetworkChange);

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleNetworkChange]);

  // Also trigger check when auto-sync setting is enabled
  useEffect(() => {
    if (autoSyncEnabled) {
      const checkNetwork = async () => {
        try {
          const networkState = await Network.getNetworkStateAsync();
          // Use a shorter debounce when setting is toggled
          setTimeout(() => {
            checkAndTriggerAutoSync(networkState);
          }, 1000);
        } catch (error) {
          console.error("[AutoSync] Error on setting change:", error);
        }
      };
      checkNetwork();
    }
  }, [autoSyncEnabled, checkAndTriggerAutoSync]);
}
