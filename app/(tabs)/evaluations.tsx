import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useTheme, List, Text, Card, Searchbar } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import PageHeader from "../../components/PageHeader";
import { FlashList } from "@shopify/flash-list";
import PillFilter from "../../components/PillFilter";
import { useState, useMemo, useCallback } from "react";
import MenuDrawer from "../../components/MenuDrawer";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "react-native-paper";
import {
  getAllValuations,
  ValuationRow,
  seedDummyValuation,
} from "../../lib/schema";

type Status = "Draft" | "Pending" | "submitted" | "Synced";

// Helper function to get status display
const getStatusDisplay = (status: string, syncStatus: string): Status => {
  if (status === "draft") return "Draft";
  if (syncStatus === "synced") return "Synced";
  if (status === "submitted") return "submitted";
  return "Pending";
};

export default function EvaluationsScreen() {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [valuations, setValuations] = useState<ValuationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthSession();

  const refetchValuations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllValuations(user?.id ?? null);
      setValuations(data);
    } catch (error) {
      console.error("Error fetching valuations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch valuations whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchValuations();
    }, [refetchValuations])
  );

  const handleSeedDummy = useCallback(async () => {
    try {
      await seedDummyValuation({ employeeId: user?.id });
      await refetchValuations();
    } catch (error) {
      console.error("Seed dummy failed:", error);
    }
  }, [refetchValuations, user?.id]);

  // Filter and search valuations
  const filteredData = useMemo(() => {
    let filtered = valuations;

    // Filter by status (Draft = status 'draft'; others by display status)
    if (selectedFilter !== "All") {
      filtered = filtered.filter((item) => {
        const displayStatus = getStatusDisplay(item.status, item.sync_status);
        return displayStatus === selectedFilter;
      });
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((item) => {
        const clientName = item.client_name?.toLowerCase() || "";
        const address =
          item.present_property_address?.toLowerCase() ||
          item.property_address_deed?.toLowerCase() ||
          "";
        const refNo = item.ref_no?.toLowerCase() || "";
        return (
          clientName.includes(searchLower) ||
          address.includes(searchLower) ||
          refNo.includes(searchLower)
        );
      });
    }

    return filtered;
  }, [valuations, selectedFilter, searchText]);

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <LinearGradient
        colors={[theme.colors.secondaryContainer, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text
              variant="headlineSmall"
              style={{
                color: "white",
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              Evaluations
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: "rgba(255,255,255,0.9)",
                marginTop: 4,
                letterSpacing: 0.2,
              }}
            >
              View and manage your evaluations
            </Text>
          </View>
          {__DEV__ && (
            <IconButton
              icon="test-tube"
              iconColor="white"
              size={22}
              onPress={handleSeedDummy}
              style={{ margin: 0 }}
            />
          )}
          <IconButton
            icon="menu"
            iconColor="white"
            size={24}
            onPress={() => setDrawerVisible(true)}
            style={{ margin: 0 }}
          />
        </View>

        <Searchbar
          placeholder="Search valuations..."
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
          iconColor={theme.colors.onSurfaceVariant}
          inputStyle={{ color: theme.colors.onSurface, fontSize: 15 }}
          traileringIcon={searchText ? "close" : ""}
          onTraileringIconPress={() => setSearchText("")}
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
            },
          ]}
          elevation={0}
        />
      </LinearGradient>

      <MenuDrawer
        visible={drawerVisible}
        onDismiss={() => setDrawerVisible(false)}
      />

      <View style={{ marginTop: 16 }}>
        <PillFilter
          filters={[
            {
              icon: "filter-variant",
              name: "All",
              onPress: () => setSelectedFilter("All"),
              selected: selectedFilter === "All",
            },
            {
              icon: "file-document-edit-outline",
              name: "Draft",
              onPress: () => setSelectedFilter("Draft"),
              selected: selectedFilter === "Draft",
            },
            {
              icon: "clock-outline",
              name: "Pending",
              onPress: () => setSelectedFilter("Pending"),
              selected: selectedFilter === "Pending",
            },
            {
              icon: "check-circle-outline",
              name: "Submitted",
              onPress: () => setSelectedFilter("submitted"),
              selected: selectedFilter === "submitted",
            },
            {
              icon: "cloud-check-outline",
              name: "Synced",
              onPress: () => setSelectedFilter("Synced"),
              selected: selectedFilter === "Synced",
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ marginHorizontal: 20, marginVertical: 16 }}>
          <Text
            variant="titleMedium"
            style={{
              color: theme.colors.onSurface,
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {selectedFilter} Valuations
            <Text style={{ color: theme.colors.outline }}>
              {" "}
              ({filteredData.length})
            </Text>
          </Text>
        </View>

        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text>Loading valuations...</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={[
                styles.emptyStateIcon,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <MaterialCommunityIcons
                name="clipboard-text-search-outline"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSurface,
                marginTop: 16,
                fontWeight: "600",
              }}
            >
              No valuations found
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {!isAuthenticated
                ? "Log in to see your valuations"
                : searchText
                  ? `No results matching "${searchText}"`
                  : `You don't have any ${selectedFilter.toLowerCase()} valuations yet.`}
            </Text>
          </View>
        ) : (
          <FlashList
            data={filteredData}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const displayStatus = getStatusDisplay(
                item.status,
                item.sync_status
              );
              return (
                <Card
                  mode="elevated"
                  elevation={0}
                  style={styles.cardItem}
                  onPress={() =>
                    router.push({
                      pathname: "/(pages)/EvaluationDetail",
                      params: { id: item.id },
                    })
                  }
                >
                  <View style={styles.cardContent}>
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor:
                            displayStatus === "Draft"
                              ? theme.colors.surfaceVariant
                              : displayStatus === "Pending"
                              ? theme.colors.errorContainer
                              : displayStatus === "submitted"
                              ? theme.colors.primaryContainer
                              : theme.colors.tertiaryContainer,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          displayStatus === "Draft"
                            ? "file-document-edit-outline"
                            : displayStatus === "Pending"
                            ? "clock-outline"
                            : displayStatus === "submitted"
                            ? "check-circle-outline"
                            : "cloud-check-outline"
                        }
                        size={24}
                        color={
                          displayStatus === "Draft"
                            ? theme.colors.onSurfaceVariant
                            : displayStatus === "Pending"
                            ? theme.colors.error
                            : displayStatus === "submitted"
                            ? theme.colors.primary
                            : theme.colors.tertiary
                        }
                      />
                    </View>

                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        variant="titleSmall"
                        numberOfLines={1}
                        style={{ fontWeight: "600" }}
                      >
                        {item.client_name || "Unnamed Valuation"}
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
                          color={theme.colors.outline}
                        />
                        <Text
                          variant="bodySmall"
                          numberOfLines={1}
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            marginLeft: 2,
                            flex: 1,
                          }}
                        >
                          {item.present_property_address ||
                            item.property_address_deed ||
                            "No address"}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    >
                      <Text
                        variant="labelSmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          fontWeight: "500",
                        }}
                      >
                        {displayStatus}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: "space-between",
    marginBottom: 20,
  },
  searchBar: {
    height: 48,
  },
  cardItem: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  emptyStateIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
