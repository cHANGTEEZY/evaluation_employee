import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SECTION_LABEL = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
};

export default function BranchDetails() {
  const { branch, isAuthenticated } = useAuthSession();
  const theme = useTheme();

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
        <MaterialCommunityIcons name={icon as any} size={20} color={theme.colors.tertiary} />
      </View>
      <View style={styles.rowText}>
        <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (!branch) {
    return (
      <View style={[styles.wrapper, { borderTopColor: theme.colors.outlineVariant }]}>
        <Text style={[styles.sectionTitle, SECTION_LABEL, { color: theme.colors.onSurfaceVariant }]}>
          Branch
        </Text>
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="store-outline"
            size={40}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: "center" }}>
            {isAuthenticated ? "No branch assigned" : "Sign in to view branch details"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { borderTopColor: theme.colors.outlineVariant }]}>
      <Text style={[styles.sectionTitle, SECTION_LABEL, { color: theme.colors.onSurfaceVariant }]}>
        Branch
      </Text>
      <Row icon="store-outline" label="Branch Name" value={branch.name} />
      <Row icon="map-marker-outline" label="Address" value={branch.address || "N/A"} />
      <Row icon="phone-outline" label="Contact" value={branch.contactNumber || "N/A"} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  empty: {
    alignItems: "center",
    paddingVertical: 24,
  },
});
