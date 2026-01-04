import { Paragraph, Text, View, XStack, YStack, Button } from "tamagui";
import { useRouter } from "expo-router";
import { useToastController } from "@tamagui/toast";
import { StyleSheet } from "react-native";
import { authClient } from "../../lib/auth-client";

export default function TabTwoScreen() {
  const router = useRouter();

  const toast = useToastController();

  return (
    <View flex={1} items="center" justify="center" bg="$background">
      <Text fontSize={20} color="$blue10">
        This is Tab Two Page
      </Text>

      <YStack mt={"$10"}>
        <Paragraph fontSize={"$8"}>This is a simple paragraph</Paragraph>
        <Paragraph fontSize={"$8"}>This is a simple paragraph</Paragraph>
        <Paragraph fontSize={"$8"}>This is a simple paragraph</Paragraph>
        <Button
          style={styles.buttonStyls}
          fontSize={"$8"}
          onPress={() => router.navigate("/")}
          color={"yellowgreen"}
        ></Button>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonStyls: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
  },
});
