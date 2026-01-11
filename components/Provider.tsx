import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import type { ReactNode } from "react";
import { AppLight, AppDark } from "../constants/Themes";

/**
 * Wraps children with a React Native Paper provider using the system color scheme's theme.
 *
 * @param children - React node(s) to render inside the themed PaperProvider
 * @returns A PaperProvider element configured with the selected theme that wraps `children`
 */
export function Provider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();

  const theme = colorScheme === "dark" ? AppDark : AppLight;

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}