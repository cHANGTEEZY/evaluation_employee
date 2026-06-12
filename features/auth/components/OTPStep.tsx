import React, { useMemo, useRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text, MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
type Colors = {
    inputBg: string;
    inputText: string;
    labelText: string;
    iconColor: string;
    errorText: string;
    borderColor: string;
    linkText: string;
};
type Props = {
    colors: Colors;
    isDark: boolean;
    theme: MD3Theme;
};
const OTP = ({ colors, isDark, theme }: Props) => {
    const { control, setValue, clearErrors, formState: { errors }, } = useFormContext();
    const inputRef = useRef<TextInput | null>(null);
    const cells = useMemo(() => Array.from({ length: 6 }), []);
    const accentColor = theme.colors.primary;
    return (<View style={styles.container}>
      <Text style={[styles.description, { color: colors.labelText }]}>
        We've sent a 6-digit verification code to your email. Enter it below.
      </Text>

      <Controller control={control} name="otp" render={({ field: { value, onChange } }) => {
            const digits = (value || "").split("");
            const handleChange = (text: string) => {
                const sanitized = text.replace(/\D/g, "").slice(0, 6);
                onChange(sanitized);
            };
            return (<View style={styles.otpSection}>
              <Pressable onPress={() => inputRef.current?.focus()}>
                <View style={styles.cellsRow}>
                  {cells.map((_, idx) => {
                    const char = digits[idx] ?? "";
                    const isFilled = Boolean(char);
                    const isActive = digits.length === idx;
                    return (<View key={idx} style={[
                            styles.cell,
                            {
                                backgroundColor: colors.inputBg,
                                borderColor: colors.borderColor,
                                borderWidth: isDark ? 0 : 1,
                            },
                            isFilled && {
                                borderColor: accentColor,
                                borderWidth: 2,
                            },
                            isActive && {
                                borderColor: accentColor,
                                borderWidth: 1,
                            },
                        ]}>
                        <Text style={[styles.cellText, { color: colors.inputText }]}>
                          {char}
                        </Text>
                      </View>);
                })}
                </View>
              </Pressable>

              <TextInput ref={inputRef} value={value} onChangeText={handleChange} keyboardType="number-pad" maxLength={6} style={styles.hiddenInput} autoFocus textContentType="oneTimeCode"/>
            </View>);
        }}/>

      {errors.otp?.message && (<Text style={[styles.errorText, { color: colors.errorText }]}>
          {String(errors.otp.message)}
        </Text>)}

      <View style={styles.resendSection}>
        <Pressable onPress={() => {
            setValue("otp", "");
            clearErrors("otp");
            inputRef.current?.focus();
        }} style={styles.resendButton}>
          <MaterialCommunityIcons name="refresh" size={18} color={accentColor}/>
          <Text style={[styles.resendText, { color: accentColor }]}>
            Resend code
          </Text>
        </Pressable>
      </View>
    </View>);
};
const styles = StyleSheet.create({
    container: {
        gap: 24,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
    otpSection: {
        gap: 16,
    },
    cellsRow: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "center",
    },
    cell: {
        width: 48,
        height: 58,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cellText: {
        fontSize: 24,
        fontWeight: "700",
    },
    hiddenInput: {
        position: "absolute",
        opacity: 0,
        height: 0,
        width: 0,
    },
    errorText: {
        fontSize: 13,
        textAlign: "center",
    },
    resendSection: {
        alignItems: "center",
    },
    resendButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    resendText: {
        fontSize: 15,
        fontWeight: "500",
    },
});
export default OTP;
