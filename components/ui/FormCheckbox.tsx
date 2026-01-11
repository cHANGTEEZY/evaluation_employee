import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Checkbox, Text, HelperText, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";

type FormCheckboxProps = {
  name: string;
  label: string;
  disabled?: boolean;
};

const FormCheckbox = ({ name, label, disabled }: FormCheckboxProps) => {
  const { control } = useFormContext();
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => !disabled && onChange(!value)}
            activeOpacity={0.7}
          >
            <Checkbox
              status={value ? "checked" : "unchecked"}
              onPress={() => !disabled && onChange(!value)}
              disabled={disabled}
            />
            <Text style={{ flex: 1, color: theme.colors.onSurface }}>{label}</Text>
          </TouchableOpacity>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default FormCheckbox;
