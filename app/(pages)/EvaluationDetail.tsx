import { StyleSheet, View, ScrollView, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useTheme,
  Text,
  Card,
  Chip,
  IconButton,
  FAB,
  ActivityIndicator,
  List,
  Divider,
  Button,
} from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getValuationById,
  rowToFormValues,
  ValuationRow,
  deleteValuation,
  updateValuation,
} from "../../lib/schema";
import { ValuationFormValues } from "../../constants/form-schema";

const EvaluationDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [valuation, setValuation] = useState<ValuationRow | null>(null);
  const [formValues, setFormValues] =
    useState<Partial<ValuationFormValues> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const inset = useSafeAreaInsets();

  useEffect(() => {
    loadValuation();
  }, [id]);

  const loadValuation = async () => {
    try {
      setLoading(true);
      const data = await getValuationById(id);
      if (data) {
        setValuation(data);
        setFormValues(rowToFormValues(data));
      }
    } catch (error) {
      console.error("Error loading valuation:", error);
      Alert.alert("Error", "Failed to load valuation details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Valuation",
      "Are you sure you want to delete this valuation? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteValuation(id);
              Alert.alert("Success", "Valuation deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error("Error deleting valuation:", error);
              Alert.alert("Error", "Failed to delete valuation");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string, syncStatus: string) => {
    if (syncStatus === "synced") return theme.colors.tertiary;
    if (status === "submitted") return theme.colors.primary;
    return theme.colors.error;
  };

  const getStatusLabel = (status: string, syncStatus: string) => {
    if (syncStatus === "synced") return "Synced";
    if (status === "submitted") return "Submitted";
    return "Draft";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatBoolean = (value: number) => (value === 1 ? "Yes" : "No");

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16 }}>Loading valuation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!valuation || !formValues) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Text variant="titleMedium" style={{ marginTop: 16 }}>
            Valuation not found
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
      edges={["left"]}
    >
      <LinearGradient
        colors={[theme.colors.primaryContainer, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerContent, { paddingTop: inset.top }]}>
          <IconButton
            icon="arrow-left"
            iconColor="white"
            size={24}
            onPress={() => router.back()}
          />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text
              variant="titleLarge"
              style={{ color: "white", fontWeight: "bold" }}
            >
              {valuation.client_name || "Unnamed Valuation"}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {valuation.ref_no || "No Reference"}
            </Text>
          </View>
          <IconButton
            icon="delete-outline"
            iconColor="white"
            size={24}
            onPress={handleDelete}
          />
        </View>
        <View style={styles.headerChips}>
          <Chip
            icon="circle"
            style={{
              backgroundColor: getStatusColor(
                valuation.status,
                valuation.sync_status
              ),
            }}
            textStyle={{ color: "white" }}
          >
            {getStatusLabel(valuation.status, valuation.sync_status)}
          </Chip>
          <Chip
            icon="calendar"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            textStyle={{ color: "white" }}
          >
            {formatDate(valuation.valuation_date)}
          </Chip>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <Card style={styles.card}>
          <Card.Title
            title="Basic Information"
            left={(props) => (
              <List.Icon {...props} icon="information-outline" />
            )}
          />
          <Card.Content>
            <InfoRow label="Branch" value={valuation.branch} />
            <InfoRow label="Client Name" value={valuation.client_name} />
            <InfoRow label="Contact Number" value={valuation.contact_number} />
            <InfoRow
              label="Client Address"
              value={valuation.client_address_nagrita}
            />
            <InfoRow label="District" value={valuation.district} />
            <InfoRow label="Valuation For" value={valuation.valuation_for} />
          </Card.Content>
        </Card>

        {/* Property Details */}
        <Card style={styles.card}>
          <Card.Title
            title="Property Details"
            left={(props) => <List.Icon {...props} icon="home-outline" />}
          />
          <Card.Content>
            <InfoRow label="Owner" value={valuation.owner_of_property} />
            <InfoRow
              label="Property Address (Deed)"
              value={valuation.property_address_deed}
            />
            <InfoRow
              label="Present Address"
              value={valuation.present_property_address}
            />
            <InfoRow label="Plot No." value={valuation.plot_no} />
            <Divider style={{ marginVertical: 12 }} />
            <InfoRow label="Property Type" value={valuation.property_type} />
            <InfoRow
              label="Ownership Type"
              value={valuation.property_ownership_type}
            />
            <InfoRow
              label="Transferred Through"
              value={valuation.ownership_transferred_through}
            />
            <InfoRow label="Hold Type" value={valuation.hold_type} />
          </Card.Content>
        </Card>

        {/* Location & Access */}
        <Card style={styles.card}>
          <Card.Title
            title="Location & Access"
            left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
          />
          <Card.Content>
            <InfoRow label="Road Type" value={valuation.road_type} />
            <InfoRow
              label="Road Width"
              value={valuation.road_width ? `${valuation.road_width} ft` : null}
            />
            <InfoRow
              label="Access Direction"
              value={valuation.access_road_direction}
            />
            <Divider style={{ marginVertical: 12 }} />
            <InfoRow
              label="Property Area"
              value={
                valuation.property_area_length
                  ? `${valuation.property_area_length} sq ft`
                  : null
              }
            />
            <InfoRow
              label="Right of Way"
              value={formatBoolean(valuation.right_of_way)}
            />
            <InfoRow
              label="Motorable Access"
              value={formatBoolean(valuation.motorable_access)}
            />
            <InfoRow
              label="Electricity"
              value={formatBoolean(valuation.electricity_available)}
            />
            <InfoRow
              label="Drainage"
              value={formatBoolean(valuation.drainage_near_property)}
            />
          </Card.Content>
        </Card>

        {/* Building Information */}
        {valuation.building_type && (
          <Card style={styles.card}>
            <Card.Title
              title="Building Information"
              left={(props) => (
                <List.Icon {...props} icon="office-building-outline" />
              )}
            />
            <Card.Content>
              <InfoRow label="Building Type" value={valuation.building_type} />
              <InfoRow
                label="Building Purpose"
                value={valuation.building_purpose}
              />
              <InfoRow
                label="Number of Storeys"
                value={valuation.number_of_storeys?.toString()}
              />
              <InfoRow
                label="Storey Height"
                value={
                  valuation.storey_height
                    ? `${valuation.storey_height} ft`
                    : null
                }
              />
              <InfoRow
                label="Building Age"
                value={
                  valuation.building_age_years
                    ? `${valuation.building_age_years} years`
                    : null
                }
              />
              <InfoRow
                label="Completion Date"
                value={formatDate(valuation.completion_date)}
              />
            </Card.Content>
          </Card>
        )}

        {/* Land Rates */}
        <Card style={styles.card}>
          <Card.Title
            title="Land Rates"
            left={(props) => <List.Icon {...props} icon="currency-usd" />}
          />
          <Card.Content>
            <InfoRow
              label="Commercial Rate"
              value={
                valuation.commercial_rate_per_anna
                  ? `NPR ${valuation.commercial_rate_per_anna.toLocaleString()}/anna`
                  : null
              }
            />
            <InfoRow
              label="Government Rate"
              value={
                valuation.government_rate_per_anna
                  ? `NPR ${valuation.government_rate_per_anna.toLocaleString()}/anna`
                  : null
              }
            />
            <InfoRow
              label="Site Charge"
              value={
                valuation.site_charge
                  ? `NPR ${valuation.site_charge.toLocaleString()}`
                  : null
              }
            />
          </Card.Content>
        </Card>

        {/* Topography */}
        {(valuation.latitude ||
          valuation.longitude ||
          valuation.slope_degree) && (
          <Card style={styles.card}>
            <Card.Title
              title="Topography"
              left={(props) => <List.Icon {...props} icon="terrain" />}
            />
            <Card.Content>
              <InfoRow
                label="Latitude"
                value={valuation.latitude?.toString()}
              />
              <InfoRow
                label="Longitude"
                value={valuation.longitude?.toString()}
              />
              <InfoRow
                label="Slope"
                value={
                  valuation.slope_degree ? `${valuation.slope_degree}°` : null
                }
              />
              <InfoRow
                label="High Land"
                value={
                  valuation.high_land_ft ? `${valuation.high_land_ft} ft` : null
                }
              />
              <InfoRow
                label="Low Land"
                value={
                  valuation.low_land_ft ? `${valuation.low_land_ft} ft` : null
                }
              />
            </Card.Content>
          </Card>
        )}

        {/* Risk Areas */}
        <Card style={styles.card}>
          <Card.Title
            title="Risk Assessment"
            left={(props) => <List.Icon {...props} icon="alert-outline" />}
          />
          <Card.Content>
            <InfoRow
              label="Landslide Prone"
              value={formatBoolean(valuation.landslide_prone_area)}
            />
            <InfoRow
              label="River Side"
              value={formatBoolean(valuation.river_side)}
            />
            <InfoRow
              label="High Tension Area"
              value={formatBoolean(valuation.high_tension_area)}
            />
            <InfoRow
              label="Canal Area"
              value={formatBoolean(valuation.canal_area)}
            />
          </Card.Content>
        </Card>

        {/* Site Notes */}
        {valuation.site_plan_note && (
          <Card style={styles.card}>
            <Card.Title
              title="Site Notes"
              left={(props) => (
                <List.Icon {...props} icon="note-text-outline" />
              )}
            />
            <Card.Content>
              <Text variant="bodyMedium">{valuation.site_plan_note}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Metadata */}
        <Card style={[styles.card, { marginBottom: 100 }]}>
          <Card.Title
            title="Metadata"
            left={(props) => (
              <List.Icon {...props} icon="information-variant" />
            )}
          />
          <Card.Content>
            <InfoRow label="Created" value={formatDate(valuation.created_at)} />
            <InfoRow
              label="Last Updated"
              value={formatDate(valuation.updated_at)}
            />
            {valuation.submitted_at && (
              <InfoRow
                label="Submitted"
                value={formatDate(valuation.submitted_at)}
              />
            )}
            {valuation.synced_at && (
              <InfoRow label="Synced" value={formatDate(valuation.synced_at)} />
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="pencil"
        label="Edit"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          router.push({
            pathname: "/(pages)/EvaluationForm",
            params: { id, mode: "edit" },
          });
        }}
      />
    </SafeAreaView>
  );
};

// Helper component for info rows
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => {
  const theme = useTheme();

  if (!value || value === "N/A") return null;

  return (
    <View style={styles.infoRow}>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
      >
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flex: 2, fontWeight: "500" }}>
        {value}
      </Text>
    </View>
  );
};

export default EvaluationDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerChips: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 8,
    gap: 16,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});
