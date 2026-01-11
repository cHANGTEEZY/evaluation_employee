import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { useTheme, List, Text, Card } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import PageHeader from "../../components/PageHeader";
import { FlashList } from "@shopify/flash-list";
import PillFilter from "../../components/PillFilter";
import { useState, useMemo } from "react";
import MenuDrawer from "../../components/MenuDrawer";
import { useRouter } from "expo-router";

type Status = "Pending" | "Completed" | "Synced";

const dummyData = Array.from({ length: 20 }).map((_, index) => {
  const statuses: Status[] = ["Pending", "Completed", "Synced"];
  return {
    id: index.toString(),
    title: `Valuation ${index + 1}`,
    subtitle: `123 Main St, Apt ${index + 1}`,
    status: statuses[index % 3],
  };
});

export default function EvaluationsScreen() {
  const { session, user } = useAuthSession();
  const theme = useTheme();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [drawerVisible, setDrawerVisible] = useState(false);

  const filteredData = useMemo(() => {
    if (selectedFilter === "All") return dummyData;
    return dummyData.filter((item) => item.status === selectedFilter);
  }, [selectedFilter]);

  const router = useRouter();

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
            name: "Completed",
            onPress: () => setSelectedFilter("Completed"),
            selected: selectedFilter === "Completed",
          },
          {
            icon: "cloud-check-outline",
            name: "Synced",
            onPress: () => setSelectedFilter("Synced"),
            selected: selectedFilter === "Synced",
          },
        ]}
      />
      <FlashList
        data={filteredData}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            description={item.subtitle}
            onPress={() =>
              router.push({
                pathname: "/(pages)/EvaluationDetail",
                params: {
                  evaluation: JSON.stringify(item) as any,
                },
              })
            }
            left={(props) => (
              <List.Icon
                {...props}
                icon={
                  item.status === "Pending"
                    ? "clock-outline"
                    : item.status === "Completed"
                    ? "check-circle-outline"
                    : "cloud-check-outline"
                }
                color={
                  item.status === "Pending"
                    ? theme.colors.error
                    : item.status === "Completed"
                    ? theme.colors.primary
                    : theme.colors.tertiary
                }
              />
            )}
            right={(props) => (
              <View style={{ justifyContent: "center" }}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {item.status}
                </Text>
              </View>
            )}
            style={{ paddingHorizontal: 16 }}
          />
        )}
      />
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
