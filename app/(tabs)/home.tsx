import { StyleSheet, View, ScrollView } from "react-native";
import React, { useState } from "react";

import {
  useTheme,
  Text,
  Card,
  Button,
  Avatar,
  ProgressBar,
  Surface,
  IconButton,
  Searchbar,
  FAB,
  Portal,
} from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MenuDrawer from "../../components/MenuDrawer";
import { greeting } from "../../lib/greeting";
import EvaliationFAB from "../../components/EvaliationFAB";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const stats = {
  pending: 3,
  completed: 12,
  synced: 10,
  total: 15,
};

const recentActivity = [
  {
    id: "1",
    title: "Valuation #1023",
    address: "123 Main St, Springfield",
    status: "Pending",
    date: "2 hours ago",
  },
  {
    id: "2",
    title: "Valuation #1022",
    address: "456 Oak Ave, Shelbyville",
    status: "Completed",
    date: "Yesterday",
  },
  {
    id: "3",
    title: "Valuation #1021",
    address: "789 Pine Ln, Capital City",
    status: "Synced",
    date: "2 days ago",
  },
];

const HomeScreen = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const theme = useTheme();
  const { session } = useAuthSession();
  const userName = session?.user?.name || "User";

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <MenuDrawer
        visible={drawerVisible}
        onDismiss={() => setDrawerVisible(false)}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.colors.primaryContainer, theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientHeader, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1, marginLeft: 8, flexDirection: "row" }}>
              <View>
                <Text variant="titleMedium" style={{ color: "white" }}>
                  {greeting()}
                </Text>
                <Text
                  variant="headlineSmall"
                  style={{ fontWeight: "bold", color: "white" }}
                >
                  {userName}
                </Text>
              </View>
            </View>

            <IconButton
              icon={drawerVisible ? "menu-open" : "menu"}
              iconColor={theme.colors.shadow}
              size={28}
              onPress={() => setDrawerVisible(!drawerVisible)}
              style={{ marginLeft: -8 }}
            />
          </View>

          <Searchbar
            placeholder="Search valuations..."
            value={""}
            onChange={() => ""}
          />
        </LinearGradient>

        <View style={styles.scrollContent}>
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Overview
            </Text>
            <View style={styles.statsGrid}>
              <Card
                style={[
                  styles.statsCard,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
                onPress={() => router.push("/(tabs)/evaluations")}
              >
                <Card.Content>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={28}
                    color={theme.colors.onPrimaryContainer}
                  />
                  <Text
                    variant="displaySmall"
                    style={{
                      marginTop: 8,
                      color: theme.colors.onPrimaryContainer,
                      fontWeight: "bold",
                    }}
                  >
                    {stats.pending}
                  </Text>
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.onPrimaryContainer }}
                  >
                    Pending
                  </Text>
                </Card.Content>
              </Card>

              <View style={styles.statsColumn}>
                <Card
                  style={[
                    styles.statsCardSmall,
                    {
                      backgroundColor: theme.colors.secondaryContainer,
                      marginBottom: 12,
                    },
                  ]}
                  onPress={() => {}}
                >
                  <Card.Content style={styles.smallCardContent}>
                    <View>
                      <Text
                        variant="titleLarge"
                        style={{
                          fontWeight: "bold",
                          color: theme.colors.onSecondaryContainer,
                        }}
                      >
                        {stats.completed}
                      </Text>
                      <Text
                        variant="labelMedium"
                        style={{ color: theme.colors.onSecondaryContainer }}
                      >
                        Completed
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={24}
                      color={theme.colors.onSecondaryContainer}
                    />
                  </Card.Content>
                </Card>

                <Card
                  style={[
                    styles.statsCardSmall,
                    { backgroundColor: theme.colors.tertiaryContainer },
                  ]}
                  onPress={() => router.push("/(tabs)/sync")}
                >
                  <Card.Content style={styles.smallCardContent}>
                    <View>
                      <Text
                        variant="titleLarge"
                        style={{
                          fontWeight: "bold",
                          color: theme.colors.onTertiaryContainer,
                        }}
                      >
                        {stats.synced}
                      </Text>
                      <Text
                        variant="labelMedium"
                        style={{ color: theme.colors.onTertiaryContainer }}
                      >
                        Synced
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="cloud-check-outline"
                      size={24}
                      color={theme.colors.onTertiaryContainer}
                    />
                  </Card.Content>
                </Card>
              </View>
            </View>
          </View>

          {/* Progress Section */}
          <Card
            style={[
              styles.progressCard,
              { borderColor: theme.colors.outlineVariant, borderWidth: 1 },
            ]}
            mode="outlined"
          >
            <Card.Content>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                  Daily Goal
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.primary }}
                >
                  {stats.completed}/{stats.total}
                </Text>
              </View>
              <ProgressBar
                progress={stats.completed / stats.total}
                color={theme.colors.primary}
                style={{ height: 8, borderRadius: 4 }}
              />
              <Text
                variant="bodySmall"
                style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}
              >
                You're 80% done with your assigned valuations for today. Keep it
                up!
              </Text>
            </Card.Content>
          </Card>

          {/* Recent Activity */}
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

            {recentActivity.map((item) => (
              <Card
                key={item.id}
                style={styles.activityCard}
                mode="contained"
                onPress={() => {}}
              >
                <Card.Content style={styles.activityContent}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        item.status === "Pending"
                          ? "clock-outline"
                          : item.status === "Completed"
                          ? "check-circle-outline"
                          : "cloud-check"
                      }
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                      {item.title}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {item.address}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: "bold",
                      }}
                    >
                      {item.status}
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginTop: 4,
                      }}
                    >
                      {item.date}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
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
  scrollContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    height: 50,
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
  activityCard: {
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  activityContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
