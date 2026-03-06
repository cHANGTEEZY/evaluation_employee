import { View, StyleSheet, Pressable } from "react-native";
import { Text, Button, Avatar, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type UserProfileProps = {
  onEdit?: () => void;
  /** Rendered in the hero section below name/role (e.g. status form) */
  heroExtra?: React.ReactNode;
};

const SECTION_LABEL = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
};

export default function UserProfile({ onEdit, heroExtra }: UserProfileProps) {
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
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text
          variant="labelMedium"
          style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
        >
          {label}
        </Text>
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurface }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.hero,
          heroExtra && {
            backgroundColor: theme.colors.surfaceContainerHighest,
            borderRadius: 20,
            padding: 20,
          },
        ]}
      >
        <View style={styles.heroRow}>
          <View style={styles.avatarWrap}>
            {displayUser.image ? (
              <Avatar.Image size={64} source={{ uri: displayUser.image }} />
            ) : (
              <Avatar.Icon
                size={64}
                icon="account"
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
            )}
          </View>
          <View style={styles.heroText}>
            <Text
              variant="titleLarge"
              style={[styles.name, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {displayUser.name}
            </Text>
            <View
              style={[
                styles.roleChip,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-account"
                size={14}
                color={theme.colors.primary}
              />
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.primary, marginLeft: 4 }}
              >
                {displayUser.role}
              </Text>
            </View>
          </View>
        </View>
        {heroExtra ? (
          <View
            style={[
              styles.heroExtra,
              { borderTopColor: theme.colors.outlineVariant },
            ]}
          >
            {heroExtra}
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.sectionTitle,
          SECTION_LABEL,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        Account
      </Text>
      <Row icon="account-outline" label="Full Name" value={displayUser.name} />
      <Row icon="email-outline" label="Email" value={displayUser.email} />
      <Row
        icon="shield-account-outline"
        label="Role"
        value={displayUser.role}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 24,
  },
  hero: {
    marginBottom: 24,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroExtra: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  name: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-start",
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
});
