import { Link, Redirect, router, Tabs } from "expo-router";
import { Button, useTheme } from "tamagui";
import { Atom, AudioWaveform, UserCog } from "@tamagui/lucide-icons";
import { redirectSystemPath } from "../+native-intent";
import { useAuthSession } from "../../lib/auth-store";

export default function TabLayout() {
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
      screenOptions={{
        // tabBarActiveTintColor: theme.red10.val,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopColor: theme.borderColor.val,
        },
        headerStyle: {
          backgroundColor: theme.background.val,
          borderBottomColor: theme.borderColor.val,
        },
        headerTintColor: theme.color.val,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: () => <Atom color={"violet"} />,
          tabBarActiveTintColor: "violet",
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Tab Two",
          tabBarIcon: ({ color }) => <AudioWaveform color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => <UserCog color={"violet"} />,
        }}
      />
    </Tabs>
  );
}
