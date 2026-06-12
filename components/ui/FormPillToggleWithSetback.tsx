import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FormInput from "./FormInput";
type ToggleOption = {
    name: string;
    label: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    setbackField?: string;
};
type FormPillToggleWithSetbackProps = {
    options: ToggleOption[];
    label?: string;
    setbackLabel?: string;
};
const FormPillToggleWithSetback = ({ options, label, setbackLabel = "Setback (ft)", }: FormPillToggleWithSetbackProps) => {
    const { control, watch, setValue } = useFormContext();
    const theme = useTheme();
    return (<View style={styles.container}>
      {label && (<Text variant="titleMedium" style={styles.groupLabel}>
          {label}
        </Text>)}
      {options.map((option) => (<Controller key={option.name} control={control} name={option.name} render={({ field: { value } }) => {
                const isSelected = !!value;
                return (<View style={styles.optionContainer}>
                <Pressable onPress={() => setValue(option.name, !value)} style={[
                        styles.pill,
                        {
                            backgroundColor: isSelected
                                ? theme.colors.primaryContainer
                                : theme.colors.surfaceVariant,
                            borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.outline,
                        },
                    ]}>
                  {option.icon && (<MaterialCommunityIcons name={option.icon} size={18} color={isSelected
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant} style={styles.icon}/>)}
                  <Text style={[
                        styles.pillText,
                        {
                            color: isSelected
                                ? theme.colors.onPrimaryContainer
                                : theme.colors.onSurfaceVariant,
                        },
                    ]}>
                    {option.label}
                  </Text>
                  {isSelected && (<MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} style={styles.checkIcon}/>)}
                </Pressable>

                
                {isSelected && option.setbackField && (<View style={styles.setbackContainer}>
                    <FormInput name={option.setbackField} label={setbackLabel} keyboardType="decimal-pad"/>
                  </View>)}
              </View>);
            }}/>))}
    </View>);
};
const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    groupLabel: {
        marginBottom: 12,
        fontWeight: "600",
    },
    optionContainer: {
        marginBottom: 8,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        alignSelf: "flex-start",
    },
    pillText: {
        fontSize: 14,
        fontWeight: "500",
    },
    icon: {
        marginRight: 6,
    },
    checkIcon: {
        marginLeft: 6,
    },
    setbackContainer: {
        marginTop: 8,
        marginLeft: 16,
    },
});
export default FormPillToggleWithSetback;
