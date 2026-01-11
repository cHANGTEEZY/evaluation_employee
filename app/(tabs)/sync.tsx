import PageHeader from "../../components/PageHeader";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { View } from "react-native";
import { Button, Snackbar, Portal, Text, useTheme } from "react-native-paper";
import { useState } from "react";

/**
 * Renders the "Sync" tab screen with a header, descriptive paragraphs, a contained button that shows a top Snackbar and navigates to the evaluations tab.
 *
 * The button sets the snackbar visible and navigates to "/(tabs)/evaluations"; the Snackbar can be dismissed to hide it.
 *
 * @returns A React element representing the Sync screen
 */
export default function TabTwoScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [snackVisible, setSnackVisible] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <PageHeader title={"Sync"} />
      <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
        This is Tab Two Page
      </Text>

      <View style={{ marginTop: 40, alignItems: "center" }}>
        <Text variant="bodyLarge" style={{ marginBottom: 8 }}>
          This is a simple paragraph
        </Text>
        <Text variant="bodyLarge" style={{ marginBottom: 8 }}>
          This is a simple paragraph
        </Text>
        <Text variant="bodyLarge" style={{ marginBottom: 8 }}>
          This is a simple paragraph
        </Text>
        <Button
          style={styles.buttonStyls}
          mode="contained"
          onPress={() => {
            setSnackVisible(true);
            router.navigate("/(tabs)/evaluations");
          }}
        >
          Go Home
        </Button>
      </View>
      <Portal>
        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          wrapperStyle={{
            position: "absolute",
            top: 16,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
          style={{
            alignSelf: "center",
            marginHorizontal: 16,
            borderRadius: 12,
            backgroundColor: theme.colors.inverseSurface,
          }}
        >
          <Text style={{ color: theme.colors.inverseOnSurface }}>
            Navigating...
          </Text>
        </Snackbar>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonStyls: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
  },
});