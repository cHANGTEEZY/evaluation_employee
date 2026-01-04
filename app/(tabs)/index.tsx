import { ExternalLink } from "@tamagui/lucide-icons";
import { Anchor, H2, Paragraph, XStack, YStack } from "tamagui";
import { ToastControl } from "../../components/CurrentToast";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthSession } from "../../lib/auth-store";

export default function TabOneScreen() {
  const { session, user } = useAuthSession();

  console.log("Session:", JSON.stringify(session, null, 2));
  console.log("User:", JSON.stringify(user, null, 2));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left"]}>
      <YStack
        flex={1}
        items="center"
        gap="$8"
        px="$10"
        pt="$5"
        bg="$background"
      >
        <H2>Tamagui + Expo</H2>

        <ToastControl />

        <XStack
          items="center"
          justify="center"
          flexWrap="wrap"
          gap="$1.5"
          position="absolute"
          b="$8"
        >
          <Paragraph fontSize="$5">Add</Paragraph>

          <Paragraph fontSize="$5" px="$2" py="$1" color="$blue10" bg="$blue5">
            tamagui.config.ts
          </Paragraph>

          <Paragraph fontSize="$5">to root and follow the</Paragraph>

          <XStack
            items="center"
            gap="$1.5"
            px="$2"
            py="$1"
            rounded="$3"
            bg="$green5"
            hoverStyle={{ bg: "$green6" }}
            pressStyle={{ bg: "$green4" }}
          >
            <Anchor
              href="https://tamagui.dev/docs/core/configuration"
              textDecorationLine="none"
              color="$green10"
              fontSize="$5"
            >
              Configuration guide
            </Anchor>
            <ExternalLink size="$1" color="$green10" />
          </XStack>

          <Paragraph fontSize="$5" text="center">
            to configure your themes and tokens.
          </Paragraph>
        </XStack>
      </YStack>
    </SafeAreaView>
  );
}
