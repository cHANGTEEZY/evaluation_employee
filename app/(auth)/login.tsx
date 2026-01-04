import { useState } from "react";
import { View, TextInput, Button } from "react-native";
import { authClient } from "../../lib/auth-client";
import { router } from "expo-router";
import { useToastController } from "@tamagui/toast";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toast = useToastController();

  const handleLogin = async () => {
    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          console.log("Login successful");
          toast.show("Login successful!", { type: "success" });
          router.replace("/");
        },
        onError: (error) => {
          console.error("Login failed", error);
          toast.show(`Login failed: ${error.error.message}`, { type: "error" });
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "black",
          marginTop: 12,
          marginBottom: 12,
          padding: 8,
        }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "black",
          marginTop: 12,
          marginBottom: 12,
          padding: 8,
        }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
