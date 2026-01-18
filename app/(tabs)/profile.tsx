import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import UserProfile from "../../components/profile/UserProfile";
import EditUserProfileForm from "../../components/profile/EditUserProfileForm";
import OrganizationDetails from "../../components/profile/OrganizationDetails";
import BranchDetails from "../../components/profile/BranchDetails";
import { SafeAreaView } from "react-native-safe-area-context";
import PageHeader from "../../components/PageHeader";
import { router } from "expo-router";

export default function Profile() {
  const { signOut, isAuthenticated } = useAuthSession();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      router.push("/(auth)/login");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left"]}>
      <PageHeader title={"Profile"} subtitle="Manage your profile" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {isEditing && isAuthenticated ? (
          <EditUserProfileForm onCancel={() => setIsEditing(false)} />
        ) : (
          <UserProfile onEdit={() => setIsEditing(true)} />
        )}
        <OrganizationDetails />
        <BranchDetails />
        <View style={styles.signOutButtonContainer}>
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
  container: {
    flex: 1,
    // paddingVertical: 46,
    paddingHorizontal: 16,
  },
  signOutButtonContainer: {
    marginTop: 16,
    paddingBottom: 120,
    alignItems: "center",
  },
  button: {
    width: "100%",
  },
});
