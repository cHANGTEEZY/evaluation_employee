import { Redirect, Tabs } from "expo-router";
import { useAuthSession } from "../../lib/auth-store";
import TabBar from "../../components/TabBar";
import { View, ActivityIndicator } from "react-native";

export default function TabLayout() {
  const { isAuthenticated, isPending } = useAuthSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="evaluations"
        options={{
          title: "Evaluations",
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: "Sync",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
