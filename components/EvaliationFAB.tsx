import React, { useState } from "react";
import { Alert } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthSession } from "../lib/auth-store";

const NOT_ALLOWED_SCREEN = [
  "/profile",
  "/EvaluationForm",
  "/EvaluationDetail",
  "/forgot-password",
  "/login",
];

const EvaliationFAB = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuthSession();

  const insets = useSafeAreaInsets();
  const fabBottomPosition = insets.bottom + 60;

  const pathname = usePathname();

  console.log("Pathnmae", pathname);

  if (NOT_ALLOWED_SCREEN.includes(pathname)) {
    return null;
  }

  const handleNewValuation = () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Authentication Required",
        "You must be logged in to create evaluations. Please sign in first.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
      return;
    }
    router.push("/(pages)/EvaluationForm");
  };

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible
        icon={open ? "close" : "plus"}
        actions={[
          {
            icon: "home",
            label: "Home",
            onPress: () => router.push("/(tabs)/home"),
          },
          {
            icon: "cog",
            label: "Settings",
            onPress: () => router.push("/(pages)/Settings"),
          },
          {
            icon: "cloud-sync",
            label: "Sync Data",
            onPress: () => router.push("/(tabs)/sync"),
          },
          {
            icon: "file-document-edit",
            label: "New Valuation",
            onPress: handleNewValuation,
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        style={{ paddingBottom: fabBottomPosition }}
      />
    </Portal>
  );
};

export default EvaliationFAB;
