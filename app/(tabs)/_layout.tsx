import { Redirect, Tabs } from "expo-router";
import { redirectSystemPath } from "../+native-intent";
import { useAuthSession } from "../../lib/auth-store";
import { useColorScheme } from "react-native";
import { useTheme } from "react-native-paper";
import TabBar from "../../components/TabBar";

/**
 * Render the app's authenticated tab navigator, redirecting to login when unauthenticated and rendering nothing while authentication is pending.
 *
 * @returns A JSX element: the Tabs navigator when authenticated, a Redirect to the login route when not authenticated, or `null` while authentication status is pending.
 */
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