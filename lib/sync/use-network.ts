import { useEffect, useCallback } from "react";
import * as Network from "expo-network";
import { useSyncStore } from "./sync-store";

//* Hook to monitor network connectivity and update sync store
export function useNetwork() {
  const { isOnline, setOnlineStatus } = useSyncStore();

  const checkConnection = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected =
        networkState.isConnected && networkState.isInternetReachable !== false;
      setOnlineStatus(connected ?? false);
      return connected;
    } catch (error) {
      console.error("Failed to check network state:", error);
      setOnlineStatus(false);
      return false;
    }
  }, [setOnlineStatus]);

  useEffect(() => {
    // Check initial network state
    checkConnection();

    // Subscribe to network state changes
    const subscription = Network.addNetworkStateListener((state) => {
      const connected =
        state.isConnected && state.isInternetReachable !== false;
      setOnlineStatus(connected ?? false);
    });

    return () => {
      subscription.remove();
    };
  }, [checkConnection, setOnlineStatus]);

  return {
    isOnline,
    checkConnection,
  };
}
