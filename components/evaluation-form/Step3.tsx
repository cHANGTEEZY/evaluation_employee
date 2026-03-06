import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Modal,
} from "react-native";
import { Text, Card, useTheme, Divider, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Controller, useFormContext } from "react-hook-form";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import FormDatePicker from "../ui/FormDatePicker";
import PhotoCaptureScreen from "../PhotoCaptureScreen";

function getFloorLabel(index: number): string {
  if (index === 0) return "Ground floor";
  if (index === 1) return "1st floor";
  if (index === 2) return "2nd floor";
  if (index === 3) return "3rd floor";
  return `${index}th floor`;
}

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

// Document configuration (BPTM removed – same as Blueprint; spellings: Nirman Ijajat, Nirman Sampanna)
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
  { key: "charkilla", label: "Charkilla", icon: "map-marker-outline" },
  { key: "blueprint", label: "Blueprint", icon: "floor-plan" },
  { key: "plot_utar", label: "Plot Utar", icon: "image-area" },
  {
    key: "nirman_ijajat",
    label: "Nirman Ijajat",
    icon: "file-document-outline",
  },
  {
    key: "nirman_sampanna",
    label: "Nirman Sampanna",
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

function DocumentPhotosField() {
  const theme = useTheme();
  const { setValue, watch } = useFormContext();
  const documentPhotos = watch("document_photos") ?? [];
  const photos = Array.isArray(documentPhotos) ? documentPhotos : [];
  const [modalVisible, setModalVisible] = useState(false);

  const handleImagesChange = (next: string[]) => {
    setValue("document_photos", next);
  };

  return (
    <View style={styles.documentPhotosSection}>
      <Button
        mode="outlined"
        onPress={() => setModalVisible(true)}
        icon="camera-plus"
        style={styles.documentPhotosButton}
      >
        {photos.length > 0
          ? `Document photos (${photos.length}) – tap to add more`
          : "Add document photos"}
      </Button>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View
          style={[
            styles.documentPhotosModalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <PhotoCaptureScreen
            images={photos}
            onImagesChange={handleImagesChange}
            minImages={0}
            title="Document photos"
            helperText="Tap thumbnail to view • Tap delete in preview to remove. No limit."
            showCloseButton
            onClose={() => setModalVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const Step3 = () => {
  const theme = useTheme();
  const { watch, setValue } = useFormContext();
  const valuationFor = watch("valuation_for");
  const showBuildingDetails = valuationFor === "land_and_building";
  const numberOfStoreys = watch("number_of_storeys");
  const existingRates = watch("building_rate_per_sqft") ?? [];

  const numStoreys =
    typeof numberOfStoreys === "number" && numberOfStoreys >= 1
      ? Math.min(Math.floor(numberOfStoreys), 99)
      : 0;

  // Keep building_rate_per_sqft array length in sync with number_of_storeys
  useEffect(() => {
    if (!showBuildingDetails || numStoreys <= 0) return;
    const current = (existingRates as (number | undefined)[]) ?? [];
    if (current.length === numStoreys) return;
    const next: (number | undefined)[] = Array.from(
      { length: numStoreys },
      (_, i) => (i < current.length ? current[i] : undefined),
    );
    setValue("building_rate_per_sqft", next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBuildingDetails, numStoreys]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Building Details Section (only for Land & Building) */}
      {showBuildingDetails && (
        <>
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
            label="Number of storeys"
            keyboardType="numeric"
          />
          <FormInput
            name="storey_height"
            label="Storey height (ft)"
            keyboardType="decimal-pad"
          />
          {numStoreys > 0 && (
            <View style={styles.ratePerSqftSection}>
              <Text variant="titleSmall" style={styles.ratePerSqftTitle}>
                Rate per sq ft (NPR) by floor
              </Text>
              {Array.from({ length: numStoreys }, (_, i) => (
                <FormInput
                  key={i}
                  name={`building_rate_per_sqft.${i}`}
                  label={`${getFloorLabel(i)} – Rate per sq ft (NPR)`}
                  keyboardType="decimal-pad"
                />
              ))}
            </View>
          )}
        </>
      )}

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

      {/* Document photos (optional, no limit) */}
      <View style={styles.documentsSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Document photos (optional)
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
        >
          Add photos of documents collected on site. No limit.
        </Text>
        <DocumentPhotosField />
      </View>

      {/* Site Plan Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Remarks
      </Text>
      <FormInput
        name="remarks"
        label="Remarks"
        multiline
        numberOfLines={4}
        placeholder="Enter any additional notes..."
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
  documentPhotosSection: {
    marginBottom: 16,
  },
  documentPhotosButton: {
    marginBottom: 8,
  },
  documentPhotosModalContent: {
    flex: 1,
  },
  ratePerSqftSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  ratePerSqftTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
});

export default Step3;
