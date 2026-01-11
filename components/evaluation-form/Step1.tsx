import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import FormInput from "../ui/FormInput";
import FormDatePicker from "../ui/FormDatePicker";
import FormSelect from "../ui/FormSelect";

const valuationForOptions = [
  { label: "Vacant Land", value: "vacant_land" },
  { label: "Land and Building", value: "land_and_building" },
  { label: "Ready Made House", value: "ready_made_house" },
  { label: "Apartment / Duplex", value: "apartment_duplex" },
  {
    label: "Construction / Extension / Renovation",
    value: "construction_extension_renovation",
  },
];

const Step1 = () => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Basic Details
      </Text>

      <FormInput name="ref_no" label="Ref No. (Optional)" />
      <FormDatePicker name="valuation_date" label="Valuation Date" />
      <FormInput name="branch" label="Branch" />
      <FormInput name="client_name" label="Client Name" />
      <FormInput
        name="contact_number"
        label="Contact Number"
        keyboardType="phone-pad"
      />
      <FormInput
        name="client_address_nagrita"
        label="Client Address (Nagrita)"
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Property Ownership & Location
      </Text>

      <FormInput name="owner_of_property" label="Owner of Property" />
      <FormInput name="property_address_deed" label="Property Address (Deed)" />
      <FormInput name="plot_no" label="Plot No. (Optional)" />
      <FormInput
        name="present_property_address"
        label="Present Property Address"
      />
      <FormInput name="district" label="District" />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Valuation Purpose
      </Text>

      <FormSelect
        name="valuation_for"
        label="Valuation For"
        options={valuationForOptions}
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

export default Step1;
