import React, { useState } from "react";
import { FAB, Portal } from "react-native-paper";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NOT_ALLOWED_SCREEN = ["/profile", "/EvaluationForm", "/EvaluationDetail"];

const EvaliationFAB = () => {
  const [open, setOpen] = useState(false);

  const insets = useSafeAreaInsets();
  const fabBottomPosition = insets.bottom + 60;

  const pathname = usePathname();

  console.log("Pathnmae", pathname);

  if (NOT_ALLOWED_SCREEN.includes(pathname)) {
    return null;
  }

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible
        icon={open ? "close" : "plus"}
        actions={[
          {
            icon: "cloud-sync",
            label: "Sync Data",
            onPress: () => router.push("/(tabs)/sync"),
          },
          {
            icon: "file-document-edit",
            label: "New Valuation",
            onPress: () => router.push("/(pages)/EvaluationForm"),
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        style={{ paddingBottom: fabBottomPosition }}
      />
    </Portal>
  );
};

export default EvaliationFAB;
