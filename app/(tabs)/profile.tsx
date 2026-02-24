import { useState } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import UserProfile from "../../components/profile/UserProfile";
import EditUserProfileForm from "../../components/profile/EditUserProfileForm";
import PresenceSection from "../../components/profile/PresenceSection";
import OrganizationDetails from "../../components/profile/OrganizationDetails";
import BranchDetails from "../../components/profile/BranchDetails";
import { SafeAreaView } from "react-native-safe-area-context";
import PageHeader from "../../components/PageHeader";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SECTION_LABEL = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
};

export default function Profile() {
  const { signOut, isAuthenticated } = useAuthSession();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const handleAuthAction = () => {
    if (isAuthenticated) {
      // Do NOT clear biometric credentials here — they should survive
      // sign-outs so the user can biometric-login back in.
      signOut();
    } else {
      router.push("/(auth)/login");
    }
  };

  const goToSettings = () => router.push("/(pages)/Settings");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["left"]}>
      <PageHeader
        title="Profile"
        subtitle="Manage your profile"
        rightIcon="cog-outline"
        onRightPress={goToSettings}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEditing && isAuthenticated ? (
          <EditUserProfileForm onCancel={() => setIsEditing(false)} />
        ) : (
          <UserProfile onEdit={() => setIsEditing(true)} />
        )}

        {/* Settings entry */}
        <View style={[styles.settingsSection, { borderTopColor: theme.colors.outlineVariant }]}>
          <Text style={[styles.sectionTitle, SECTION_LABEL, { color: theme.colors.onSurfaceVariant }]}>
            App
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.settingsRow,
              { backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent" },
            ]}
            onPress={goToSettings}
          >
            <View style={[styles.settingsIconWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.settingsRowText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Settings
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Theme, sync & preferences
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <PresenceSection />
        <OrganizationDetails />
        <BranchDetails />
        <View style={styles.signOutWrap}>
          <Button
            mode="contained"
            onPress={handleAuthAction}
            style={styles.button}
            icon={isAuthenticated ? "logout" : "login"}
          >
            {isAuthenticated ? "Sign Out" : "Sign In"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  settingsSection: {
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  settingsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingsRowText: {
    flex: 1,
  },
  signOutWrap: {
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
  },
});
