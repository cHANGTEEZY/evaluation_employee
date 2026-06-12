import React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, HelperText, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";
type FormInputProps = {
    name: string;
    label: string;
    placeholder?: string;
    keyboardType?: "default" | "numeric" | "email-address" | "phone-pad" | "decimal-pad";
    secureTextEntry?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    disabled?: boolean;
    parseAsNumber?: boolean;
};
const FormInput = ({ name, label, placeholder, keyboardType = "default", secureTextEntry, multiline, numberOfLines, disabled, parseAsNumber, }: FormInputProps) => {
    const { control } = useFormContext();
    const theme = useTheme();
    const isNumericKeyboard = keyboardType === "numeric" || keyboardType === "decimal-pad";
    const isNumeric = isNumericKeyboard && parseAsNumber !== false;
    return (<Controller control={control} name={name} render={({ field: { onChange, onBlur, value }, fieldState: { error }, }) => {
            const handleChange = (text: string) => {
                if (isNumeric) {
                    if (text === "" || text === null) {
                        onChange(undefined);
                        return;
                    }
                    const numValue = parseFloat(text);
                    if (!isNaN(numValue)) {
                        onChange(numValue);
                    }
                    else {
                        onChange(text);
                    }
                }
                else {
                    onChange(text);
                }
            };
            const displayValue = value !== undefined && value !== null ? value.toString() : "";
            return (<View style={styles.container}>
            <TextInput label={label} placeholder={placeholder} value={displayValue} onChangeText={handleChange} onBlur={onBlur} mode="outlined" error={!!error} keyboardType={keyboardType} secureTextEntry={secureTextEntry} multiline={multiline} numberOfLines={numberOfLines} disabled={disabled} style={{ backgroundColor: theme.colors.surface }}/>
            {error && <HelperText type="error">{error.message}</HelperText>}
          </View>);
        }}/>);
};
const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
});
export default FormInput;
