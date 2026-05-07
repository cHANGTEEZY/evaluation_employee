import React, { useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useWatch, useFormContext } from "react-hook-form";
import FormInput from "../ui/FormInput";
import FormDatePicker from "../ui/FormDatePicker";
import FormSelect from "../ui/FormSelect";
import { useBanks } from "../../hooks/useBanks";

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
  const { setValue } = useFormContext();
  const { data: banks = [] } = useBanks();
  const selectedBankName = useWatch({ name: "bank_name", defaultValue: "" });
  const currentBranchName = useWatch({
    name: "bank_branch_name",
    defaultValue: "",
  });

  const bankOptions = useMemo(
    () =>
      banks.map((b) => ({
        label: b.name,
        value: b.name,
      })),
    [banks],
  );

  const selectedBank = useMemo(
    () => banks.find((b) => b.name === selectedBankName) ?? null,
    [banks, selectedBankName],
  );

  const branchOptions = useMemo(
    () =>
      (selectedBank?.branches ?? []).map((br) => ({
        label: br.name,
        value: br.name,
      })),
    [selectedBank],
  );

  useEffect(() => {
    if (
      selectedBankName &&
      currentBranchName &&
      branchOptions.length > 0 &&
      !branchOptions.some((o) => o.value === currentBranchName)
    ) {
      setValue("bank_branch_name", "");
    }
  }, [selectedBankName, currentBranchName, branchOptions, setValue]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Basic Details
      </Text>

      <FormInput name="ref_no" label="Ref No. (Auto-generated)" disabled />
      <FormDatePicker name="valuation_date" label="Valuation Date" />
      <FormSelect
        name="bank_name"
        label="Bank"
        options={bankOptions}
        placeholder="Select bank"
      />
      <FormSelect
        name="bank_branch_name"
        label="Branch"
        options={branchOptions}
        placeholder="Select branch"
        disabled={!selectedBankName}
      />
      <FormInput name="client_name" label="Client Name" />
      <FormInput
        name="contact_number"
        label="Contact Number"
        keyboardType="phone-pad"
      />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Property Ownership & Location
      </Text>

      <FormInput name="owner_of_property" label="Owner of Property" />
      <FormInput
        name="plot_no"
        label="Plot No."
        parseAsNumber={false}
      />
      <FormInput
        name="present_property_address"
        label="Present Property Address"
      />
      <FormInput name="district" label="District" />
      <FormInput name="city" label="City" />
      <FormInput name="tole_area" label="Tole / Area" />

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
