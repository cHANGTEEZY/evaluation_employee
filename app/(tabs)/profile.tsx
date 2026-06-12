import { useState } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import UserProfile from "../../components/profile/UserProfile";
import PresenceSection from "../../components/profile/PresenceSection";
import OrganizationDetails from "../../components/profile/OrganizationDetails";
import BranchDetails from "../../components/profile/BranchDetails";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import { SafeAreaView } from "react-native-safe-area-context";
import PageHeader from "../../components/PageHeader";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { toast } from "../../lib/toast";
import { clearBiometricCredentials } from "../../lib/biometric-credentials";
const SECTION_LABEL = {
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
};
export default function Profile() {
    const { signOut, isAuthenticated } = useAuthSession();
    const theme = useTheme();
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const handleAuthAction = () => {
        if (isAuthenticated) {
            signOut();
        }
        else {
            router.push("/(auth)/login");
        }
    };
    const goToSettings = () => router.push("/(pages)/Settings");
    return (<SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["left"]}>
      <PageHeader title="Profile" subtitle="Manage your profile" rightIcon="cog-outline" onRightPress={goToSettings}/>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContent}>
          <UserProfile />
          {isAuthenticated && <PresenceSection embedded/>}

          
          <View style={[
            styles.settingsSection,
            { borderTopColor: theme.colors.outlineVariant },
        ]}>
          <Text style={[
            styles.sectionTitle,
            SECTION_LABEL,
            { color: theme.colors.onSurfaceVariant },
        ]}>
            App
          </Text>
          <Pressable style={({ pressed }) => [
            styles.settingsRow,
            {
                backgroundColor: pressed
                    ? theme.colors.surfaceVariant
                    : "transparent",
            },
        ]} onPress={goToSettings}>
            <View style={[
            styles.settingsIconWrap,
            { backgroundColor: theme.colors.surfaceVariant },
        ]}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={theme.colors.primary}/>
            </View>
            <View style={styles.settingsRowText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Settings
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Theme, sync & preferences
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant}/>
          </Pressable>
        </View>

        <OrganizationDetails />
        <BranchDetails />

        {isAuthenticated && (<View style={styles.changePasswordWrap}>
            <Button mode="outlined" onPress={() => setChangePasswordVisible(true)} style={styles.button} icon="lock-reset">
              Change Password
            </Button>
          </View>)}

        <View style={styles.signOutWrap}>
          <Button mode="contained" onPress={handleAuthAction} style={styles.button} icon={isAuthenticated ? "logout" : "login"}>
            {isAuthenticated ? "Sign Out" : "Sign In"}
          </Button>
        </View>
        </View>
      </ScrollView>

      <ChangePasswordModal visible={changePasswordVisible} onDismiss={() => setChangePasswordVisible(false)} onSuccess={() => {
            clearBiometricCredentials().catch(() => { });
            toast({
                title: "Password changed",
                message: "Your password has been updated. Sign in again to use biometric login.",
                preset: "done",
            });
        }}/>
    </SafeAreaView>);
}
const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    profileContent: {
        paddingHorizontal: 24,
    },
    settingsSection: {
        paddingVertical: 24,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    settingsRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 16,
    },
    settingsIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    settingsRowText: {
        flex: 1,
    },
    changePasswordWrap: {
        marginTop: 8,
        marginBottom: 8,
    },
    signOutWrap: {
        marginTop: 12,
        marginBottom: 24,
    },
    button: {
        borderRadius: 14,
    },
});
