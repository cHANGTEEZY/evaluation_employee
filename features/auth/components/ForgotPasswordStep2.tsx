import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
type Colors = {
    inputBg: string;
    inputText: string;
    inputPlaceholder: string;
    labelText: string;
    iconColor: string;
    errorText: string;
    borderColor: string;
};
type Props = {
    colors: Colors;
    isDark: boolean;
};
const ForgotPasswordStep2 = ({ colors, isDark }: Props) => {
    const { control, formState: { errors }, } = useFormContext();
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const renderPasswordField = (name: "newPassword" | "confirmPassword", label: string, placeholder: string, show: boolean, toggle: () => void) => (<View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.labelText }]}>
        {label}
      </Text>
      <Controller control={control} name={name} render={({ field: { value, onChange } }) => (<View style={[
                styles.inputWrapper,
                {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    borderWidth: isDark ? 0 : 1,
                },
            ]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={colors.iconColor} style={styles.inputIcon}/>
            <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.inputPlaceholder} secureTextEntry={!show} autoCapitalize="none" style={[styles.textInput, { color: colors.inputText }]}/>
            <Pressable onPress={toggle} style={styles.eyeButton}>
              <MaterialCommunityIcons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.iconColor}/>
            </Pressable>
          </View>)}/>
      {errors[name]?.message && (<Text style={[styles.errorText, { color: colors.errorText }]}>
          {String(errors[name]?.message)}
        </Text>)}
    </View>);
    return (<View style={styles.container}>
      <Text style={[styles.description, { color: colors.labelText }]}>
        Create a strong password with at least 8 characters.
      </Text>

      {renderPasswordField("newPassword", "New Password", "••••••••", showNew, () => setShowNew((v) => !v))}

      {renderPasswordField("confirmPassword", "Confirm Password", "••••••••", showConfirm, () => setShowConfirm((v) => !v))}
    </View>);
};
const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 4,
    },
    inputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "500",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        height: 56,
    },
    eyeButton: {
        padding: 8,
        marginLeft: 8,
    },
    errorText: {
        fontSize: 13,
        marginTop: 4,
    },
});
export default ForgotPasswordStep2;
