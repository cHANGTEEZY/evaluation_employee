import { View, StyleSheet } from "react-native";
import { Card, Text, Divider, Avatar, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function BranchDetails() {
  const { branch, isAuthenticated } = useAuthSession();
  const theme = useTheme();

  if (!branch) {
    return (
      <Card style={styles.card} mode="elevated" elevation={2}>
        <LinearGradient
          colors={[theme.colors.tertiaryContainer, theme.colors.tertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerContent}>
            <Avatar.Icon
              size={56}
              icon="store"
              style={styles.avatar}
              color="white"
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Branch Details
            </Text>
          </View>
        </LinearGradient>
        <Card.Content
          style={[
            styles.content,
            { alignItems: "center", paddingVertical: 24 },
          ]}
        >
          <MaterialCommunityIcons
            name="account-lock-outline"
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {isAuthenticated
              ? "No branch assigned"
              : "Sign in to view branch details"}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card} mode="elevated" elevation={2}>
      <LinearGradient
        colors={[theme.colors.tertiaryContainer, theme.colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <Avatar.Icon
            size={56}
            icon="store"
            style={styles.avatar}
            color="white"
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Branch Details
          </Text>
        </View>
      </LinearGradient>

      <Card.Content style={styles.content}>
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="store-outline"
              size={24}
              color={theme.colors.tertiary}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text
              variant="labelMedium"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Branch Name
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {branch.name}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={24}
              color={theme.colors.tertiary}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text
              variant="labelMedium"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Branch Address
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {branch.address || "N/A"}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={24}
              color={theme.colors.tertiary}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text
              variant="labelMedium"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Contact Number
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {branch.contactNumber || "N/A"}
            </Text>
          </View>
        </View>
      </Card.Content>
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 16,
  },
  headerTitle: {
    fontWeight: "bold",
    color: "white",
    flex: 1,
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
    backgroundColor: "rgba(127, 61, 255, 0.1)",
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
});
