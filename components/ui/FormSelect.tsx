import React from "react";
import { View, StyleSheet } from "react-native";
import { HelperText, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";
import { Dropdown } from "react-native-paper-dropdown";
type Option = {
    label: string;
    value: string;
};
type FormSelectProps = {
    name: string;
    label: string;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
};
const FormSelect = ({ name, label, options, placeholder, disabled, }: FormSelectProps) => {
    const { control } = useFormContext();
    const theme = useTheme();
    return (<Controller control={control} name={name} render={({ field: { onChange, value }, fieldState: { error } }) => (<View style={styles.container}>
          <Dropdown label={label} placeholder={placeholder} options={options} value={value} onSelect={onChange} mode="outlined" disabled={disabled}/>
          {error && <HelperText type="error">{error.message}</HelperText>}
        </View>)}/>);
};
const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
});
export default FormSelect;
