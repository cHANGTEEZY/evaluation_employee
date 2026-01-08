import { View, Text, Linking } from "react-native";

export default function ModalScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Made by</Text>
      <Text
        style={{ color: "#3B82F6", marginTop: 8 }}
        onPress={() => Linking.openURL("https://twitter.com/natebirdman")}
      >
        @natebirdman,
      </Text>
      <Text
        style={{ color: "#16a34a", marginTop: 8 }}
        onPress={() => Linking.openURL("https://github.com/tamagui/tamagui")}
      >
        give it a ⭐️
      </Text>
    </View>
  );
}
