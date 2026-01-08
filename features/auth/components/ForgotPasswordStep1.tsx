import React from "react";
import { StyleSheet, View, TextInput } from "react-native";
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

const ForgotPasswordStep1 = ({ colors, isDark }: Props) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: colors.labelText }]}>
        Enter your email address and we'll send you a verification code to reset
        your password.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.labelText }]}>
          Email
        </Text>
        <Controller
          name="email"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.borderColor,
                  borderWidth: isDark ? 0 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={colors.iconColor}
                style={styles.inputIcon}
              />
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="canandoe@gmail.com"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.textInput, { color: colors.inputText }]}
              />
            </View>
          )}
        />
        {errors.email?.message && (
          <Text style={[styles.errorText, { color: colors.errorText }]}>
            {String(errors.email.message)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
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
  errorText: {
    fontSize: 13,
    marginTop: 4,
  },
});

export default ForgotPasswordStep1;
