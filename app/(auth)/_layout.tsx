import React from "react";
import { Stack } from "expo-router";
import { useAuthSession } from "../../lib/auth-store";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import { View, useColorScheme } from "react-native";
import { AuthLight, AuthDark } from "../../constants/Themes";

const AuthLayout = () => {
  const { isPending } = useAuthSession();
  const colorScheme = useColorScheme();
  const authTheme = colorScheme === "dark" ? AuthDark : AuthLight;

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: authTheme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={authTheme.colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={authTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </PaperProvider>
  );
};

export default AuthLayout;
