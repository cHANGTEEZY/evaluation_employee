import { Stack, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme, Surface, Icon } from "react-native-paper";

export default function NotFoundScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />

      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.elevation.level2 },
            ]}
          >
            <Icon
              source="compass-off-outline"
              size={64}
              color={theme.colors.primary}
            />
          </View>

          <Text
            variant="displaySmall"
            style={{ color: theme.colors.onBackground, fontWeight: "bold" }}
          >
            404
          </Text>

          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.secondary, marginBottom: 8 }}
          >
            Page Not Found
          </Text>

          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Sorry, we couldn't find the screen you're looking for. It might have
            been moved or deleted.
          </Text>

          <Button
            mode="contained"
            icon="home"
            onPress={() => router.replace("/(tabs)/home")}
            contentStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
            style={{ borderRadius: 30 }}
          >
            Go to Home
          </Button>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
});
