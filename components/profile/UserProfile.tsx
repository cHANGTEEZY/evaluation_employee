import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Divider,
  Button,
  Avatar,
  useTheme,
  Surface,
} from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type UserProfileProps = {
  onEdit: () => void;
};

export default function UserProfile({ onEdit }: UserProfileProps) {
  const { user, isAuthenticated } = useAuthSession();
  const theme = useTheme();

  // Guest user fallback data
  const displayUser = user || {
    name: "Guest User",
    email: "Not signed in",
    role: "Guest",
    image: null,
  };

  return (
    <Card style={styles.card} mode="elevated" elevation={2}>
      <LinearGradient
        colors={[theme.colors.primaryContainer, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          {displayUser.image ? (
            <Avatar.Image
              size={72}
              source={{ uri: displayUser.image }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon size={72} icon="account" style={styles.avatar} />
          )}
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.userName}>
              {displayUser.name}
            </Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons
                name="shield-account"
                size={16}
                color="white"
              />
              <Text variant="labelMedium" style={styles.roleText}>
                {displayUser.role}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <Card.Content style={styles.content}>
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text
              variant="labelMedium"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Full Name
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {displayUser.name}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="email-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text
              variant="labelMedium"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Email Address
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {displayUser.email}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text
              variant="labelMedium"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Role
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {displayUser.role}
            </Text>
          </View>
        </View>
      </Card.Content>

      {isAuthenticated && (
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={onEdit}
            icon="pencil"
            style={styles.editButton}
            contentStyle={styles.editButtonContent}
          >
            Edit Profile
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientHeader: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  roleText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "600",
  },
  content: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(103, 80, 164, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontWeight: "500",
  },
  divider: {
    marginVertical: 4,
  },
  actions: {
    padding: 16,
    paddingTop: 8,
  },
  editButton: {
    flex: 1,
    borderRadius: 12,
  },
  editButtonContent: {
    height: 48,
  },
});
