import { StyleSheet, View, ScrollView } from "react-native";
import React, { useState } from "react";
import { Text, useTheme, SegmentedButtons } from "react-native-paper";
import { useFormContext } from "react-hook-form";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";

type Step6Props = {};

const onlinePaymentModeOptions = [
  { label: "eSewa", value: "esewa" },
  { label: "Khalti", value: "khalti" },
  { label: "Mobile Banking", value: "mobile_banking" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "FonePay", value: "fonepay" },
  { label: "Other", value: "other" },
];

const Step6 = (_props: Step6Props) => {
  const form = useFormContext();
  const pendingDue = form.watch("payment_pending_due");

  const [paymentType, setPaymentType] = useState<"cash" | "online">("cash");

  const theme = useTheme();

  const handlePaymentTypeChange = (value: string) => {
    setPaymentType(value as "cash" | "online");
    if (value === "cash") {
      form.setValue("payment_online", undefined);
      form.setValue("payment_online_mode", undefined);
    } else {
      form.setValue("payment_cash", undefined);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="titleMedium" style={styles.title}>
        Payment & Details
      </Text>
      <Text
        variant="bodySmall"
        style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}
      >
        Enter payment details. A PDF receipt will be generated upon submission.
      </Text>

      <FormInput
        name="site_charge"
        label="Site Charge (Total Amount)"
        keyboardType="decimal-pad"
      />

      <Text
        variant="labelMedium"
        style={[styles.paymentTypeLabel, { color: theme.colors.onSurface }]}
      >
        Payment Method
      </Text>
      <SegmentedButtons
        value={paymentType}
        onValueChange={handlePaymentTypeChange}
        buttons={[
          { value: "cash", label: "Cash", icon: "cash" },
          { value: "online", label: "Online", icon: "cellphone" },
        ]}
        style={styles.segmentedButtons}
      />

      {paymentType === "cash" ? (
        <FormInput
          name="payment_cash"
          label="Cash Payment Amount"
          keyboardType="decimal-pad"
        />
      ) : (
        <>
          <FormSelect
            name="payment_online_mode"
            label="Online Payment Mode"
            options={onlinePaymentModeOptions}
          />
          <FormInput
            name="payment_online"
            label="Online Payment Amount"
            keyboardType="decimal-pad"
          />
        </>
      )}

      <FormInput
        name="payment_pending_due"
        label="Pending Due (if any)"
        keyboardType="decimal-pad"
      />

      {(pendingDue ?? 0) > 0 && (
        <View
          style={[
            styles.pendingNotice,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <Text style={{ color: theme.colors.onErrorContainer }}>
            ⚠️ Admin will be notified about pending due of Rs. {pendingDue}
          </Text>
        </View>
      )}

      <FormInput
        name="site_plan_note"
        label="Remarks"
        multiline
        numberOfLines={3}
      />
    </ScrollView>
  );
};

export default Step6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  helper: {
    marginBottom: 12,
  },
  paymentTypeLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  pendingNotice: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
  },
});
