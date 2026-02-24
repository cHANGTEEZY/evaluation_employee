import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
};

const PageHeader = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
}: PageHeaderProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 14,
          paddingBottom: 14,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.outline,
        },
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <View style={styles.left}>
            <Pressable
              onPress={onBackPress}
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.onSurface}
              />
            </Pressable>
          </View>
        )}

        <View style={styles.center}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.right}>
          {rightIcon && (
            <Pressable
              onPress={onRightPress}
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons
                name={rightIcon as any}
                size={22}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default PageHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    width: 44,
    alignItems: "flex-start",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  right: {
    width: 44,
    alignItems: "flex-end",
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
