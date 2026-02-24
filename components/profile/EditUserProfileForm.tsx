import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, TextInput, Text, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";

type EditUserProfileFormProps = {
  onCancel: () => void;
};

const SECTION_LABEL = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
};

export default function EditUserProfileForm({
  onCancel,
}: EditUserProfileFormProps) {
  const { user } = useAuthSession();
  const theme = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving...", { name, password });
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, SECTION_LABEL, { color: theme.colors.onSurfaceVariant }]}>
        Edit Profile
      </Text>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        outlineStyle={styles.inputOutline}
      />
      <TextInput
        label="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        outlineStyle={styles.inputOutline}
      />
      <TextInput
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        outlineStyle={styles.inputOutline}
      />
      <View style={styles.actions}>
        <Button onPress={onCancel} style={styles.actionButton}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSave} style={styles.actionButton}>
          Save
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  inputOutline: {
    borderRadius: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    minWidth: 100,
  },
});
