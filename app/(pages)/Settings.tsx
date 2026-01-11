import { StyleSheet, Text, View } from "react-native";
import React from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";

const Settings = () => {
  const theme = useTheme();

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingVertical: insets.top + 12,
        }}
      >
        <Text style={{ color: theme.colors.primary }}>Settings Page</Text>
      </View>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({});
