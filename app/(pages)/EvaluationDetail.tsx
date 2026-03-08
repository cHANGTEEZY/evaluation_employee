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
import { useAuthSession } from "../../lib/auth-store";

const EvaluationDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthSession();

  const [valuation, setValuation] = useState<ValuationRow | null>(null);
  const [formValues, setFormValues] =
    useState<Partial<ValuationFormValues> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const inset = useSafeAreaInsets();

  useEffect(() => {
    loadValuation();
  }, [id]);

  const loadValuation = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      const data = await getValuationById(id);
      if (!data) return;
      // Only the creator can access this valuation; when logged out, no access
      if (!isAuthenticated || !user) {
        setAccessDenied(true);
        setValuation(null);
        setFormValues(null);
        return;
      }
      if (data.employee_id !== user.id) {
        setAccessDenied(true);
        setValuation(null);
        setFormValues(null);
        return;
      }
      setValuation(data);
      setFormValues(rowToFormValues(data));
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
      ],
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

  if (accessDenied || !valuation || !formValues) {
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
          <Text
            variant="titleMedium"
            style={{ marginTop: 16, textAlign: "center" }}
          >
            {accessDenied
              ? !isAuthenticated
                ? "Log in to see your valuations"
                : "You don't have access to this valuation"
              : "Valuation not found"}
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
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.header}
      >
        <View style={[styles.headerContent, { paddingTop: inset.top + 8 }]}>
          <IconButton
            icon="arrow-left"
            iconColor="white"
            size={24}
            onPress={() => router.back()}
          />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text
              variant="titleLarge"
              style={{
                color: "white",
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              {valuation.client_name || "Unnamed Valuation"}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: "rgba(255,255,255,0.9)", marginTop: 2 }}
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
                valuation.sync_status,
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
        {/* 0. Property Location (matches form Step 0) */}
        {(valuation.latitude != null || valuation.longitude != null) && (
          <Card style={styles.card}>
            <Card.Title
              title="Property Location"
              left={(props) => (
                <List.Icon {...props} icon="map-marker-outline" />
              )}
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
            </Card.Content>
          </Card>
        )}

        {/* 1. Basic Details (matches form Step 1) */}
        <Card style={styles.card}>
          <Card.Title
            title="Basic Details"
            left={(props) => (
              <List.Icon {...props} icon="information-outline" />
            )}
          />
          <Card.Content>
            <InfoRow label="Ref No." value={valuation.ref_no} />
            <InfoRow
              label="Valuation Date"
              value={formatDate(valuation.valuation_date)}
            />
            <InfoRow label="Branch" value={valuation.branch} />
            <InfoRow label="Bank Name" value={valuation.bank_name} />
            <InfoRow
              label="Bank Branch Name"
              value={valuation.bank_branch_name}
            />
            <InfoRow label="Client Name" value={valuation.client_name} />
            <InfoRow label="Contact Number" value={valuation.contact_number} />
            <InfoRow
              label="Client Address (Nagrita)"
              value={valuation.client_address_nagrita}
            />
            <InfoRow
              label="Owner of Property"
              value={valuation.owner_of_property}
            />
            <InfoRow
              label="Property Address (Deed)"
              value={valuation.property_address_deed}
            />
            <InfoRow label="Plot No." value={valuation.plot_no} />
            <InfoRow
              label="Present Property Address"
              value={valuation.present_property_address}
            />
            <InfoRow label="District" value={valuation.district} />
            <InfoRow label="City" value={valuation.city} />
            <InfoRow label="Tole / Area" value={valuation.tole_area} />
            <InfoRow label="Valuation For" value={valuation.valuation_for} />
          </Card.Content>
        </Card>

        {/* 2. Property Details (matches form Step 2) */}
        <Card style={styles.card}>
          <Card.Title
            title="Property Details"
            left={(props) => <List.Icon {...props} icon="home-outline" />}
          />
          <Card.Content>
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
            <Divider style={{ marginVertical: 12 }} />
            <InfoRow label="Road Type" value={valuation.road_type} />
            <InfoRow
              label="Road Width"
              value={
                valuation.road_width != null
                  ? `${valuation.road_width} ft`
                  : null
              }
            />
            <InfoRow
              label="Access Road Direction"
              value={valuation.access_road_direction}
            />
            <InfoRow
              label="Property Area Length"
              value={
                valuation.property_area_length != null
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
              label="Electricity Available"
              value={formatBoolean(valuation.electricity_available)}
            />
            <InfoRow
              label="Drainage Near Property"
              value={formatBoolean(valuation.drainage_near_property)}
            />
            <Divider style={{ marginVertical: 12 }} />
            <InfoRow
              label="Commercial Rate (per anna)"
              value={
                valuation.commercial_rate_per_anna != null
                  ? `NPR ${valuation.commercial_rate_per_anna.toLocaleString()}`
                  : null
              }
            />
            <InfoRow
              label="Government Rate (per anna)"
              value={
                valuation.government_rate_per_anna != null
                  ? `NPR ${valuation.government_rate_per_anna.toLocaleString()}`
                  : null
              }
            />
            <InfoRow
              label="High Land (ft)"
              value={valuation.high_land_ft?.toString()}
            />
            <InfoRow
              label="Low Land (ft)"
              value={valuation.low_land_ft?.toString()}
            />
            <InfoRow
              label="Slope (degrees)"
              value={
                valuation.slope_degree != null
                  ? `${valuation.slope_degree}°`
                  : null
              }
            />
            <InfoRow
              label="Landslide Prone Area"
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

        {/* 3. Building & Documents (matches form Step 3) */}
        <Card style={styles.card}>
          <Card.Title
            title="Building & Documents"
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
                valuation.storey_height != null
                  ? `${valuation.storey_height} ft`
                  : null
              }
            />
            <InfoRow
              label="Building Age (years)"
              value={valuation.building_age_years?.toString()}
            />
            <InfoRow
              label="Completion Date"
              value={formatDate(valuation.completion_date)}
            />
          </Card.Content>
        </Card>

        {/* 4. Site Plan & Payment (matches form Step 4) */}
        <Card style={styles.card}>
          <Card.Title
            title="Site Plan & Payment"
            left={(props) => <List.Icon {...props} icon="currency-usd" />}
          />
          <Card.Content>
            {valuation.site_plan_note ? (
              <>
                <InfoRow
                  label="Site Plan Note"
                  value={valuation.site_plan_note}
                />
                <Divider style={{ marginVertical: 12 }} />
              </>
            ) : null}
            <InfoRow
              label="Site Charge"
              value={
                valuation.site_charge != null
                  ? `NPR ${valuation.site_charge.toLocaleString()}`
                  : null
              }
            />
            <InfoRow
              label="Payment (Cash)"
              value={
                valuation.payment_cash != null
                  ? `NPR ${valuation.payment_cash.toLocaleString()}`
                  : null
              }
            />
            <InfoRow
              label="Payment (Online)"
              value={
                valuation.payment_online != null
                  ? `NPR ${valuation.payment_online.toLocaleString()}`
                  : null
              }
            />
            <InfoRow
              label="Payment Online Mode"
              value={valuation.payment_online_mode}
            />
            <InfoRow
              label="Payment Pending Due"
              value={
                valuation.payment_pending_due != null
                  ? `NPR ${valuation.payment_pending_due.toLocaleString()}`
                  : null
              }
            />
          </Card.Content>
        </Card>

        {/* 5. Property Images (matches form Step 5) */}
        {valuation.property_images &&
          (() => {
            try {
              const images = JSON.parse(valuation.property_images) as string[];
              if (Array.isArray(images) && images.length > 0) {
                return (
                  <Card style={styles.card}>
                    <Card.Title
                      title="Property Images"
                      left={(props) => (
                        <List.Icon {...props} icon="image-multiple-outline" />
                      )}
                    />
                    <Card.Content>
                      <Text variant="bodyMedium">
                        {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                        attached
                      </Text>
                    </Card.Content>
                  </Card>
                );
              }
            } catch {
              // ignore
            }
            return null;
          })()}

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
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerChips: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 10,
    gap: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    borderRadius: 16,
  },
});
