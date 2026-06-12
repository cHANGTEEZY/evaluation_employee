import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
export type ThemeMode = "system" | "light" | "dark";
interface SettingsState {
    themeMode: ThemeMode;
    notificationsEnabled: boolean;
    syncNotificationsEnabled: boolean;
    autoSyncEnabled: boolean;
    autoSyncOnWifiOnly: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setSyncNotificationsEnabled: (enabled: boolean) => void;
    setAutoSyncEnabled: (enabled: boolean) => void;
    setAutoSyncOnWifiOnly: (enabled: boolean) => void;
    resetSettings: () => void;
}
const defaultSettings = {
    themeMode: "system" as ThemeMode,
    notificationsEnabled: true,
    syncNotificationsEnabled: true,
    autoSyncEnabled: false,
    autoSyncOnWifiOnly: true,
};
export const useSettingsStore = create<SettingsState>()(persist((set) => ({
    ...defaultSettings,
    setThemeMode: (mode) => set({ themeMode: mode }),
    setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    setSyncNotificationsEnabled: (enabled) => set({ syncNotificationsEnabled: enabled }),
    setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),
    setAutoSyncOnWifiOnly: (enabled) => set({ autoSyncOnWifiOnly: enabled }),
    resetSettings: () => set(defaultSettings),
}), {
    name: "evaluation-app-settings",
    storage: createJSONStorage(() => AsyncStorage),
}));
