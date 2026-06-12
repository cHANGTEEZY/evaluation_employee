import React from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";
import { Dropdown } from "react-native-paper-dropdown";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import FormPillToggleGroup from "../ui/FormPillToggleGroup";
import RiskYesNoWithSetback from "../ui/RiskYesNoWithSetback";

const RIGHT_OF_WAY_OPTIONS = [
  { label: "None", value: "" },
  { label: "3 m", value: "3" },
  { label: "4 m", value: "4" },
  { label: "6 m", value: "6" },
  { label: "8 m", value: "8" },
  { label: "22 m", value: "22" },
  { label: "50 m", value: "50" },
  { label: "Other", value: "other" },
];

const propertyTypeOptions = [
  { label: "Residential", value: "residential" },
  { label: "Commercial", value: "commercial" },
  { label: "Industrial", value: "industrial" },
  { label: "Agricultural", value: "agricultural" },
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
  { label: "Others", value: "others" },
];

const directionOptions = [
  { label: "East", value: "east" },
  { label: "West", value: "west" },
  { label: "North", value: "north" },
  { label: "South", value: "south" },
];

const accessRoadDirectionOptions = [
  { label: "East", value: "east" },
  { label: "West", value: "west" },
  { label: "North", value: "north" },
  { label: "South", value: "south" },
  { label: "Others", value: "others" },
];

const roadAccessOptions = [
  { name: "motorable_access", label: "Motorable", icon: "car" as const },
  {
    name: "electricity_available",
    label: "Electricity",
    icon: "flash" as const,
  },
  { name: "drainage_near_property", label: "Drainage", icon: "water" as const },
];

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
    name: "flood_prone_area",
    label: "Flood Prone Area",
    icon: "waves" as const,
    setbackField: "flood_prone_area_setback",
  },
  {
    name: "heritage_memorial_site",
    label: "Heritage/Memorial Site",
    icon: "castle" as const,
    setbackField: "heritage_memorial_site_setback",
  },
];

const Step2 = () => {
  const theme = useTheme();
  const { watch, setValue, control, getValues } = useFormContext();
  const accessRoadDirection = watch("access_road_direction");
  const roadType = watch("road_type");
  const rightOfWayWidthFt = watch("right_of_way_width_ft");

  const rightOfWayMUi = watch("right_of_way_m") ?? "";
  const landRateUnit = watch("land_rate_unit");
  const selectedRateUnit = landRateUnit === "kattha" ? "kattha" : "anna";

  const PRESET_ROW_WIDTHS = [3, 4, 6, 8, 22, 50] as const;

  const rightOfWaySelectValue = (() => {
    if (
      rightOfWayWidthFt != null &&
      rightOfWayWidthFt !== undefined &&
      PRESET_ROW_WIDTHS.includes(
        rightOfWayWidthFt as (typeof PRESET_ROW_WIDTHS)[number],
      )
    ) {
      return String(rightOfWayWidthFt);
    }
    if (
      rightOfWayWidthFt != null &&
      rightOfWayWidthFt !== undefined &&
      !PRESET_ROW_WIDTHS.includes(
        rightOfWayWidthFt as (typeof PRESET_ROW_WIDTHS)[number],
      )
    ) {
      return "other";
    }
    return rightOfWayMUi === "other" ? "other" : "";
  })();

  const handleRightOfWaySelect = (value: string) => {
    setValue("right_of_way_m", value);
    if (value === "") {
      setValue("right_of_way_width_ft", undefined);
      setValue("right_of_way", false);
    } else if (value === "other") {
      setValue("right_of_way", true);

      const w = getValues("right_of_way_width_ft");
      if (
        w != null &&
        w !== undefined &&
        PRESET_ROW_WIDTHS.includes(w as (typeof PRESET_ROW_WIDTHS)[number])
      ) {
        setValue("right_of_way_width_ft", undefined);
      }
    } else {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        setValue("right_of_way_width_ft", num);
        setValue("right_of_way", true);
      }
    }
  };

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
      {roadType === "others" && (
        <FormInput name="road_type_others" label="Other road type (specify)" />
      )}
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
      {accessRoadDirection === "others" && (
        <FormInput
          name="access_road_direction_others"
          label="Other Direction (specify)"
        />
      )}

      <Controller
        control={control}
        name="right_of_way_m"
        render={({ field: { onChange } }) => (
          <View style={styles.selectContainer}>
            <Dropdown
              label="Right of Way (m)"
              options={RIGHT_OF_WAY_OPTIONS}
              value={rightOfWaySelectValue}
              onSelect={(v) => {
                const next = v ?? "";
                handleRightOfWaySelect(next);
                onChange(next);
              }}
              mode="outlined"
            />
          </View>
        )}
      />
      {rightOfWaySelectValue === "other" && (
        <FormInput
          name="right_of_way_width_ft"
          label="Enter right of way width (m)"
          placeholder="e.g. 10"
          keyboardType="decimal-pad"
        />
      )}

      <FormPillToggleGroup options={roadAccessOptions} />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Property Dimensions
      </Text>
      <FormInput
        name="property_area_length"
        label="Frontage Length"
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
      <View style={styles.unitToggleRow}>
        <Pressable
          onPress={() => setValue("land_rate_unit", "anna")}
          style={[
            styles.unitToggleBtn,
            selectedRateUnit === "anna" && {
              backgroundColor:
                theme.colors.primaryContainer ?? theme.colors.primary,
              borderColor: theme.colors.primary,
              borderWidth: 2,
            },
          ]}
        >
          <Text
            variant="labelLarge"
            style={[
              styles.unitToggleLabel,
              {
                color:
                  selectedRateUnit === "anna"
                    ? (theme.colors.onPrimaryContainer ??
                      theme.colors.onPrimary)
                    : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            Anna
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setValue("land_rate_unit", "kattha")}
          style={[
            styles.unitToggleBtn,
            selectedRateUnit === "kattha" && {
              backgroundColor:
                theme.colors.primaryContainer ?? theme.colors.primary,
              borderColor: theme.colors.primary,
              borderWidth: 2,
            },
          ]}
        >
          <Text
            variant="labelLarge"
            style={[
              styles.unitToggleLabel,
              {
                color:
                  selectedRateUnit === "kattha"
                    ? (theme.colors.onPrimaryContainer ??
                      theme.colors.onPrimary)
                    : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            Kattha
          </Text>
        </Pressable>
      </View>
      <FormInput
        name="commercial_rate_per_anna"
        label={`Commercial Rate (per ${
          selectedRateUnit === "anna" ? "Anna" : "Kattha"
        })`}
        keyboardType="decimal-pad"
      />

      <RiskYesNoWithSetback
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
  unitToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  unitToggleBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  unitToggleLabel: {
    fontWeight: "700",
  },
  selectContainer: {
    marginBottom: 12,
  },
});

export default Step2;
