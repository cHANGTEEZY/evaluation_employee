import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Text, Snackbar, Portal, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import AuthLogo from "../../features/auth/components/AuthLogo";
import { authClient } from "../../lib/auth-client";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const theme = useTheme();
  const isDark = theme.dark;
  const router = useRouter();
  const { token, error } = useLocalSearchParams<{
    token: string;
    error: string;
  }>();

  const colors = {
    background: theme.colors.background,
    backgroundEnd: theme.colors.surfaceVariant,
    inputBg: theme.colors.surface,
    inputText: theme.colors.onSurface,
    inputPlaceholder: theme.colors.onSurfaceVariant,
    labelText: theme.colors.onSurfaceVariant,
    titleText: theme.colors.onSurface,
    iconColor: theme.colors.onSurfaceVariant,
    linkText: theme.colors.primary,
    errorText: theme.colors.error,
    borderColor: theme.colors.outline,
    logoColor: theme.colors.onSurfaceVariant,
  };

  const [submitting, setSubmitting] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleBack = () => {
    router.replace("/(auth)/login");
  };

  const onSubmit = async (values: ResetPasswordSchema) => {
    /* 
     // Temporarily bypass token check for UI testing if needed, 
     // but in production we need the token.
     if (!token) {
       setSnackMessage("Missing reset token. Please request a new link.");
       setSnackVisible(true);
       return;
     }
    */

    setSubmitting(true);
    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: values.newPassword,
        token: token || "", // Ensure token is passed if available
      });

      if (error) {
        throw error;
      }

      setSnackMessage("Password reset successfully. Please login.");
      setSnackVisible(true);
      form.reset();
      setTimeout(() => router.replace("/(auth)/login"), 2000);
    } catch (error: any) {
      setSnackMessage(
        error?.message || "Failed to reset password. Please try again."
      );
      setSnackVisible(true);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPasswordField = (
    name: "newPassword" | "confirmPassword",
    label: string,
    placeholder: string,
    show: boolean,
    toggle: () => void
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.labelText }]}>
        {label}
      </Text>
      <Controller
        control={form.control}
        name={name}
        render={({ field: { value, onChange } }) => (
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
              name="lock-outline"
              size={20}
              color={colors.iconColor}
              style={styles.inputIcon}
            />
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry={!show}
              autoCapitalize="none"
              style={[styles.textInput, { color: colors.inputText }]}
            />
            <Pressable onPress={toggle} style={styles.eyeButton}>
              <MaterialCommunityIcons
                name={show ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.iconColor}
              />
            </Pressable>
          </View>
        )}
      />
      {form.formState.errors[name]?.message && (
        <Text style={[styles.errorText, { color: colors.errorText }]}>
          {String(form.formState.errors[name]?.message)}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <Pressable
              onPress={handleBack}
              hitSlop={20}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color={colors.titleText}
              />
            </Pressable>

            {/* Logo Section */}
            <View style={styles.logoSection}>
              <AuthLogo size={120} color={colors.logoColor} />
            </View>

            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={[styles.labelText, { color: colors.labelText }]}>
                ALMOST THERE
              </Text>
              <Text style={[styles.titleText, { color: colors.titleText }]}>
                Create new password
              </Text>
            </View>

            <FormProvider {...form}>
              <View style={styles.formSection}>
                <View style={styles.fieldsContainer}>
                  <Text
                    style={[styles.description, { color: colors.labelText }]}
                  >
                    Create a strong password with at least 8 characters.
                  </Text>

                  {renderPasswordField(
                    "newPassword",
                    "New Password",
                    "••••••••",
                    showNew,
                    () => setShowNew((v) => !v)
                  )}

                  {renderPasswordField(
                    "confirmPassword",
                    "Confirm Password",
                    "••••••••",
                    showConfirm,
                    () => setShowConfirm((v) => !v)
                  )}
                </View>
              </View>
            </FormProvider>

            <View style={styles.buttonSection}>
              <Pressable
                onPress={form.handleSubmit(onSubmit)}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.nextButton,
                  pressed && styles.buttonPressed,
                  submitting && styles.buttonDisabled,
                ]}
              >
                <LinearGradient
                  colors={[
                    theme.colors.primary,
                    theme.colors.secondary || theme.colors.primary,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {submitting ? "Resetting..." : "Reset Password"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Portal>
        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={3000}
        >
          <Text style={{ color: "#FFFFFF" }}>{snackMessage}</Text>
        </Snackbar>
      </Portal>
    </View>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 4,
    marginBottom: 8,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 8,
  },
  headerSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 2,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  formSection: {
    flex: 1,
  },
  fieldsContainer: {
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
    height: "100%",
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonSection: {
    marginTop: 32,
  },
  nextButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
