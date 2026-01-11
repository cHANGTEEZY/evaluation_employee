import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { View, Text } from "react-native";

/**
 * Screen displayed for unknown routes that shows a "not found" message and a link to the home screen.
 *
 * @returns The JSX element rendering the not-found message and a navigation link to `/`.
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={{ margin: 10 }}>
        <Text style={{ marginBottom: 8 }}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});