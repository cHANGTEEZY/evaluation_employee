import { StyleSheet, View, ScrollView, Alert } from "react-native";
import React, { useCallback, useState } from "react";

import {
  useTheme,
  Text,
  Card,
  Button,
  ProgressBar,
  IconButton,
  TouchableRipple,
} from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MenuDrawer from "../../components/MenuDrawer";
import { greeting } from "../../lib/greeting";
import EvaliationFAB from "../../components/EvaliationFAB";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getRecentValuations,
  getValuationsMetrics,
  ValuationRow,
} from "../../lib/schema";

const HomeScreen = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const theme = useTheme();
  const { session, isAuthenticated } = useAuthSession();
  const userName =
    isAuthenticated && session?.user?.name ? session.user.name : "Guest";

  const insets = useSafeAreaInsets();

  const [recentValuations, setRecentValuations] = useState<ValuationRow[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    synced: 0,
    total: 0,
  });

  // Fetch data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        // Fetch recent valuations
        const valuations = await getRecentValuations();
        setRecentValuations(valuations);

        // Fetch stats
        const metrics = await getValuationsMetrics();
        // Map database fields to UI labels: draft → pending, submitted → completed
        setStats({
          pending: metrics.submitted,
          synced: metrics.synced,
          total: metrics.total,
        });
      };

      fetchData();
    }, []),
  );

  // Helper function to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Helper function to get status display
  const getStatusDisplay = (status: string, syncStatus: string) => {
    if (syncStatus === "synced") return "Synced";
    if (status === "submitted") return "Completed";
    return "Pending";
  };

  // Handler for creating new evaluation with auth check
  const handleCreateEvaluation = () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Authentication Required",
        "You must be logged in to create evaluations. Please sign in first.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
      return;
    }
    router.push("/(pages)/EvaluationForm");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <MenuDrawer
        visible={drawerVisible}
        onDismiss={() => setDrawerVisible(false)}
      />

      <LinearGradient
        colors={[theme.colors.primaryContainer, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text variant="titleLarge" style={{ color: "white", opacity: 0.9 }}>
              {greeting()}
            </Text>
            <Text
              variant="headlineLarge"
              style={{
                fontWeight: "bold",
                color: "white",
                marginTop: 4,
                textTransform: "capitalize",
              }}
            >
              {userName}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: "white", opacity: 0.85, marginTop: 4 }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          <IconButton
            icon={drawerVisible ? "menu-open" : "menu"}
            iconColor={theme.colors.shadow}
            size={28}
            onPress={() => setDrawerVisible(!drawerVisible)}
            style={{ marginLeft: -8 }}
          />
        </View>

        {/* Quick Stats Summary in Header */}
        <View style={styles.headerStatsRow}>
          <View style={styles.headerStatItem}>
            <Text
              variant="headlineSmall"
              style={{ fontWeight: "bold", color: "white" }}
            >
              {stats.total}
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: "white", opacity: 0.85 }}
            >
              Total
            </Text>
          </View>

          <View style={styles.headerStatDivider} />

          <View style={styles.headerStatItem}>
            <Text
              variant="headlineSmall"
              style={{ fontWeight: "bold", color: "white" }}
            >
              {stats.pending}
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: "white", opacity: 0.85 }}
            >
              Pending
            </Text>
          </View>

          <View style={styles.headerStatDivider} />

          <View style={styles.headerStatItem}>
            <Text
              variant="headlineSmall"
              style={{ fontWeight: "bold", color: "white" }}
            >
              {stats.synced}
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: "white", opacity: 0.85 }}
            >
              Synced
            </Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollContent}>
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <Card
                style={[
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
                onPress={handleCreateEvaluation}
              >
                <Card.Content style={styles.quickActionContent}>
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={32}
                    color={theme.colors.onPrimaryContainer}
                  />
                  <Text
                    variant="labelLarge"
                    style={{
                      color: theme.colors.onPrimaryContainer,
                      marginTop: 8,
                      fontWeight: "600",
                    }}
                  >
                    Create
                  </Text>
                </Card.Content>
              </Card>

              <Card
                style={[
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
                onPress={() => router.push("/(tabs)/evaluations")}
              >
                <Card.Content style={styles.quickActionContent}>
                  <MaterialCommunityIcons
                    name="file-document-multiple"
                    size={32}
                    color={theme.colors.onSecondaryContainer}
                  />
                  <Text
                    variant="labelLarge"
                    style={{
                      color: theme.colors.onSecondaryContainer,
                      marginTop: 8,
                      fontWeight: "600",
                    }}
                  >
                    View All
                  </Text>
                </Card.Content>
              </Card>

              <Card
                style={[
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.tertiaryContainer },
                ]}
                onPress={() => router.push("/(tabs)/sync")}
              >
                <Card.Content style={styles.quickActionContent}>
                  <MaterialCommunityIcons
                    name="cloud-sync"
                    size={32}
                    color={theme.colors.onTertiaryContainer}
                  />
                  <Text
                    variant="labelLarge"
                    style={{
                      color: theme.colors.onTertiaryContainer,
                      marginTop: 8,
                      fontWeight: "600",
                    }}
                  >
                    Sync Data
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </View>

          <Card
            style={[
              styles.insightsCard,
              { borderColor: theme.colors.outlineVariant, borderWidth: 1 },
            ]}
            mode="outlined"
          >
            <Card.Content>
              <View style={styles.insightsHeader}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: "bold", marginLeft: 8 }}
                >
                  Productivity Insights
                </Text>
              </View>

              <View style={styles.insightsRow}>
                <View style={styles.insightItem}>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Completion Rate
                  </Text>
                  <Text
                    variant="headlineSmall"
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.primary,
                      marginTop: 4,
                    }}
                  >
                    {stats.total > 0
                      ? Math.round((stats.synced / stats.total) * 100)
                      : 0}
                    %
                  </Text>
                </View>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />

                <View style={styles.insightItem}>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Sync Status
                  </Text>
                  <Text
                    variant="headlineSmall"
                    style={{
                      fontWeight: "bold",
                      color:
                        stats.pending > 0
                          ? theme.colors.error
                          : theme.colors.tertiary,
                      marginTop: 4,
                    }}
                  >
                    {stats.pending > 0
                      ? `${stats.pending} Pending`
                      : "All Synced"}
                  </Text>
                </View>
              </View>

              {stats.total > 0 && (
                <>
                  <View
                    style={[
                      styles.progressBarContainer,
                      { marginTop: 16, marginBottom: 8 },
                    ]}
                  >
                    <ProgressBar
                      progress={stats.synced / stats.total}
                      color={theme.colors.primary}
                      style={{ height: 8, borderRadius: 4 }}
                    />
                  </View>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {stats.synced} of {stats.total} valuations synced to server
                  </Text>
                </>
              )}
            </Card.Content>
          </Card>

          <View style={styles.section}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Recent Activity
              </Text>
              <Button
                mode="text"
                onPress={() => router.push("/(tabs)/evaluations")}
              >
                See All
              </Button>
            </View>

            {recentValuations.length === 0 ? (
              <Card
                style={[
                  styles.activityCard,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Card.Content style={{ padding: 24, alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={48}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 12,
                    }}
                  >
                    No valuations yet. Create your first one!
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              recentValuations.map((item) => {
                const displayStatus = getStatusDisplay(
                  item.status,
                  item.sync_status,
                );
                return (
                  <Card
                    key={item.id}
                    style={[
                      styles.activityCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    mode="contained"
                  >
                    <TouchableRipple
                      onPress={() => {
                        router.push({
                          pathname: "/(pages)/EvaluationDetail",
                          params: { id: item.id },
                        });
                      }}
                      rippleColor={theme.colors.primary + "1A"}
                      style={{ flex: 1 }}
                    >
                      <View style={styles.activityContent}>
                        {/* Icon Box */}
                        <View
                          style={[
                            styles.iconBox,
                            { backgroundColor: theme.colors.elevation.level2 },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              displayStatus === "Pending"
                                ? "clock-outline"
                                : displayStatus === "Completed"
                                  ? "check-circle-outline"
                                  : "cloud-check"
                            }
                            size={24}
                            color={
                              displayStatus === "Pending"
                                ? theme.colors.error
                                : theme.colors.primary
                            }
                          />
                        </View>

                        {/* Text Info */}
                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <Text
                            variant="titleMedium"
                            style={{ fontWeight: "600" }}
                          >
                            {item.client_name || "Unnamed Valuation"}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            {item.present_property_address ||
                              item.property_address_deed ||
                              "No address"}
                          </Text>
                        </View>

                        {/* Status Badge & Date */}
                        <View style={{ alignItems: "flex-end" }}>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  displayStatus === "Pending"
                                    ? theme.colors.errorContainer
                                    : theme.colors.secondaryContainer,
                              },
                            ]}
                          >
                            <Text
                              variant="labelSmall"
                              style={{
                                color:
                                  displayStatus === "Pending"
                                    ? theme.colors.onErrorContainer
                                    : theme.colors.onSecondaryContainer,
                                fontWeight: "bold",
                              }}
                            >
                              {displayStatus}
                            </Text>
                          </View>
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              marginTop: 6,
                            }}
                          >
                            {getRelativeTime(item.created_at)}
                          </Text>
                        </View>
                      </View>
                    </TouchableRipple>
                  </Card>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <EvaliationFAB />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 20,
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statsCard: {
    flex: 1,
    height: 160,
    justifyContent: "center",
  },
  statsColumn: {
    flex: 1,
  },
  statsCardSmall: {
    flex: 1,
    justifyContent: "center",
  },
  smallCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCard: {
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
  },
  quickActionContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  insightsCard: {
    marginBottom: 24,
    backgroundColor: "transparent",
    borderRadius: 16,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  insightsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  insightItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  progressBarContainer: {
    width: "100%",
  },
  // Updated Styles for Recent Activity
  activityCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden", // Ensures the ripple effect is clipped to the card corners
  },
  activityContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16, // Padding moved inside the TouchableRipple
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
