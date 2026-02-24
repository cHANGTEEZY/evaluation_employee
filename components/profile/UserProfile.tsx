import { View, StyleSheet, Pressable } from "react-native";
import { Text, Button, Avatar, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type UserProfileProps = {
  onEdit: () => void;
};

const SECTION_LABEL = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
};

export default function UserProfile({ onEdit }: UserProfileProps) {
  const { user, isAuthenticated } = useAuthSession();
  const theme = useTheme();

  const displayUser = user || {
    name: "Guest User",
    email: "Not signed in",
    role: "Guest",
    image: null,
  };

  const Row = ({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value: string;
  }) => (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.hero}>
        {displayUser.image ? (
          <Avatar.Image size={72} source={{ uri: displayUser.image }} />
        ) : (
          <Avatar.Icon size={72} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
        )}
        <Text variant="titleLarge" style={[styles.name, { color: theme.colors.onSurface }]}>
          {displayUser.name}
        </Text>
        <View style={[styles.roleChip, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="shield-account" size={14} color={theme.colors.primary} />
          <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 4 }}>
            {displayUser.role}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, SECTION_LABEL, { color: theme.colors.onSurfaceVariant }]}>
        Account
      </Text>
      <Row icon="account-outline" label="Full Name" value={displayUser.name} />
      <Row icon="email-outline" label="Email" value={displayUser.email} />
      <Row icon="shield-account-outline" label="Role" value={displayUser.role} />

      {isAuthenticated && (
        <Button
          mode="contained"
          onPress={onEdit}
          icon="pencil"
          style={styles.editButton}
          contentStyle={{ height: 46 }}
        >
          Edit Profile
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 24,
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  name: {
    fontWeight: "700",
    marginTop: 14,
    letterSpacing: -0.2,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  label: {
    marginBottom: 2,
  },
  editButton: {
    marginTop: 20,
    borderRadius: 12,
  },
});
