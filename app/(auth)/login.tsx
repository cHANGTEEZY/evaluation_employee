import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../../lib/auth-client";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, useTheme, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AuthLogo from "../../features/auth/components/AuthLogo";

import { toast } from "burnt";

export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.dark;

  const colors = useMemo(() => {
    return {
      background: isDark ? "#0B1023" : "#F8FAFC",
      backgroundEnd: isDark ? "#1A1F35" : "#E2E8F0",
      inputBg: isDark ? "#1E2642" : "#FFFFFF",
      inputText: isDark ? "#FFFFFF" : "#1F2937",
      inputPlaceholder: isDark ? "#6B7280" : "#9CA3AF",
      labelText: isDark ? "#9CA3AF" : "#64748B",
      titleText: isDark ? "#FFFFFF" : "#1F2937",
      iconColor: isDark ? "#6B7280" : "#9CA3AF",
      linkText: theme.colors.primary,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      logoColor: isDark ? "#4B5563" : "#CBD5E1",
      divider: !isDark ? "#374151" : "#E5E7EB",
    };
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        message: "Please fill in all fields",
        preset: "error",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        message: "Please enter a valid email address",
        preset: "error",
      });
      return;
    }

    setLoading(true);

    try {
      await authClient.signIn.email(
        {
          email: email.trim(),
          password,
          callbackURL: "/(tabs)",
        },
        {
          onSuccess: async () => {
            toast({
              title: "Success",
              message: "Login successful!",
              preset: "done",
            });
            router.replace("/(tabs)/home");
          },
          onError: (ctx) => {
            console.error("Login error:", ctx.error);

            let errorMessage = "Login failed. Please try again.";

            if (ctx.error?.message) {
              errorMessage = ctx.error.message;
            } else if (ctx.error?.status === 401) {
              errorMessage = "Invalid email or password";
            } else if (ctx.error?.status === 429) {
              errorMessage = "Too many attempts. Please try again later";
            }

            toast({
              title: "Error",
              message: errorMessage,
              preset: "error",
            });
          },
        },
      );
    } catch (error) {
      console.error("SignIn catch error:", error);

      let errorMessage = "An unexpected error occurred";

      if (
        error instanceof TypeError &&
        error.message === "Network request failed"
      ) {
        errorMessage = "Network error. Please check your internet connection";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        message: errorMessage,
        preset: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <AuthLogo size={140} color={colors.logoColor} />
            </View>

            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={[styles.labelText, { color: colors.labelText }]}>
                WELCOME
              </Text>
              <Text style={[styles.titleText, { color: colors.titleText }]}>
                Log In Again
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.labelText }]}>
                  Email
                </Text>
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
                    mode="flat"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="canandoe@gmail.com"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                    textColor={colors.inputText}
                    disabled={loading}
                    underlineColor="transparent"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={[styles.inputLabel, { color: colors.labelText }]}
                  >
                    Password
                  </Text>
                  <View>
                    <Link href={"/(auth)/forgot-password"}>
                      <Text
                        style={[styles.linkText, { color: colors.linkText }]}
                      >
                        Forgot Password?
                      </Text>
                    </Link>
                  </View>
                </View>
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
                    mode="flat"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.inputPlaceholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showPass}
                    style={styles.textInput}
                    textColor={colors.inputText}
                    underlineColor="transparent"
                    disabled={loading}
                  />
                  <Pressable
                    onPress={() => setShowPass((v) => !v)}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons
                      name={showPass ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.iconColor}
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.buttonSection}>
              <LinearGradient
                colors={[
                  theme.colors.primary,
                  theme.colors.secondary || theme.colors.primary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 12 }}
              >
                <Button
                  mode="contained"
                  onPress={handleSignIn}
                  disabled={loading}
                  contentStyle={{ height: 46 }}
                  style={{ borderRadius: 12, backgroundColor: "transparent" }}
                  labelStyle={styles.buttonText}
                >
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </LinearGradient>
            </View>

            {/* <Divider
              colors={{
                divider: colors.divider,
                text: colors.labelText,
                background: undefined,
              }}
            /> */}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 20,
  },
  headerSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 2,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  formSection: {
    gap: 20,
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
    backgroundColor: "transparent",
    fontSize: 16,
    height: 56,
    paddingHorizontal: 0,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  buttonSection: {
    marginTop: 32,
  },
  signInButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  signInButtonPressed: {
    opacity: 0.9,
  },
  signInButtonDisabled: {
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

  linkText: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
});
