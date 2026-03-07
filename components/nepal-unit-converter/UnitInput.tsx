import React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

type UnitOption = { id: string; label: string };

type UnitInputProps = {
  value: string;
  onValueChange: (text: string) => void;
  onNumericChange?: (num: number) => void;
  units: UnitOption[];
  selectedUnitId: string;
  onUnitSelect: (unitId: string) => void;
};

const UnitInput = ({
  value,
  onValueChange,
  onNumericChange,
  units,
  selectedUnitId,
  onUnitSelect,
}: UnitInputProps) => {
  const theme = useTheme();

  const handleBlur = () => {
    const num = parseFloat(value);
    if (onNumericChange && Number.isFinite(num)) {
      onNumericChange(num);
    }
  };

  const dropdownOptions = units.map((u) => ({ label: u.label, value: u.id }));

  return (
    <View style={styles.container}>
      <TextInput
        label="Enter Value"
        placeholder="0"
        value={value}
        onChangeText={onValueChange}
        onBlur={handleBlur}
        keyboardType="decimal-pad"
        mode="outlined"
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
      />
      <View style={styles.dropdownWrap}>
        <Dropdown
          label="From Unit"
          placeholder="Select unit"
          options={dropdownOptions}
          value={selectedUnitId}
          onSelect={onUnitSelect}
          mode="outlined"
        />
      </View>
    </View>
  );
};

export default UnitInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  dropdownWrap: {
    marginBottom: 0,
  },
});
