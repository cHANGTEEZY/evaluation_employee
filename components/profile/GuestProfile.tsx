import { View, StyleSheet } from "react-native";
import { Button, Text, useTheme, Avatar, Card, List } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { router } from "expo-router";

/**
 * Renders a guest profile screen with information about signing in and a primary Log In action.
 *
 * The UI shows an avatar, explanatory text, a short list of sign-in benefits, and a full-width "Log In" button.
 * Activating the button clears the current session and navigates to the authentication login route.
 *
 * @returns A React element that displays the guest profile screen.
 */
export default function GuestProfile() {
  const { signOut } = useAuthSession();
  const theme = useTheme();

  const handleLogin = async () => {
    await signOut();

    await new Promise((resolve) => setTimeout(resolve, 100));
    router.replace("/(auth)/login");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Icon
            size={80}
            icon="account-outline"
            style={{ backgroundColor: theme.colors.secondaryContainer }}
          />
          <Text
            variant="headlineMedium"
            style={{ marginTop: 16, textAlign: "center" }}
          >
            Guest User
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              textAlign: "center",
              color: theme.colors.onSurfaceVariant,
              marginBottom: 16,
            }}
          >
            You are currently browsing as a guest.
          </Text>

          <Text
            variant="titleMedium"
            style={{
              alignSelf: "flex-start",
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Why Sign In?
          </Text>
          <View style={{ width: "100%" }}>
            <List.Item
              title="Save your preferences"
              left={(props) => <List.Icon {...props} icon="cog" />}
            />
            <List.Item
              title="Access exclusive content"
              left={(props) => <List.Icon {...props} icon="star" />}
            />
            <List.Item
              title="Sync across devices"
              left={(props) => <List.Icon {...props} icon="cloud-sync" />}
            />
          </View>
        </Card.Content>
        <Card.Actions style={{ justifyContent: "center", paddingBottom: 16 }}>
          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            Log In
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  card: {
    // marginVertical: 8,
  },
  cardContent: {
    alignItems: "center",
  },
  button: {
    width: "100%",
  },
});