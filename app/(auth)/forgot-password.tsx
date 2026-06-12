import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Text, Snackbar, Portal, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "@tanstack/react-query";
import ForgotPasswordStep1 from "../../features/auth/components/ForgotPasswordStep1";
import AuthLogo from "../../features/auth/components/AuthLogo";
import { apiClient } from "../../lib/api-client";
const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
});
type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
const stepConfig = [
    { label: "DON'T WORRY", title: "Did you forget your password?" },
];
const ForgotPassword = () => {
    const theme = useTheme();
    const isDark = theme.dark;
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
    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState("");
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: async (email: string) => {
            const response = await apiClient.post("/api/auth/request-password-reset", {
                email,
                platform: "mobile",
            });
            return response.data;
        },
        onSuccess: () => {
            setSnackMessage("Password reset email sent. Please check your inbox.");
            setSnackVisible(true);
            form.reset();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message ||
                error.message ||
                "Failed to send reset email. Please try again.";
            setSnackMessage(message);
            setSnackVisible(true);
            console.error(error);
        },
    });
    const form = useForm<ForgotPasswordSchema>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });
    const handleBack = () => {
        router.back();
    };
    const onSubmit = (values: ForgotPasswordSchema) => {
        mutation.mutate(values.email);
    };
    const submitting = mutation.isPending;
    return (<View style={styles.container}>
      <LinearGradient colors={[colors.background, colors.backgroundEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}/>
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <Pressable onPress={handleBack} hitSlop={20} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.titleText}/>
            </Pressable>

            
            <View style={styles.logoSection}>
              <AuthLogo size={120} color={colors.logoColor}/>
            </View>

            
            <View style={styles.headerSection}>
              <Text style={[styles.labelText, { color: colors.labelText }]}>
                {stepConfig[0].label}
              </Text>
              <Text style={[styles.titleText, { color: colors.titleText }]}>
                {stepConfig[0].title}
              </Text>
            </View>

            <FormProvider {...form}>
              <View style={styles.formSection}>
                <ForgotPasswordStep1 colors={colors} isDark={isDark}/>
              </View>
            </FormProvider>

            <View style={styles.buttonSection}>
              <Pressable onPress={form.handleSubmit(onSubmit)} disabled={submitting} style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.buttonPressed,
            submitting && styles.buttonDisabled,
        ]}>
                <LinearGradient colors={[
            theme.colors.primary,
            theme.colors.secondary || theme.colors.primary,
        ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>
                    {submitting ? "Sending..." : "Request password reset"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Portal>
        <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
          <Text style={{ color: "#FFFFFF" }}>{snackMessage}</Text>
        </Snackbar>
      </Portal>
    </View>);
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
