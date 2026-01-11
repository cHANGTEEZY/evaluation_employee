import { Redirect, Tabs } from "expo-router";
import { redirectSystemPath } from "../+native-intent";
import { useAuthSession } from "../../lib/auth-store";
import { useColorScheme } from "react-native";
import { useTheme } from "react-native-paper";
import TabBar from "../../components/TabBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const { isAuthenticated, isPending } = useAuthSession();

  if (isPending) {
    return null;
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
