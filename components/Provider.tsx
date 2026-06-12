import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import type { ReactNode } from "react";
import { AppLight, AppDark } from "../constants/Themes";
import { useSettingsStore } from "../lib/settings-store";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";
export function Provider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const effectiveTheme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;
  const theme = effectiveTheme === "dark" ? AppDark : AppLight;
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </QueryClientProvider>
  );
}
