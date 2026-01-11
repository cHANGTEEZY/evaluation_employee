import React from "react";
import { View, StyleSheet } from "react-native";
import { HelperText, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";
import { DatePickerInput } from "react-native-paper-dates";
import { enGB, registerTranslation } from 'react-native-paper-dates';

registerTranslation('en-GB', enGB);

type FormDatePickerProps = {
  name: string;
  label: string;
  disabled?: boolean;
};

const FormDatePicker = ({ name, label, disabled }: FormDatePickerProps) => {
  const { control } = useFormContext();
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <DatePickerInput
            locale="en-GB"
            label={label}
            value={value ? new Date(value) : undefined}
            onChange={onChange}
            inputMode="start"
            mode="outlined"
            disabled={disabled}
            style={{ backgroundColor: theme.colors.surface }}
          />
          {error && <HelperText type="error">{error.message}</HelperText>}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
});

export default FormDatePicker;
