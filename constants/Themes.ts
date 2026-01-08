import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

// The original theme for Auth pages
export const AuthLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#6C7FF2",
    secondary: "#7DD3FC",
    tertiary: "#9AA4C7",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceVariant: "#F1F5F9",
    onSurface: "#0F172A",
    onSurfaceVariant: "#475569",
    outline: "#CBD5E1",
    error: "#EF4444",
  },
};

export const AuthDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#8B9CF5",
    secondary: "#7DD3FC",
    tertiary: "#9AA4C7",
    background: "#0B1220",
    surface: "#111827",
    surfaceVariant: "#1F2937",
    onSurface: "#E5E7EB",
    onSurfaceVariant: "#9CA3AF",
    outline: "#2E3A5F",
    error: "#F87171",
  },
};

// New "Synergy" Theme for the main app
// Using a popular Deep Blue / Teal scheme that works well in both modes.
export const AppLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#0061A4", // Standard Material 3 Blue
    onPrimary: "#FFFFFF",
    primaryContainer: "#D1E4FF",
    onPrimaryContainer: "#001D36",
    
    secondary: "#535F70",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#D7E3F7",
    onSecondaryContainer: "#101C2B",
    
    tertiary: "#6B5778",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#F2DAFF",
    onTertiaryContainer: "#251431",
    
    background: "#FDFCFF", // Neutral off-white
    surface: "#FDFCFF",
    surfaceVariant: "#DFE2EB",
    onSurface: "#1A1C1E",
    onSurfaceVariant: "#43474E",
    
    outline: "#73777F",
    error: "#BA1A1A",
  },
};

export const AppDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#9ECAFF", // Lighter blue for dark mode
    onPrimary: "#003258",
    primaryContainer: "#00497D",
    onPrimaryContainer: "#D1E4FF",
    
    secondary: "#BBC7DB",
    onSecondary: "#253140",
    secondaryContainer: "#3B4858",
    onSecondaryContainer: "#D7E3F7",
    
    tertiary: "#D6BEE4",
    onTertiary: "#3B2948",
    tertiaryContainer: "#523F5F",
    onTertiaryContainer: "#F2DAFF",
    
    background: "#1A1C1E", // Neutral dark gray (not blueish)
    surface: "#1A1C1E",
    surfaceVariant: "#43474E",
    onSurface: "#E2E2E6",
    onSurfaceVariant: "#C3C7CF",
    
    outline: "#8D9199",
    error: "#FFB4AB",
  },
};
