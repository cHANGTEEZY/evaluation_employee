import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Text, Snackbar, Portal, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import ForgotPasswordStep1 from "../../features/auth/components/ForgotPasswordStep1";
import ForgotPasswordStep2 from "../../features/auth/components/ForgotPasswordStep2";
import OTP from "../../features/auth/components/OTPStep";
import AuthLogo from "../../features/auth/components/AuthLogo";

const forgotPasswordSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    otp: z
      .string()
      .length(6, { message: "Enter the 6-digit code" })
      .regex(/^[0-9]+$/, { message: "Numbers only" }),
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

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

const stepConfig = [
  { label: "DON'T WORRY", title: "Did you forget your password?" },
  { label: "VERIFICATION", title: "Enter the code" },
  { label: "ALMOST THERE", title: "Create new password" },
];

const ForgotPassword = () => {
  const theme = useTheme();
  const isDark = theme.dark;

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? "#0B1023" : "#F8FAFC",
    backgroundEnd: isDark ? "#1A1F35" : "#E2E8F0",
    inputBg: isDark ? "#1E2642" : "#FFFFFF",
    inputText: isDark ? "#FFFFFF" : "#1F2937",
    inputPlaceholder: isDark ? "#6B7280" : "#9CA3AF",
    labelText: isDark ? "#9CA3AF" : "#64748B",
    titleText: isDark ? "#FFFFFF" : "#1F2937",
    iconColor: isDark ? "#6B7280" : "#9CA3AF",
    linkText: theme.colors.primary,
    errorText: theme.colors.error,
    borderColor: isDark ? "#374151" : "#E5E7EB",
    logoColor: isDark ? "#4B5563" : "#CBD5E1",
  };

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const router = useRouter();

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleNext = async () => {
    const fieldsByStep: Record<number, Array<keyof ForgotPasswordSchema>> = {
      1: ["email"],
      2: ["otp"],
      3: ["newPassword", "confirmPassword"],
    };

    const valid = await form.trigger(fieldsByStep[step] ?? []);
    if (!valid) return;

    if (step < 3) {
      setStep((prevStep) => prevStep + 1);
    } else {
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const onSubmit = async (values: ForgotPasswordSchema) => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 750));
      setSnackMessage("Your password was updated successfully");
      setSnackVisible(true);
      setStep(1);
      form.reset();
      router.replace("/(auth)/login");
    } catch (error) {
      setSnackMessage("Failed to update password. Please try again.");
      setSnackVisible(true);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ForgotPasswordStep1 colors={colors} isDark={isDark} />;
      case 2:
        return <OTP colors={colors} isDark={isDark} theme={theme} />;
      case 3:
        return <ForgotPasswordStep2 colors={colors} isDark={isDark} />;
      default:
        return null;
    }
  };

  const currentStep = stepConfig[step - 1];

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
                {currentStep.label}
              </Text>
              <Text style={[styles.titleText, { color: colors.titleText }]}>
                {currentStep.title}
              </Text>
            </View>

            {/* Form Section */}
            <FormProvider {...form}>
              <View style={styles.formSection}>{renderStep()}</View>
            </FormProvider>

            {/* Next/Reset Button */}
            <View style={styles.buttonSection}>
              <Pressable
                onPress={handleNext}
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
                    {submitting
                      ? "Please wait..."
                      : step === 3
                      ? "Reset Password"
                      : "Continue"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    { backgroundColor: colors.borderColor },
                    s === step && {
                      backgroundColor: theme.colors.primary,
                      width: 24,
                    },
                    s < step && { backgroundColor: colors.linkText },
                  ]}
                />
              ))}
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

export default ForgotPassword;

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
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
