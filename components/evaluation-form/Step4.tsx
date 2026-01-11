import { StyleSheet, View } from "react-native";
import React from "react";
import DrawingCanvas from "../DrawingCanvas";

const Step4 = () => {
  return (
    <View style={styles.container}>
      <DrawingCanvas />
    </View>
  );
};

export default Step4;

const styles = StyleSheet.create({
  container: {
    height: 400,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
  },
});
