import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import type { ReactNode } from "react";
import { AppLight, AppDark } from "../constants/Themes";

export function Provider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();

  const theme = colorScheme === "dark" ? AppDark : AppLight;

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
