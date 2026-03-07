import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type ConverterMode = "area" | "length";

type ModeToggleProps = {
  value: ConverterMode;
  onValueChange: (mode: ConverterMode) => void;
};

const ModeToggle = ({ value, onValueChange }: ModeToggleProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: 12,
          marginBottom: 30,
        },
      ]}
    >
      <Pressable
        onPress={() => onValueChange("area")}
        style={[
          styles.segment,
          value === "area" && {
            backgroundColor:
              theme.colors.primaryContainer ?? theme.colors.primary,
            borderRadius: 10,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="image-filter-hdr"
          size={20}
          color={
            value === "area"
              ? (theme.colors.onPrimaryContainer ?? theme.colors.onPrimary)
              : theme.colors.onSurfaceVariant
          }
        />
        <Text
          variant="labelLarge"
          style={[
            styles.label,
            {
              color:
                value === "area"
                  ? (theme.colors.onPrimaryContainer ?? theme.colors.onPrimary)
                  : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          Area
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onValueChange("length")}
        style={[
          styles.segment,
          value === "length" && {
            backgroundColor:
              theme.colors.primaryContainer ?? theme.colors.primary,
            borderRadius: 10,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="ruler"
          size={20}
          color={
            value === "length"
              ? (theme.colors.onPrimaryContainer ?? theme.colors.onPrimary)
              : theme.colors.onSurfaceVariant
          }
        />
        <Text
          variant="labelLarge"
          style={[
            styles.label,
            {
              color:
                value === "length"
                  ? (theme.colors.onPrimaryContainer ?? theme.colors.onPrimary)
                  : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          Length
        </Text>
      </Pressable>
    </View>
  );
};

export default ModeToggle;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  label: {
    fontWeight: "600",
  },
});
