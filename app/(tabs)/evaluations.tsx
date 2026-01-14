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
import { getAllValuations, ValuationRow } from "../../lib/schema";

type Status = "Pending" | "submitted" | "Synced";

// Helper function to get status display
const getStatusDisplay = (status: string, syncStatus: string): Status => {
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

  // Fetch valuations whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchValuations = async () => {
        try {
          setLoading(true);
          const data = await getAllValuations();
          setValuations(data);
        } catch (error) {
          console.error("Error fetching valuations:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchValuations();
    }, [])
  );

  // Filter and search valuations
  const filteredData = useMemo(() => {
    let filtered = valuations;

    // Filter by status
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={["left"]}
    >
      <PageHeader
        title="Evaluations"
        subtitle="View and manage your evaluations"
        rightIcon="menu"
        onRightPress={() => setDrawerVisible(true)}
      />

      <Searchbar
        placeholder="Search valuations..."
        value={searchText}
        onChangeText={(text) => setSearchText(text)}
        traileringIcon={searchText ? "close" : ""}
        onTraileringIconPress={() => setSearchText("")}
        style={{
          marginHorizontal: 15,
          marginBottom: 10,
          borderRadius: 20,
          backgroundColor: theme.colors.surfaceVariant,
        }}
      />

      <MenuDrawer
        visible={drawerVisible}
        onDismiss={() => setDrawerVisible(false)}
      />
      <PillFilter
        filters={[
          {
            icon: "filter-variant",
            name: "All",
            onPress: () => setSelectedFilter("All"),
            selected: selectedFilter === "All",
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ marginHorizontal: 15, marginVertical: 20 }}>
          <Text
            variant="titleLarge"
            style={{
              color: theme.colors.tertiary,
              textTransform: "capitalize",
            }}
          >
            {selectedFilter} Valuations
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
            <Text
              variant="bodyLarge"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              {searchText
                ? "No valuations found matching your search"
                : `No ${selectedFilter} valuations`}
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
                <List.Item
                  title={item.client_name || "Unnamed Valuation"}
                  description={
                    item.present_property_address ||
                    item.property_address_deed ||
                    "No address"
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/(pages)/EvaluationDetail",
                      params: { id: item.id },
                    })
                  }
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        displayStatus === "Pending"
                          ? "clock-outline"
                          : displayStatus === "submitted"
                          ? "check-circle-outline"
                          : "cloud-check-outline"
                      }
                      color={
                        displayStatus === "Pending"
                          ? theme.colors.error
                          : displayStatus === "submitted"
                          ? theme.colors.primary
                          : theme.colors.tertiary
                      }
                    />
                  )}
                  right={(props) => (
                    <View
                      style={{
                        justifyContent: "center",
                        backgroundColor: theme.colors.secondaryContainer,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        variant="labelSmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {displayStatus}
                      </Text>
                    </View>
                  )}
                  style={{
                    borderBottomColor: theme.colors.secondaryContainer,
                    borderBottomWidth: 1,
                    marginHorizontal: 16,
                  }}
                />
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
});
