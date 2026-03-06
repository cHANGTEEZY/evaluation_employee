import { useCallback, useState } from "react";
import { StyleSheet, View, RefreshControl, ScrollView } from "react-native";

import {
  Button,
  Card,
  Divider,
  ProgressBar,
  Surface,
  Text,
  useTheme,
  TouchableRipple,
} from "react-native-paper";
import { useFocusEffect, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useSyncStore,
  useNetwork,
  processQueue,
  retryFailedSync,
  getSyncQueueItems,
} from "../../lib/sync";
import {
  getPendingSyncValuations,
  getFailedSyncValuations,
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
  createdAt?: string;
}

export default function SyncScreen() {
  const theme = useTheme();
  const { sessionInfo, isAuthenticated, user, branch } = useAuthSession();
  const { isOnline, checkConnection } = useNetwork();
  const insets = useSafeAreaInsets();
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

  // Employee without branch cannot sync (proactive check when session has role/branch)
  const isEmployeeWithoutBranch =
    isAuthenticated &&
    (user as { role?: string } | null)?.role === "user" &&
    !branch;

  // Load pending and failed valuations (current user only; empty when logged out)
  const loadSyncItems = useCallback(async () => {
    try {
      const userId = user?.id ?? null;
      const pendingValuations = await getPendingSyncValuations(userId);
      const failedValuations = await getFailedSyncValuations(userId);

      // Combine pending and failed valuations
      const allValuations = [...pendingValuations, ...failedValuations];

      const items: SyncItem[] = allValuations.map((v) => ({
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
        createdAt: v.created_at,
      }));
      setSyncItems(items);

      // Update store
      const queueItems = await getSyncQueueItems();
      setPendingItems(queueItems.filter((item) => item.status === "pending"));
      setFailedItems(queueItems.filter((item) => item.status === "failed"));
    } catch (error) {
      console.error("Failed to load sync items:", error);
    }
  }, [setPendingItems, setFailedItems, user?.id]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadSyncItems();
      checkConnection();
    }, [loadSyncItems, checkConnection]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkConnection();
    await loadSyncItems();
    setRefreshing(false);
  }, [checkConnection, loadSyncItems]);

  const handleSync = useCallback(async () => {
    // Check if user is authenticated before syncing
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    if (isEmployeeWithoutBranch) return;
    setSyncResult(null);
    const result = await processQueue(sessionInfo?.token, user?.id);
    setSyncResult(result);
    await loadSyncItems();
  }, [
    sessionInfo?.token,
    loadSyncItems,
    isAuthenticated,
    isEmployeeWithoutBranch,
    user?.id,
  ]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    // Check if user is authenticated before retrying
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    if (isEmployeeWithoutBranch) return;
    setSyncResult(null);
    const result = await retryFailedSync(sessionInfo?.token, user?.id);
    setSyncResult(result);
    await loadSyncItems();
  }, [
    sessionInfo?.token,
    loadSyncItems,
    isAuthenticated,
    isEmployeeWithoutBranch,
    user?.id,
  ]);

  // Format last synced time (helper)
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return "Never synced";
    return formatTimeAgo(new Date(timestamp).getTime());
  };

  const pendingCount = syncItems.filter((i) => i.status === "pending").length;
  const errorCount = syncItems.filter((i) => i.status === "error").length;

  const renderSyncItem = ({ item }: { item: SyncItem }) => {
    const isError = item.status === "error";
    const isSyncingItem = item.status === "syncing";

    return (
      <Card style={styles.itemCard} mode="elevated" elevation={1}>
        <View style={styles.itemContent}>
          {/* Icon Box */}
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isError
                  ? "#FEE2E2"
                  : isSyncingItem
                    ? "#DBEAFE"
                    : "#E0E7FF",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                isError
                  ? "cloud-alert"
                  : isSyncingItem
                    ? "cloud-sync"
                    : "cloud-upload"
              }
              size={28}
              color={
                isError ? "#DC2626" : isSyncingItem ? "#2563EB" : "#6366F1"
              }
            />
          </View>

          {/* Text Info */}
          <View style={styles.itemInfo}>
            <Text variant="titleMedium" style={styles.itemTitle}>
              {item.title}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={theme.colors.onSurfaceVariant}
                style={{ marginRight: 4 }}
              />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </View>
            {item.errorMessage && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={14}
                  color="#DC2626"
                  style={{ marginRight: 4 }}
                />
                <Text
                  variant="labelSmall"
                  style={{ color: "#DC2626", flex: 1 }}
                  numberOfLines={1}
                >
                  {item.errorMessage}
                </Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isError
                    ? "#DC2626"
                    : isSyncingItem
                      ? "#2563EB"
                      : "#10B981",
                },
              ]}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 11,
                }}
              >
                {isError ? "Failed" : isSyncingItem ? "Syncing" : "Ready"}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIconBox,
          { backgroundColor: theme.colors.secondaryContainer },
        ]}
      >
        <MaterialCommunityIcons
          name="cloud-check-outline"
          size={56}
          color={theme.colors.onSecondaryContainer}
        />
      </View>
      <Text
        variant="headlineSmall"
        style={{ marginTop: 16, fontWeight: "bold" }}
      >
        All Synced!
      </Text>
      <Text
        variant="bodyMedium"
        style={{
          color: theme.colors.onSurfaceVariant,
          marginTop: 8,
          textAlign: "center",
          maxWidth: 280,
          lineHeight: 20,
        }}
      >
        You have no pending items to sync. Everything is up to date with the
        server.
      </Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={[theme.colors.primaryContainer, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text
              variant="labelLarge"
              style={{
                color: "rgba(255,255,255,0.9)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Sync Manager
            </Text>
            <Text
              variant="headlineSmall"
              style={{
                fontWeight: "700",
                color: "white",
                marginTop: 6,
                letterSpacing: -0.3,
              }}
            >
              Data Synchronization
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOnline ? "#4CAF50" : theme.colors.error,
              },
            ]}
          />
        </View>

        {/* Stats in Header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text
              variant="headlineMedium"
              style={{ fontWeight: "bold", color: "white" }}
            >
              {pendingCount}
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: "white", opacity: 0.85, marginTop: 4 }}
            >
              Pending
            </Text>
          </View>

          <View style={styles.headerStatDivider} />

          <View style={styles.headerStatItem}>
            <Text
              variant="headlineMedium"
              style={{
                fontWeight: "bold",
                color: errorCount > 0 ? "#FF6B6B" : "white",
              }}
            >
              {errorCount}
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: "white", opacity: 0.85, marginTop: 4 }}
            >
              Failed
            </Text>
          </View>

          <View style={styles.headerStatDivider} />

          <View style={styles.headerStatItem}>
            <MaterialCommunityIcons
              name={isOnline ? "wifi" : "wifi-off"}
              size={28}
              color="white"
            />
            <Text
              variant="labelMedium"
              style={{ color: "white", opacity: 0.85, marginTop: 4 }}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Last Synced Info */}
        {/* <View style={styles.lastSyncedContainer}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color="white"
            style={{ opacity: 0.7 }}
          />
          <Text
            variant="labelMedium"
            style={{ color: "white", opacity: 0.7, marginLeft: 6 }}
          >
            Last synced: {formatLastSynced(lastSyncedAt)}
          </Text>
        </View> */}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {isEmployeeWithoutBranch && (
            <Card
              style={[styles.resultBanner, { backgroundColor: "#FEF3C7" }]}
              mode="elevated"
              elevation={0}
            >
              <Card.Content style={{ paddingVertical: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={24}
                    color="#92400E"
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: "#92400E", flex: 1 }}
                  >
                    Ask your admin to assign you to a branch to sync valuations.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {isSyncing && (
            <Surface style={styles.progressCard} elevation={1}>
              <View style={styles.progressHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="sync"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                    Syncing Data...
                  </Text>
                </View>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary, fontWeight: "bold" }}
                >
                  {Math.round(
                    (syncProgress.total > 0
                      ? syncProgress.current / syncProgress.total
                      : 0) * 100,
                  )}
                  %
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
              <Text
                variant="bodySmall"
                style={{
                  marginTop: 8,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                {syncProgress.current} of {syncProgress.total} items processed
              </Text>
            </Surface>
          )}

          {/* Sync Result Banner */}
          {syncResult && !isSyncing && (
            <Card
              style={[
                styles.resultBanner,
                {
                  backgroundColor:
                    syncResult.failed > 0 ? "#FEE2E2" : "#D1FAE5",
                },
              ]}
              mode="elevated"
              elevation={0}
            >
              <Card.Content style={{ paddingVertical: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        syncResult.failed > 0 ? "#DC2626" : "#10B981",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={
                        syncResult.failed > 0 ? "alert-circle-outline" : "check"
                      }
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="titleSmall"
                      style={{
                        color: syncResult.failed > 0 ? "#7F1D1D" : "#065F46",
                        fontWeight: "600",
                        marginBottom: 2,
                      }}
                    >
                      {syncResult.failed > 0
                        ? "Sync Failed"
                        : "Sync Successful"}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: syncResult.failed > 0 ? "#991B1B" : "#047857",
                      }}
                    >
                      {syncResult.synced > 0 &&
                        `${syncResult.synced} item${
                          syncResult.synced > 1 ? "s" : ""
                        } synced`}
                      {syncResult.failed > 0 &&
                        `${syncResult.synced > 0 ? ", " : ""}${
                          syncResult.failed
                        } item${syncResult.failed > 1 ? "s" : ""} failed`}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {errorCount > 0 && (
              <Button
                mode="elevated"
                onPress={handleRetry}
                disabled={!isOnline || isSyncing || isEmployeeWithoutBranch}
                textColor={theme.colors.error}
                style={{
                  flex: 1,
                  marginRight: 12,
                  borderRadius: 14,
                }}
                contentStyle={{ height: 48 }}
                labelStyle={{ fontWeight: "600" }}
                icon="refresh"
              >
                Retry Failed
              </Button>
            )}
            <Button
              mode="contained"
              icon={isSyncing ? undefined : "cloud-sync"}
              onPress={handleSync}
              disabled={
                !isOnline ||
                isSyncing ||
                pendingCount === 0 ||
                isEmployeeWithoutBranch
              }
              loading={isSyncing}
              style={{
                flex: 1,
                borderRadius: 14,
              }}
              contentStyle={{ height: 48 }}
              labelStyle={{ fontWeight: "700", fontSize: 15 }}
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </View>

          {/* Section Title */}
          {syncItems.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Sync Queue
              </Text>
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {syncItems.length} item{syncItems.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}

          {/* Sync Items List */}
          {syncItems.length > 0
            ? syncItems.map((item) => (
                <View key={item.id}>{renderSyncItem({ item })}</View>
              ))
            : renderEmptyState()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  headerStatItem: {
    flex: 1,
    alignItems: "center",
  },
  headerStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  lastSyncedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  content: {
    padding: 16,
  },
  progressCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  resultBanner: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  itemCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  itemTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusBadgeContainer: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 65,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBarGradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 24,
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
