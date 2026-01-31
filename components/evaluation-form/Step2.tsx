import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useFormContext } from "react-hook-form";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import FormPillToggleGroup from "../ui/FormPillToggleGroup";
import FormPillToggleWithSetback from "../ui/FormPillToggleWithSetback";

const propertyTypeOptions = [
  { label: "Residential", value: "residential" },
  { label: "Commercial", value: "commercial" },
  { label: "Industrial", value: "industrial" },
  { label: "Agricultural", value: "agricultural" },
];

const ownershipTypeOptions = [
  { label: "Company", value: "company" },
  { label: "Individual (Single)", value: "individual_single" },
  { label: "Individual (Joint)", value: "individual_joint" },
];

const transferOptions = [
  { label: "Sale", value: "sale" },
  { label: "Bokupatra", value: "Bokupatra" },
  { label: "Family Separation", value: "family_separation" },
  { label: "Habalish", value: "habalish" },
];

const holdTypeOptions = [
  { label: "Freehold", value: "freehold" },
  { label: "Leasehold", value: "leasehold" },
];

const roadTypeOptions = [
  { label: "Black Topped", value: "black_topped" },
  { label: "Gravel", value: "gravel" },
  { label: "Earthen", value: "earthen" },
  { label: "Concrete", value: "concrete" },
];

const directionOptions = [
  { label: "East", value: "east" },
  { label: "West", value: "west" },
  { label: "North", value: "north" },
  { label: "South", value: "south" },
];

// Access Road Direction options (includes Others)
const accessRoadDirectionOptions = [
  { label: "East", value: "east" },
  { label: "West", value: "west" },
  { label: "North", value: "north" },
  { label: "South", value: "south" },
  { label: "Others", value: "others" },
];

// Road & Access options (moved from Access & Rights)
const roadAccessOptions = [
  {
    name: "right_of_way",
    label: "Right of Way",
    icon: "road-variant" as const,
  },
  { name: "motorable_access", label: "Motorable", icon: "car" as const },
  {
    name: "electricity_available",
    label: "Electricity",
    icon: "flash" as const,
  },
  { name: "drainage_near_property", label: "Drainage", icon: "water" as const },
];

// Risk / Area options with setback fields
const riskAreaOptions = [
  {
    name: "landslide_prone_area",
    label: "Landslide",
    icon: "terrain" as const,
    setbackField: "landslide_prone_area_setback",
  },
  {
    name: "river_side",
    label: "Riverside",
    icon: "waves" as const,
    setbackField: "river_side_setback",
  },
  {
    name: "high_tension_area",
    label: "High Tension",
    icon: "transmission-tower" as const,
    setbackField: "high_tension_area_setback",
  },
  {
    name: "canal_area",
    label: "Canal",
    icon: "water-outline" as const,
    setbackField: "canal_area_setback",
  },
  {
    name: "watchlist_category",
    label: "Watchlist Category",
    icon: "alert-circle" as const,
    setbackField: "watchlist_category_setback",
  },
  {
    name: "heritage_memorial_site",
    label: "Heritage/Memorial Site",
    icon: "castle" as const,
    setbackField: "heritage_memorial_site_setback",
  },
];

const Step2 = () => {
  const { watch } = useFormContext();
  const accessRoadDirection = watch("access_road_direction");

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Property Classification
      </Text>
      <FormSelect
        name="property_type"
        label="Property Type"
        options={propertyTypeOptions}
      />
      <FormSelect
        name="property_ownership_type"
        label="Ownership Type"
        options={ownershipTypeOptions}
      />
      <FormSelect
        name="ownership_transferred_through"
        label="Transferred Through"
        options={transferOptions}
      />
      <FormSelect
        name="hold_type"
        label="Hold Type"
        options={holdTypeOptions}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Road & Access
      </Text>
      <FormSelect
        name="road_type"
        label="Road Type"
        options={roadTypeOptions}
      />
      <FormInput
        name="road_width"
        label="Road Width (ft)"
        keyboardType="numeric"
      />
      <FormSelect
        name="access_road_direction"
        label="Access Road Direction"
        options={accessRoadDirectionOptions}
      />
      {/* Show text input when "Others" is selected */}
      {accessRoadDirection === "others" && (
        <FormInput
          name="access_road_direction_others"
          label="Other Direction (specify)"
        />
      )}

      {/* Road & Access options - includes Right of Way, Motorable, Electricity, Drainage */}
      <FormPillToggleGroup options={roadAccessOptions} />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Property Dimensions
      </Text>
      <FormInput
        name="property_area_length"
        label="Property Area Length"
        keyboardType="decimal-pad"
      />
      <FormSelect
        name="property_frontage_direction"
        label="Frontage Direction"
        options={directionOptions}
      />
      <FormInput
        name="property_narrowest_length"
        label="Narrowest Length"
        keyboardType="decimal-pad"
      />
      <FormSelect
        name="property_narrowest_direction"
        label="Narrowest Direction"
        options={directionOptions}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Land Rates
      </Text>
      <FormInput
        name="commercial_rate_per_anna"
        label="Commercial Rate (per Anna)"
        keyboardType="decimal-pad"
      />
      <FormInput
        name="government_rate_per_anna"
        label="Government Rate (per Anna)"
        keyboardType="decimal-pad"
      />

      {/* Risk / Area - with Setback fields */}
      <FormPillToggleWithSetback
        options={riskAreaOptions}
        label="Risk / Area"
        setbackLabel="Setback (ft)"
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Site & Topography
      </Text>
      <FormInput
        name="high_land_ft"
        label="High Land (ft)"
        keyboardType="decimal-pad"
      />
      <FormInput
        name="low_land_ft"
        label="Low Land (ft)"
        keyboardType="decimal-pad"
      />
      <FormInput name="latitude" label="Latitude" keyboardType="decimal-pad" />
      <FormInput
        name="longitude"
        label="Longitude"
        keyboardType="decimal-pad"
      />
      <FormInput
        name="slope_degree"
        label="Slope Degree"
        keyboardType="decimal-pad"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "bold",
  },
});

export default Step2;
