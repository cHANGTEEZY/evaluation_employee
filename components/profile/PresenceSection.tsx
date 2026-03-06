import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import {
  Text,
  Button,
  useTheme,
  TextInput,
  ActivityIndicator,
} from "react-native-paper";
import { useAuthSession } from "../../lib/auth-store";
import {
  getPresence,
  updatePresence,
  PRESENCE_STATUSES,
  type PresenceStatusValue,
} from "../../lib/presence-api";

const SECTION_LABEL = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
};

type PresenceSectionProps = {
  /** When true, no top border and compact spacing (for use inside profile hero) */
  embedded?: boolean;
  /** When true, fill available space with a full-screen style layout */
  fullScreen?: boolean;
};

export default function PresenceSection({
  embedded,
  fullScreen,
}: PresenceSectionProps) {
  const { isAuthenticated } = useAuthSession();
  const theme = useTheme();
  const [presenceStatus, setPresenceStatus] =
    useState<PresenceStatusValue | null>(null);
  const [presenceClientName, setPresenceClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresence = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPresence();
      if (res.success) {
        setPresenceStatus((res.presenceStatus as PresenceStatusValue) ?? null);
        setPresenceClientName(res.presenceClientName ?? "");
      }
    } catch (e: any) {
      const message =
        e.response?.data?.message || e.message || "Failed to load presence";
      setError(message);
      if (e.response?.status === 403) {
        setError("Only employees can set presence status.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPresence();
  }, [loadPresence]);

  const handleSave = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updatePresence(
        presenceStatus,
        presenceStatus === "on_site" ? presenceClientName.trim() || null : null,
      );
      if (res.success) {
        setPresenceClientName(res.presenceClientName ?? "");
        Alert.alert("Saved", "Your presence status has been updated.");
      }
    } catch (e: any) {
      const message =
        e.response?.data?.message || e.message || "Failed to update presence";
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreenWrap,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Text
          style={[
            styles.fullScreenTitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          My Status
        </Text>
        {loading ? (
          <View style={styles.fullScreenLoading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text
              variant="bodyMedium"
              style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}
            >
              Loading...
            </Text>
          </View>
        ) : error && error.includes("Only employees") ? (
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {error}
          </Text>
        ) : (
          <>
            <View style={styles.optionsRowFull}>
              {PRESENCE_STATUSES.map(({ value, label }) => (
                <Button
                  key={value}
                  mode={presenceStatus === value ? "contained" : "outlined"}
                  onPress={() => setPresenceStatus(value)}
                  compact
                  style={styles.optionButtonFull}
                >
                  {label}
                </Button>
              ))}
            </View>
            {presenceStatus === "on_site" && (
              <TextInput
                label="Client name"
                value={presenceClientName}
                onChangeText={setPresenceClientName}
                mode="outlined"
                placeholder="Enter client name"
                style={styles.clientInputFull}
                outlineStyle={{ borderRadius: 12 }}
              />
            )}
            {error && !error.includes("Only employees") && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.error, marginTop: 8 }}
              >
                {error}
              </Text>
            )}
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              icon="content-save"
              style={styles.saveButtonFull}
            >
              Save Status
            </Button>
          </>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        embedded && styles.wrapperEmbedded,
        { borderTopColor: theme.colors.outlineVariant },
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          embedded && styles.sectionTitleEmbedded,
          SECTION_LABEL,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        My Status
      </Text>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text
            variant="bodyMedium"
            style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}
          >
            Loading...
          </Text>
        </View>
      ) : error && error.includes("Only employees") ? (
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {error}
        </Text>
      ) : (
        <>
          <View style={styles.optionsRow}>
            {PRESENCE_STATUSES.map(({ value, label }) => (
              <Button
                key={value}
                mode={presenceStatus === value ? "contained" : "outlined"}
                onPress={() => setPresenceStatus(value)}
                compact
                style={styles.optionButton}
              >
                {label}
              </Button>
            ))}
          </View>
          {presenceStatus === "on_site" && (
            <TextInput
              label="Client name"
              value={presenceClientName}
              onChangeText={setPresenceClientName}
              mode="outlined"
              placeholder="Enter client name"
              style={styles.clientInput}
              outlineStyle={{ borderRadius: 12 }}
            />
          )}
          {error && !error.includes("Only employees") && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.error, marginTop: 8 }}
            >
              {error}
            </Text>
          )}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            icon="content-save"
            style={styles.saveButton}
          >
            Save Status
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  wrapperEmbedded: {
    paddingVertical: 0,
    paddingBottom: 4,
    borderTopWidth: 0,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionTitleEmbedded: {
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    minWidth: 72,
  },
  clientInput: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  // Full-screen layout
  fullScreenWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  fullScreenTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  fullScreenLoading: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionsRowFull: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  optionButtonFull: {
    minWidth: 0,
    flex: 1,
  },
  clientInputFull: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  saveButtonFull: {
    marginTop: 4,
    borderRadius: 12,
  },
});
