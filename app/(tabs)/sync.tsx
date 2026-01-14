import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  ProgressBar,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useFocusEffect } from "expo-router";

import PageHeader from "../../components/PageHeader";
import {
  useSyncStore,
  useNetwork,
  processQueue,
  retryFailedSync,
  getSyncQueueItems,
} from "../../lib/sync";
import {
  getPendingSyncValuations,
  getValuationById,
  type ValuationRow,
} from "../../lib/schema";
import { useAuthSession } from "../../lib/auth-store";

interface SyncItem {
  id: string;
  type: "valuation" | "image";
  title: string;
  subtitle: string;
  status: "pending" | "syncing" | "synced" | "error";
  errorMessage?: string;
}

export default function SyncScreen() {
  const theme = useTheme();
  const { sessionInfo } = useAuthSession();
  const { isOnline, checkConnection } = useNetwork();
  const {
    isSyncing,
    syncProgress,
    lastSyncedAt,
    pendingItems,
    failedItems,
    setPendingItems,
    setFailedItems,
  } = useSyncStore();

  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Load pending valuations
  const loadSyncItems = useCallback(async () => {
    try {
      const pendingValuations = await getPendingSyncValuations();
      const items: SyncItem[] = pendingValuations.map((v) => ({
        id: v.id,
        type: "valuation" as const,
        title: v.client_name || "Unknown Client",
        subtitle: v.present_property_address || "No address",
        status:
          v.sync_status === "syncing"
            ? "syncing"
            : v.sync_status === "error"
            ? "error"
            : "pending",
        errorMessage: v.error_message || undefined,
      }));
      setSyncItems(items);

      // Update store
      const queueItems = await getSyncQueueItems();
      setPendingItems(queueItems.filter((item) => item.status === "pending"));
      setFailedItems(queueItems.filter((item) => item.status === "failed"));
    } catch (error) {
      console.error("Failed to load sync items:", error);
    }
  }, [setPendingItems, setFailedItems]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadSyncItems();
      checkConnection();
    }, [loadSyncItems, checkConnection])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkConnection();
    await loadSyncItems();
    setRefreshing(false);
  }, [checkConnection, loadSyncItems]);

  // Handle sync
  const handleSync = useCallback(async () => {
    setSyncResult(null);
    const result = await processQueue(sessionInfo?.token);
    setSyncResult(result);
    await loadSyncItems();
  }, [sessionInfo?.token, loadSyncItems]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    setSyncResult(null);
    const result = await retryFailedSync(sessionInfo?.token);
    setSyncResult(result);
    await loadSyncItems();
  }, [sessionInfo?.token, loadSyncItems]);

  // Format last synced time
  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return "Never synced";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return theme.colors.primary;
      case "syncing":
        return theme.colors.tertiary;
      case "error":
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "synced":
        return "cloud-check";
      case "syncing":
        return "cloud-sync";
      case "error":
        return "cloud-alert";
      default:
        return "cloud-upload";
    }
  };

  const pendingCount = syncItems.filter((i) => i.status === "pending").length;
  const errorCount = syncItems.filter((i) => i.status === "error").length;

  const renderSyncItem = ({ item }: { item: SyncItem }) => (
    <Card style={styles.itemCard} mode="outlined">
      <Card.Content style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text variant="titleMedium" numberOfLines={1}>
            {item.title}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.outline }}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
          {item.errorMessage && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.error, marginTop: 4 }}
              numberOfLines={2}
            >
              {item.errorMessage}
            </Text>
          )}
        </View>
        <IconButton
          icon={getStatusIcon(item.status)}
          iconColor={getStatusColor(item.status)}
          size={24}
        />
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="cloud-check-outline"
        size={64}
        iconColor={theme.colors.primary}
      />
      <Text variant="titleMedium" style={{ marginTop: 8 }}>
        All synced!
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.outline, marginTop: 4 }}
      >
        No pending items to sync
      </Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <PageHeader title="Sync" />

      {/* Status Header */}
      <Surface style={styles.statusHeader} elevation={1}>
        <View style={styles.statusRow}>
          <Chip
            icon={isOnline ? "wifi" : "wifi-off"}
            mode="flat"
            style={{
              backgroundColor: isOnline
                ? theme.colors.primaryContainer
                : theme.colors.errorContainer,
            }}
            textStyle={{
              color: isOnline
                ? theme.colors.onPrimaryContainer
                : theme.colors.onErrorContainer,
            }}
          >
            {isOnline ? "Online" : "Offline"}
          </Chip>
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            {formatLastSynced(lastSyncedAt)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
              {pendingCount}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              Pending
            </Text>
          </View>
          <View style={styles.stat}>
            <Text
              variant="headlineMedium"
              style={{ fontWeight: "bold", color: theme.colors.error }}
            >
              {errorCount}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              Failed
            </Text>
          </View>
        </View>
      </Surface>

      {/* Sync Progress */}
      {isSyncing && (
        <Surface style={styles.progressSection} elevation={0}>
          <View style={styles.progressHeader}>
            <Text variant="bodyMedium">Syncing...</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {syncProgress.current} of {syncProgress.total}
            </Text>
          </View>
          <ProgressBar
            progress={
              syncProgress.total > 0
                ? syncProgress.current / syncProgress.total
                : 0
            }
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </Surface>
      )}

      {/* Sync Result */}
      {syncResult && !isSyncing && (
        <Surface
          style={[
            styles.resultSection,
            {
              backgroundColor:
                syncResult.failed > 0
                  ? theme.colors.errorContainer
                  : theme.colors.primaryContainer,
            },
          ]}
          elevation={0}
        >
          <Text
            variant="bodyMedium"
            style={{
              color:
                syncResult.failed > 0
                  ? theme.colors.onErrorContainer
                  : theme.colors.onPrimaryContainer,
            }}
          >
            {syncResult.synced > 0 && `${syncResult.synced} synced`}
            {syncResult.synced > 0 && syncResult.failed > 0 && " • "}
            {syncResult.failed > 0 && `${syncResult.failed} failed`}
          </Text>
        </Surface>
      )}

      <Divider style={{ marginVertical: 8 }} />

      {/* Pending Items List */}
      <View style={styles.listContainer}>
        <FlashList
          data={syncItems}
          renderItem={renderSyncItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 16 }}
        />
      </View>

      <Surface style={styles.actionButtons} elevation={2}>
        <Button
          mode="contained"
          icon="cloud-sync"
          onPress={handleSync}
          disabled={!isOnline || isSyncing || pendingCount === 0}
          loading={isSyncing}
          style={styles.syncButton}
        >
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Button>
        {errorCount > 0 && (
          <Button
            mode="outlined"
            icon="refresh"
            onPress={handleRetry}
            disabled={!isOnline || isSyncing}
            style={styles.retryButton}
          >
            Retry Failed
          </Button>
        )}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusHeader: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  stat: {
    alignItems: "center",
  },
  progressSection: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  resultSection: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
  },
  itemCard: {
    marginBottom: 8,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  actionButtons: {
    padding: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 120,
  },
  syncButton: {
    flex: 1,
  },
  retryButton: {
    flex: 1,
  },
});
