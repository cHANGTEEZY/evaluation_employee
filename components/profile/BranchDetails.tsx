import { View, StyleSheet } from "react-native";
import { Card, Text, Divider, Avatar } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";

/**
 * Render a card showing the current session branch's name, address, and contact.
 *
 * @returns A Card displaying the branch's name, address (or `N/A`), and contact (or `N/A`), or `null` when no branch is available.
 */
export default function BranchDetails() {
  const { branch } = useAuthSession();

  if (!branch) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Branch Details"
        left={(props) => <Avatar.Icon {...props} icon="store" />}
      />
      <Card.Content>
        <View style={styles.row}>
          <Text variant="titleMedium">Name:</Text>
          <Text variant="bodyLarge">{branch.name}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text variant="titleMedium">Address:</Text>
          <Text variant="bodyLarge">{branch.address || "N/A"}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text variant="titleMedium">Contact:</Text>
          <Text variant="bodyLarge">{branch.contactNumber || "N/A"}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 4,
  },
});