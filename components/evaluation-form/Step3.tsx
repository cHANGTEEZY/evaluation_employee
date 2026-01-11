import React from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Text, Card, useTheme, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Controller, useFormContext } from "react-hook-form";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import FormDatePicker from "../ui/FormDatePicker";

const buildingTypeOptions = [
  { label: "RCC Framed", value: "rcc_framed" },
  { label: "Steel", value: "steel" },
  { label: "Load Bearing", value: "load_bearing" },
  { label: "Others", value: "others" },
];

const buildingPurposeOptions = [
  { label: "Residential", value: "residential" },
  { label: "Commercial", value: "commercial" },
  { label: "Both", value: "both" },
];

// Document configuration
const documents = [
  {
    key: "citizenship_client",
    label: "Citizenship (Client)",
    icon: "card-account-details",
  },
  {
    key: "citizenship_owner",
    label: "Citizenship (Owner)",
    icon: "card-account-details-outline",
  },
  { key: "lorc", label: "LORC", icon: "file-document" },
  { key: "bptm", label: "BPTM", icon: "file-certificate" },
  { key: "charkilla", label: "Charkilla", icon: "map-marker-outline" },
  { key: "blueprint", label: "Blueprint", icon: "floor-plan" },
  { key: "plot_utar", label: "Plot Utar", icon: "image-area" },
  { key: "nirmal_lagat", label: "Nirmal Lagat", icon: "file-document-outline" },
  {
    key: "nirmal_sangarna",
    label: "Nirmal Sangarna",
    icon: "file-sign",
  },
  {
    key: "building_drawing",
    label: "Building Drawing",
    icon: "pencil-ruler",
  },
];

type DocumentRowProps = {
  docKey: string;
  label: string;
  icon: string;
};

const DocumentRow = ({ docKey, label, icon }: DocumentRowProps) => {
  const { control, setValue, watch } = useFormContext();
  const theme = useTheme();

  const originalValue = watch(`documents.${docKey}.original`);
  const photocopyValue = watch(`documents.${docKey}.photocopy`);

  const ToggleChip = ({
    isSelected,
    label,
    onPress,
    isOriginal,
  }: {
    isSelected: boolean;
    label: string;
    onPress: () => void;
    isOriginal?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggleChip,
        {
          backgroundColor: isSelected
            ? isOriginal
              ? theme.colors.primaryContainer
              : theme.colors.secondaryContainer
            : theme.colors.surfaceVariant,
          borderColor: isSelected
            ? isOriginal
              ? theme.colors.primary
              : theme.colors.secondary
            : theme.colors.outline,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={isSelected ? "check-circle" : "circle-outline"}
        size={18}
        color={
          isSelected
            ? isOriginal
              ? theme.colors.primary
              : theme.colors.secondary
            : theme.colors.outline
        }
      />
      <Text
        style={[
          styles.toggleChipText,
          {
            color: isSelected
              ? isOriginal
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSecondaryContainer
              : theme.colors.onSurfaceVariant,
            fontWeight: isSelected ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.documentRow,
        { backgroundColor: theme.colors.surfaceVariant + "40" },
      ]}
    >
      <View style={styles.documentInfo}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={theme.colors.primary}
        />
        <Text style={[styles.documentLabel, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      </View>

      <View style={styles.toggleContainer}>
        <Controller
          control={control}
          name={`documents.${docKey}.original`}
          render={({ field: { value } }) => (
            <ToggleChip
              isSelected={!!value}
              label="Original"
              isOriginal={true}
              onPress={() => setValue(`documents.${docKey}.original`, !value)}
            />
          )}
        />
        <Controller
          control={control}
          name={`documents.${docKey}.photocopy`}
          render={({ field: { value } }) => (
            <ToggleChip
              isSelected={!!value}
              label="Photocopy"
              isOriginal={false}
              onPress={() => setValue(`documents.${docKey}.photocopy`, !value)}
            />
          )}
        />
      </View>
    </View>
  );
};

const Step3 = () => {
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Building Details Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Building Details
      </Text>
      <FormSelect
        name="building_type"
        label="Building Type"
        options={buildingTypeOptions}
      />
      <FormSelect
        name="building_purpose"
        label="Building Purpose"
        options={buildingPurposeOptions}
      />
      <FormInput
        name="number_of_storeys"
        label="Number of Storeys"
        keyboardType="numeric"
      />
      <FormInput
        name="storey_height"
        label="Storey Height (ft)"
        keyboardType="decimal-pad"
      />
      <FormInput
        name="building_age_years"
        label="Building Age (Years)"
        keyboardType="numeric"
      />
      <FormDatePicker name="completion_date" label="Completion Date" />

      {/* Documents Section - Redesigned */}
      <View style={styles.documentsSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Required Documents
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
        >
          Tap to select whether you have the original or photocopy
        </Text>

        <Card style={styles.documentsCard} mode="outlined">
          <Card.Content style={styles.documentsCardContent}>
            {documents.map((doc, index) => (
              <React.Fragment key={doc.key}>
                <DocumentRow
                  docKey={doc.key}
                  label={doc.label}
                  icon={doc.icon}
                />
                {index < documents.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
      </View>

      {/* Site Plan Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Additional Notes
      </Text>
      <FormInput
        name="site_plan_note"
        label="Site Plan Note"
        multiline
        numberOfLines={4}
        placeholder="Enter any additional notes about the site plan..."
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
  helperText: {
    marginBottom: 12,
  },
  documentsSection: {
    marginTop: 8,
  },
  documentsCard: {
    marginBottom: 16,
  },
  documentsCardContent: {
    padding: 0,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  documentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  documentLabel: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  toggleChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  toggleChipText: {
    fontSize: 12,
  },
  divider: {
    marginHorizontal: 16,
  },
});

export default Step3;
