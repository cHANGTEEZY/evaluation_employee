import React from "react";
import { View, StyleSheet } from "react-native";
import CompassView from "../../components/CompassView";

export default function CompassScreen() {
  return (
    <View style={styles.screen}>
      <CompassView
        size={280}
        showReadout
        showRings
        showCrosshair
        hapticOnNorth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
});
