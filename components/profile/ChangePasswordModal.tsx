import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "../../lib/auth-client";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

type ChangePasswordModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
};

export default function ChangePasswordModal({
  visible,
  onDismiss,
  onSuccess,
}: ChangePasswordModalProps) {
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetAndClose = () => {
    form.reset();
    setErrorMessage(null);
    onDismiss();
  };

  const onSubmit = async (values: ChangePasswordForm) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to change password");
        return;
      }

      onSuccess?.();
      resetAndClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (
    name: keyof ChangePasswordForm,
    label: string,
    placeholder: string,
    show: boolean,
    toggle: () => void,
  ) => (
    <View style={styles.fieldWrap}>
      <Text
        variant="labelMedium"
        style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
      <Controller
        control={form.control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
              style={styles.inputIcon}
            />
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              secureTextEntry={!show}
              autoCapitalize="none"
              style={[styles.input, { color: theme.colors.onSurface }]}
            />
            <Pressable onPress={toggle} style={styles.eyeBtn}>
              <MaterialCommunityIcons
                name={show ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          </View>
        )}
      />
      {form.formState.errors[name]?.message && (
        <Text
          variant="bodySmall"
          style={[styles.errText, { color: theme.colors.error }]}
        >
          {form.formState.errors[name]?.message}
        </Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
    >
      <Pressable style={styles.backdrop} onPress={resetAndClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardWrap}
        >
          <Pressable
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface }}
              >
                Change Password
              </Text>
              <Pressable onPress={resetAndClose} hitSlop={12}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            </View>

            <Text
              variant="bodyMedium"
              style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
            >
              Enter your current password and choose a new one (at least 8
              characters).
            </Text>

            {renderField(
              "currentPassword",
              "Current password",
              "••••••••",
              showCurrent,
              () => setShowCurrent((v) => !v),
            )}
            {renderField(
              "newPassword",
              "New password",
              "••••••••",
              showNew,
              () => setShowNew((v) => !v),
            )}
            {renderField(
              "confirmPassword",
              "Confirm new password",
              "••••••••",
              showConfirm,
              () => setShowConfirm((v) => !v),
            )}

            {errorMessage && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.errorContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.error}
                />
                <Text
                  variant="bodySmall"
                  style={[
                    styles.errorBannerText,
                    { color: theme.colors.error },
                  ]}
                >
                  {errorMessage}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={resetAndClose}
                style={styles.btn}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={form.handleSubmit(onSubmit)}
                loading={submitting}
                disabled={submitting}
                style={styles.btn}
              >
                Save
              </Button>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  keyboardWrap: {
    width: "100%",
    maxWidth: 400,
  },
  card: {
    borderRadius: 20,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  hint: {
    marginBottom: 20,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 8,
  },
  errText: {
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
  },
});
