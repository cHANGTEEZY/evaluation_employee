import { View, StyleSheet } from "react-native";
import { Card, Text, Divider, Button, Avatar } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";

type UserProfileProps = {
  onEdit: () => void;
};

export default function UserProfile({ onEdit }: UserProfileProps) {
  const { user } = useAuthSession();

  if (!user) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title="User Profile"
        left={(props) =>
          user.image ? (
            <Avatar.Image {...props} source={{ uri: user.image }} />
          ) : (
            <Avatar.Icon {...props} icon="account" />
          )
        }
      />
      <Card.Content>
        <View style={styles.row}>
          <Text variant="titleMedium">Name:</Text>
          <Text variant="bodyLarge">{user.name}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text variant="titleMedium">Email:</Text>
          <Text variant="bodyLarge">{user.email}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text variant="titleMedium">Role:</Text>
          <Text variant="bodyLarge">{user.role}</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={onEdit}>Edit</Button>
      </Card.Actions>
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
