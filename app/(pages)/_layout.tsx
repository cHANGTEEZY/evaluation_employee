import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const PagesLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Settings" options={{ headerShown: false }} />
      <Stack.Screen name="EvaluationDetail" options={{ headerShown: false }} />
      <Stack.Screen name="EvaluationForm" options={{ headerShown: false }} />
    </Stack>
  );
};

export default PagesLayout;

const styles = StyleSheet.create({});
