import React from "react";
import { Redirect, router, Slot, Tabs } from "expo-router";
import { useAuthSession } from "../../lib/auth-store";

const AuthLayout = () => {
  const { isPending, isAuthenticated } = useAuthSession();

  if (isPending) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={"/"} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="login" />
    </Tabs>
  );
};

export default AuthLayout;
