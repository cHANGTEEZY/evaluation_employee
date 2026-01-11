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
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.colors.elevation.level3 },
        ]}
      >
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

          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "circle";
          if (route.name === "evaluations")
            iconName = isFocused ? "clipboard-list" : "clipboard-list-outline";
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
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && {
                    backgroundColor: theme.colors.secondaryContainer,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={24}
                  color={
                    isFocused
                      ? theme.colors.onSecondaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                />
              </View>

              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onSecondaryContainer,
                  marginLeft: 4,
                }}
              >
                {label as string}
              </Text>
            </Pressable>
          );
        })}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
  },
});
