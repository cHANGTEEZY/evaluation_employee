import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Button, TextInput } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";

type EditUserProfileFormProps = {
  onCancel: () => void;
};

export default function EditUserProfileForm({
  onCancel,
}: EditUserProfileFormProps) {
  const { user } = useAuthSession();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving...", { name, password });
  };

  return (
    <Card style={styles.card}>
      <Card.Title title="Edit Profile" />
      <Card.Content>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          label="New Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
      </Card.Content>
      <Card.Actions>
        <Button onPress={onCancel}>Cancel</Button>
        <Button onPress={handleSave} mode="contained">
          Save
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  input: {
    marginBottom: 12,
  },
});
