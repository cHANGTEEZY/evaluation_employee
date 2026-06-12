import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import React from "react";
import { SafeAreaView, useSafeAreaInsets, } from "react-native-safe-area-context";
import { useTheme, Text, Card, Switch, Divider, List, RadioButton, Button, Surface, } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSettingsStore, ThemeMode } from "../../lib/settings-store";
import { useAuthSession } from "../../lib/auth-store";
const Settings = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuthSession();
    const { themeMode, notificationsEnabled, syncNotificationsEnabled, autoSyncEnabled, autoSyncOnWifiOnly, setThemeMode, setNotificationsEnabled, setSyncNotificationsEnabled, setAutoSyncEnabled, setAutoSyncOnWifiOnly, resetSettings, } = useSettingsStore();
    const handleThemeChange = (value: string) => {
        setThemeMode(value as ThemeMode);
    };
    return (<SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <View style={{
            flex: 1,
            backgroundColor: theme.colors.background,
        }}>
        
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }} style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white"/>
            </Pressable>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text variant="headlineSmall" style={{
            color: "white",
            fontWeight: "700",
            letterSpacing: -0.3,
        }}>
                Settings
              </Text>
              <Text variant="bodySmall" style={{
            color: "rgba(255,255,255,0.9)",
            marginTop: 4,
            letterSpacing: 0.2,
        }}>
                Customize your app experience
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="palette-outline" size={24} color={theme.colors.primary}/>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Appearance
              </Text>
            </View>
            <Card.Content>
              <Text variant="labelLarge" style={{ marginBottom: 8 }}>
                Theme
              </Text>
              <RadioButton.Group onValueChange={handleThemeChange} value={themeMode}>
                <View style={styles.radioRow}>
                  <RadioButton.Item label="System Default" value="system" position="leading" style={styles.radioItem} labelStyle={styles.radioLabel}/>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton.Item label="Light Mode" value="light" position="leading" style={styles.radioItem} labelStyle={styles.radioLabel}/>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton.Item label="Dark Mode" value="dark" position="leading" style={styles.radioItem} labelStyle={styles.radioLabel}/>
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          
          

          
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cloud-sync-outline" size={24} color={theme.colors.primary}/>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Data & Sync
              </Text>
            </View>
            <Card.Content>
              <List.Item title="Auto Sync" description="Automatically sync when online" left={() => (<MaterialCommunityIcons name="sync" size={24} color={theme.colors.onSurfaceVariant} style={{ alignSelf: "center", marginLeft: 8 }}/>)} right={() => (<Switch value={autoSyncEnabled} onValueChange={setAutoSyncEnabled} disabled={!isAuthenticated} trackColor={{
                false: theme.colors.surfaceVariant,
                true: theme.colors.primaryContainer,
            }} thumbColor={autoSyncEnabled
                ? theme.colors.primary
                : theme.colors.outline} ios_backgroundColor={theme.colors.surfaceVariant}/>)} style={styles.listItem}/>
              <Divider />
              <List.Item title="WiFi Only" description="Only sync when connected to WiFi" left={() => (<MaterialCommunityIcons name="wifi" size={24} color={theme.colors.onSurfaceVariant} style={{ alignSelf: "center", marginLeft: 8 }}/>)} right={() => (<Switch value={autoSyncOnWifiOnly} onValueChange={setAutoSyncOnWifiOnly} disabled={!autoSyncEnabled || !isAuthenticated} trackColor={{
                false: theme.colors.surfaceVariant,
                true: theme.colors.primaryContainer,
            }} thumbColor={autoSyncOnWifiOnly
                ? theme.colors.primary
                : theme.colors.outline} ios_backgroundColor={theme.colors.surfaceVariant}/>)} style={styles.listItem}/>
              {!isAuthenticated && (<View style={styles.signInPrompt}>
                  <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.primary}/>
                  <Text variant="bodySmall" style={{
                color: theme.colors.primary,
                marginLeft: 8,
                flex: 1,
            }}>
                    Sign in to enable auto-sync features
                  </Text>
                </View>)}
            </Card.Content>
          </Card>

          
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information-outline" size={24} color={theme.colors.primary}/>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                About
              </Text>
            </View>
            <Card.Content>
              <List.Item title="App Version" description="1.0.0" left={() => (<MaterialCommunityIcons name="tag-outline" size={24} color={theme.colors.onSurfaceVariant} style={{ alignSelf: "center", marginLeft: 8 }}/>)} style={styles.listItem}/>
              <Divider />
              <List.Item title="Privacy Policy" left={() => (<MaterialCommunityIcons name="shield-lock-outline" size={24} color={theme.colors.onSurfaceVariant} style={{ alignSelf: "center", marginLeft: 8 }}/>)} right={() => (<MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant}/>)} onPress={() => {
        }} style={styles.listItem}/>
              <Divider />
              <List.Item title="Terms of Service" left={() => (<MaterialCommunityIcons name="file-document-outline" size={24} color={theme.colors.onSurfaceVariant} style={{ alignSelf: "center", marginLeft: 8 }}/>)} right={() => (<MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant}/>)} onPress={() => {
        }} style={styles.listItem}/>
            </Card.Content>
          </Card>

          
          <View style={styles.resetContainer}>
            <Button mode="outlined" onPress={resetSettings} icon="refresh" textColor={theme.colors.error} style={styles.resetButton}>
              Reset All Settings
            </Button>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>);
};
export default Settings;
const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
        padding: 24,
    },
    sectionCard: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: "hidden",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 18,
        paddingBottom: 10,
    },
    sectionTitle: {
        fontWeight: "700",
        marginLeft: 12,
    },
    radioRow: {
        marginVertical: -4,
    },
    radioItem: {
        paddingVertical: 4,
    },
    radioLabel: {
        marginLeft: 8,
    },
    listItem: {
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    signInPrompt: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 97, 164, 0.08)",
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    resetContainer: {
        marginTop: 8,
        marginBottom: 24,
        alignItems: "center",
    },
    resetButton: {
        borderRadius: 14,
    },
});
