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
          paddingTop: insets.top + 12,
          borderBottomColor: theme.colors.outline,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <View style={styles.left}>
            <Pressable
              onPress={onBackPress}
              hitSlop={10}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.onBackground}
              />
            </Pressable>
          </View>
        )}

        <View style={styles.center}>
          <Text style={styles.title}>{title}</Text>
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
              hitSlop={10}
              style={styles.iconButton}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.absoluteFill,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    width: 40,
    alignItems: "flex-start",
  },
  center: {
    flex: 1,
  },
  right: {
    width: 40,
    alignItems: "flex-end",
  },
  iconButton: {
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
