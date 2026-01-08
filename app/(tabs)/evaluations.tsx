import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import PageHeader from "../../components/PageHeader";
import { FlashList } from "@shopify/flash-list";

const dummyData = Array.from({ length: 20 }).map((_, index) => ({
  id: index.toString(),
  title: `Item ${index + 1}`,
}));

export default function TabOneScreen() {
  const { session, user } = useAuthSession();
  const theme = useTheme();

  console.log("Session:", JSON.stringify(session, null, 2));
  console.log("User:", JSON.stringify(user, null, 2));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left"]}>
      <View style={styles.listContainer}>
        <PageHeader
          title="Evaluations"
          subtitle="View and manage your evaluations"
        />
        <FlashList
          renderItem={({ item }) => <PageHeader title={item.title} />}
          data={dummyData}
        />
      </View>
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
