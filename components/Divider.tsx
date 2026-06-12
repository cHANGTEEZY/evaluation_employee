import React from "react";
import { StyleSheet, Text, View } from "react-native";
type DividerProps = {
  colors: {
    divider: string;
    text: string;
    background?: string;
  };
  label?: string;
};
const Divider = ({ colors, label = "OR" }: DividerProps) => {
  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />

      <View
        style={[
          styles.labelContainer,
          { backgroundColor: colors.background ?? "transparent" },
        ]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>

      <View style={[styles.line, { backgroundColor: colors.divider }]} />
    </View>
  );
};
export default Divider;
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 26,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.4,
  },
  labelContainer: {
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
