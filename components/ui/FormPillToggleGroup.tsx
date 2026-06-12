import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";
type ToggleOption = {
    name: string;
    label: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};
type FormPillToggleGroupProps = {
    options: ToggleOption[];
    label?: string;
};
const FormPillToggleGroup = ({ options, label }: FormPillToggleGroupProps) => {
    const { control, watch, setValue } = useFormContext();
    const theme = useTheme();
    return (<View style={styles.container}>
      {label && (<Text variant="titleMedium" style={styles.groupLabel}>
          {label}
        </Text>)}
      <View style={styles.pillContainer}>
        {options.map((option) => (<Controller key={option.name} control={control} name={option.name} render={({ field: { value } }) => {
                const isSelected = !!value;
                return (<Pressable onPress={() => setValue(option.name, !value)} style={[
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
                </Pressable>);
            }}/>))}
      </View>
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
    pillContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
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
});
export default FormPillToggleGroup;
