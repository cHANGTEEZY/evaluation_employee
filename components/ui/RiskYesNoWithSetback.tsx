import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, RadioButton, useTheme } from "react-native-paper";
import { Controller, useFormContext } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FormInput from "./FormInput";
type RiskOption = {
    name: string;
    label: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    setbackField?: string;
};
type RiskYesNoWithSetbackProps = {
    options: RiskOption[];
    label?: string;
    setbackLabel?: string;
};
const RiskYesNoWithSetback = ({ options, label, setbackLabel = "Setback (ft)", }: RiskYesNoWithSetbackProps) => {
    const { control } = useFormContext();
    const theme = useTheme();
    return (<View style={styles.container}>
      {label && (<Text variant="titleMedium" style={styles.groupLabel}>
          {label}
        </Text>)}
      {options.map((option) => (<Controller key={option.name} control={control} name={option.name} render={({ field: { value, onChange } }) => {
                const current = value as boolean | undefined;
                return (<View style={styles.optionContainer}>
                <View style={styles.optionHeader}>
                  {option.icon && (<MaterialCommunityIcons name={option.icon} size={20} color={theme.colors.primary} style={styles.icon}/>)}
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>

                <RadioButton.Group onValueChange={(val) => onChange(val === "yes" ? true : val === "no" ? false : undefined)} value={current === true ? "yes" : current === false ? "no" : undefined}>
                  <View style={styles.radioRow}>
                    <Pressable style={[
                        styles.radioItem,
                        current === true && {
                            backgroundColor: theme.colors.primaryContainer,
                            borderColor: theme.colors.primary,
                        },
                    ]} onPress={() => onChange(true)} hitSlop={8}>
                      <RadioButton value="yes"/>
                      <Text>Yes</Text>
                    </Pressable>
                    <Pressable style={[
                        styles.radioItem,
                        current === false && {
                            backgroundColor: theme.colors.surfaceVariant,
                            borderColor: theme.colors.primary,
                        },
                    ]} onPress={() => onChange(false)} hitSlop={8}>
                      <RadioButton value="no"/>
                      <Text>No</Text>
                    </Pressable>
                  </View>
                </RadioButton.Group>

                {current === true && option.setbackField && (<View style={styles.setbackContainer}>
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
        marginBottom: 12,
    },
    optionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    icon: {
        marginRight: 6,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: "500",
    },
    radioRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    radioItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
    },
    setbackContainer: {
        marginTop: 4,
        marginLeft: 8,
    },
});
export default RiskYesNoWithSetback;
