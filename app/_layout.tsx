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
import { SQLiteProvider } from "expo-sqlite";
import { ActivityIndicator } from "react-native-paper";
import { getDb } from "../lib/db";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const SPLASH_TIMEOUT = 3000; /**
 * Initializes authentication, manages hiding the splash screen (when auth is ready or after a timeout), and renders the provider-wrapped navigation root.
 *
 * Calls the auth initializer on mount and ensures the splash screen is hidden either once authentication initialization completes and is not pending or after the SPLASH_TIMEOUT fallback.
 *
 * @returns The root React element for the app, rendering Providers around the navigation layout.
 */

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.init);
  const isPending = useAuthStore((s) => s.isPending);
  const initialized = useAuthStore((s) => s.initialized);
  const splashHidden = useRef(false);

  useEffect(() => {
    initAuth();
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

/**
 * Render the app's navigation layout with gesture handling, theming, SQLite provider, and status bar configured.
 *
 * @returns The root React element containing a GestureHandlerRootView that wraps a Suspense boundary, ThemeProvider, SQLiteProvider, StatusBar, and the app Stack routes.
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator size={"large"} />}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <SQLiteProvider
            databaseName="evaluationapp"
            options={{
              enableChangeListener: true,
            }}
            useSuspense
          >
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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