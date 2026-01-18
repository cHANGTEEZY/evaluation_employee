import { Suspense, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { SplashScreen, Stack } from "expo-router";
import { Provider } from "../components/Provider";
import { useAuthStore } from "../lib/auth-store";
import { useSettingsStore } from "../lib/settings-store";
import { SQLiteProvider } from "expo-sqlite";
import { ActivityIndicator } from "react-native-paper";
import { initializeDatabase } from "../lib/db";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from "expo-router";

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const SPLASH_TIMEOUT = 3000; // Max 3 seconds for splash screen

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.init);
  const isPending = useAuthStore((s) => s.isPending);
  const initialized = useAuthStore((s) => s.initialized);
  const splashHidden = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDatabase();
        initAuth();
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };
    initialize();
  }, [initAuth]);

  useEffect(() => {
    // Hide splash when auth is ready
    if (initialized && !isPending && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }
  }, [initialized, isPending]);

  useEffect(() => {
    // Fallback: hide splash after timeout even if auth is still pending
    const timeout = setTimeout(() => {
      if (!splashHidden.current) {
        splashHidden.current = true;
        SplashScreen.hideAsync();
      }
    }, SPLASH_TIMEOUT);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  );
}

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <Provider>{children}</Provider>;
};

function RootLayoutNav() {
  const systemColorScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  // Determine effective theme based on settings
  const effectiveTheme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator size={"large"} />}>
        <ThemeProvider
          value={effectiveTheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <SQLiteProvider
            databaseName="evaluationapp"
            options={{
              enableChangeListener: true,
            }}
            useSuspense
          >
            <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="(auth)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(pages)"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </SQLiteProvider>
        </ThemeProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}
