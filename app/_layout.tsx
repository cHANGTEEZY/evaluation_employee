import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  useColorScheme,
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { Provider } from "../components/Provider";
import { useAuthStore } from "../lib/auth-store";
import { useSettingsStore } from "../lib/settings-store";
import { SQLiteProvider } from "expo-sqlite";
import { ActivityIndicator } from "react-native-paper";
import { initializeDatabase } from "../lib/db";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ToastManager from "toastify-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAutoSync } from "../lib/sync";
import * as SplashScreen from "expo-splash-screen";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from "expo-router";

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

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

  // Enable auto-sync when WiFi is connected (if enabled in settings)
  useAutoSync();

  const toastConfig = useMemo(() => {
    const render = (variant: AppToastVariant) => (props: any) => (
      <AppToast {...props} variant={variant} themeMode={effectiveTheme} />
    );

    return {
      success: render("success"),
      error: render("error"),
      info: render("info"),
      warn: render("warn"),
      default: render("default"),
    };
  }, [effectiveTheme]);

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
            <ToastManager
              config={toastConfig}
              position="top"
              width="96%"
              minHeight={64}
              duration={3200}
              animationStyle="fade"
              theme={effectiveTheme}
              iconFamily="MaterialCommunityIcons"
              iconSize={22}
              showCloseIcon={false}
              showProgressBar={false}
              useModal={false}
              topOffset={36}
              style={styles.toastManager}
            />
          </SQLiteProvider>
        </ThemeProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

type AppToastVariant = "success" | "error" | "info" | "warn" | "default";

type AppToastProps = {
  text1?: string;
  text2?: string;
  hide: () => void;
  variant: AppToastVariant;
  themeMode: "dark" | "light";
};

function AppToast({ text1, text2, hide, variant, themeMode }: AppToastProps) {
  const isDark = themeMode === "dark";

  const palette = (() => {
    switch (variant) {
      case "success":
        return {
          bg: isDark ? "#0F1A12" : "#ECFDF3",
          border: "#22C55E",
          icon: "check-decagram",
          tint: "rgba(34, 197, 94, 0.16)",
        };
      case "error":
        return {
          bg: isDark ? "#1F1A2B" : "#FEF2F2",
          border: "#F87171",
          icon: "close-octagon",
          tint: "rgba(248, 113, 113, 0.16)",
        };
      case "info":
        return {
          bg: isDark ? "#0B1628" : "#EFF6FF",
          border: "#38BDF8",
          icon: "information-outline",
          tint: "rgba(56, 189, 248, 0.16)",
        };
      case "warn":
        return {
          bg: isDark ? "#1F1705" : "#FFFBEB",
          border: "#FBBF24",
          icon: "alert-outline",
          tint: "rgba(251, 191, 36, 0.18)",
        };
      default:
        return {
          bg: isDark ? "#0F172A" : "#F8FAFC",
          border: "#CBD5E1",
          icon: "bell-outline",
          tint: "rgba(148, 163, 184, 0.16)",
        };
    }
  })();

  return (
    <View
      style={[
        styles.toastContainer,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          shadowColor: isDark ? "#0B1120" : "#0F172A",
        },
      ]}
    >
      <View style={[styles.toastAccent, { backgroundColor: palette.border }]} />
      <View style={[styles.toastIcon, { backgroundColor: palette.tint }]}>
        <MaterialCommunityIcons
          name={palette.icon as any}
          size={20}
          color={palette.border}
        />
      </View>
      <View style={styles.toastContent}>
        {text1 ? (
          <Text
            style={[
              styles.toastTitle,
              { color: isDark ? "#E2E8F0" : "#0F172A" },
            ]}
          >
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text
            style={[
              styles.toastMessage,
              { color: isDark ? "#CBD5E1" : "#475569" },
            ]}
          >
            {text2}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={hide} style={styles.toastClose} hitSlop={8}>
        <MaterialCommunityIcons
          name="close"
          size={18}
          color={isDark ? "#94A3B8" : "#475569"}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toastManager: {
    marginTop: 8,
  },
  toastContainer: {
    width: "96%",
    minHeight: 68,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  toastAccent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 999,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    marginTop: 2,
  },
  toastContent: {
    flex: 1,
    paddingRight: 6,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  toastMessage: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
  },
  toastClose: {
    padding: 6,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
});
