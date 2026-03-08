import { View, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabBar({ state, descriptors, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            let iconName: keyof typeof MaterialCommunityIcons.glyphMap =
              "circle";
            if (route.name === "evaluations")
              iconName = isFocused
                ? "clipboard-list"
                : "clipboard-list-outline";
            if (route.name === "sync")
              iconName = isFocused ? "cloud-sync" : "cloud-sync-outline";
            if (route.name === "profile")
              iconName = isFocused ? "account" : "account-outline";
            if (route.name === "home")
              iconName = isFocused ? "home" : "home-outline";

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={iconName}
                    size={22}
                    color={
                      isFocused
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                </View>
                <Text
                  variant="labelSmall"
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                      fontWeight: isFocused ? "600" : "500",
                    },
                  ]}
                >
                  {label as string}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    width: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 4,
  },
  iconContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
