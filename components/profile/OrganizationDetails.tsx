import { View, StyleSheet } from "react-native";
import { Card, Text, Divider, Avatar } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";

export default function OrganizationDetails() {
  const { organization } = useAuthSession();

  if (!organization) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Organization Details"
        left={(props) => <Avatar.Icon {...props} icon="domain" />}
      />
      <Card.Content>
        <View style={styles.row}>
          <Text variant="titleMedium">Name:</Text>
          <Text variant="bodyLarge">{organization.name}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text variant="titleMedium">Address:</Text>
          <Text variant="bodyLarge">{organization.address || "N/A"}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text variant="titleMedium">Contact:</Text>
          <Text variant="bodyLarge">{organization.contactNumber || "N/A"}</Text>
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
