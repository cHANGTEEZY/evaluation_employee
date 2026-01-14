import React from "react";
import { Redirect, Stack } from "expo-router";
import { useAuthSession } from "../../lib/auth-store";
import { PaperProvider } from "react-native-paper";
import { useColorScheme } from "react-native";
import { AuthLight, AuthDark } from "../../constants/Themes";

const AuthLayout = () => {
  const { isPending, isAuthenticated } = useAuthSession();
  const colorScheme = useColorScheme();
  const authTheme = colorScheme === "dark" ? AuthDark : AuthLight;

  if (isPending) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={"/(tabs)/home"} />;
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
      </Stack>
    </PaperProvider>
  );
};

export default AuthLayout;
