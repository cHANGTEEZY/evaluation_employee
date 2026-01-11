import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Button, TextInput } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";

type EditUserProfileFormProps = {
  onCancel: () => void;
};

/**
 * Form component for editing the current user's profile (name and password).
 *
 * Renders inputs for name, new password, and password confirmation, and actions to cancel or save changes.
 *
 * @param onCancel - Callback invoked when the Cancel button is pressed.
 * @returns The rendered profile edit form component.
 *
 * Notes: The name field is initialized from the current user session. Pressing Save currently logs the name and password to console (TODO: implement actual save logic).
 */
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