import { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, User, Lock, Building2 } from "@tamagui/lucide-icons";
import { Button, Text, YStack, XStack } from "tamagui";
import { useToastController } from "@tamagui/toast";
import { authClient } from "../../lib/auth-client";

const INPUT_HEIGHT = 56;

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToastController();
  const theme = useColorScheme();
  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#121212" : "#FFFFFF",
    inputBg: isDark ? "#1E1E1E" : "#F7F8FA",
    text: isDark ? "#FFFFFF" : "#1B2B48",
    subText: isDark ? "#AAAAAA" : "#666666",
    icon: isDark ? "#888888" : "#888",
    illustrationBg: isDark ? "#1E1E1E" : "#F0F4F8",
  };

  const handleSignIn = async () => {
    // Validation
    if (!email || !password) {
      toast.show("Error", { message: "Please fill in all fields" });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.show("Error", { message: "Please enter a valid email address" });
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
          onSuccess: () => {
            toast.show("Success", {
              message: "Login successful!",
            });
          },
          onError: (ctx) => {
            console.error("Login error:", ctx.error);

            // Handle specific error types
            let errorMessage = "Login failed. Please try again.";

            if (ctx.error?.message) {
              errorMessage = ctx.error.message;
            } else if (ctx.error?.status === 401) {
              errorMessage = "Invalid email or password";
            } else if (ctx.error?.status === 429) {
              errorMessage = "Too many attempts. Please try again later";
            }

            toast.show("Login Failed", {
              message: errorMessage,
            });
          },
        }
      );
    } catch (error) {
      console.error("SignIn catch error:", error);

      // Handle network and other errors
      let errorMessage = "An unexpected error occurred";

      if (
        error instanceof TypeError &&
        error.message === "Network request failed"
      ) {
        errorMessage = "Network error. Please check your internet connection";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.show("Error", {
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={["left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <YStack flex={1} bg={colors.bg as any} px="$6" pt="$4" pb="$8">
            <YStack items="center" mb="$4" mt="$8">
              <View
                style={[
                  styles.illustrationCircle,
                  { backgroundColor: colors.illustrationBg },
                ]}
              >
                <Building2
                  size={80}
                  color={isDark ? "#3B82F6" : "#1B2B48"}
                  opacity={0.8}
                />
              </View>
            </YStack>

            <YStack mb="$8">
              <Text fontSize={32} fontWeight="700" color={colors.text as any}>
                Login
              </Text>
              <Text fontSize={16} color={colors.subText as any} mt="$1">
                Please Sign in to continue.
              </Text>
            </YStack>

            <YStack gap="$4">
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg },
                ]}
              >
                <User size={20} color={colors.icon as any} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="john@example.com"
                  placeholderTextColor={colors.icon}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg },
                ]}
              >
                <Lock size={20} color={colors.icon as any} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••••••••••••"
                  placeholderTextColor={colors.icon}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  textContentType="password"
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPass((v) => !v)}>
                  {showPass ? (
                    <EyeOff size={20} color={colors.icon as any} />
                  ) : (
                    <Eye size={20} color={colors.icon as any} />
                  )}
                </Pressable>
              </View>

              <Button
                size="$5"
                mt="$6"
                onPress={handleSignIn}
                disabled={loading}
                bg={isDark ? "#3B82F6" : "#1B2B48"}
                pressStyle={{ opacity: 0.8 }}
                opacity={loading ? 0.6 : 1}
              >
                <Text color="white" fontWeight="600" fontSize={16}>
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  illustrationCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    height: INPUT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    height: INPUT_HEIGHT,
    fontSize: 16,
  },
});
