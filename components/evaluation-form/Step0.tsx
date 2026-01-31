import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useFormContext } from "react-hook-form";
import LocationPicker from "../LocationPicker";
import type { ValuationFormValues } from "../../constants/form-schema";

/**
 * Step 0 - Location Selection (Required before proceeding)
 *
 * This step must be completed to capture property coordinates
 * before the user can proceed to other form steps.
 */
const Step0 = () => {
  const { setValue, watch } = useFormContext<ValuationFormValues>();

  const currentLatitude = watch("latitude");
  const currentLongitude = watch("longitude");

  const handleLocationSelect = (latitude: number, longitude: number) => {
    setValue("latitude", latitude, { shouldValidate: true, shouldDirty: true });
    setValue("longitude", longitude, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* <Text variant="headlineSmall" style={styles.heading}>
        📍 Select Property Location
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        Please select the property location on the map by dropping a pin or
        using your device's GPS. This step is required before proceeding.
      </Text> */}

      <LocationPicker
        initialLatitude={currentLatitude}
        initialLongitude={currentLongitude}
        onLocationSelect={handleLocationSelect}
        editable={true}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  heading: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 22,
  },
});

export default Step0;
