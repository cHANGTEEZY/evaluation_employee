import { DynamicColorIOS } from "react-native";
import {
  NativeTabs,
  Icon,
  Label,
} from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs
      labelStyle={{
        color: DynamicColorIOS({ dark: "white", light: "black" }),
      }}
      tintColor={DynamicColorIOS({ dark: "white", light: "black" })}
    >
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="evaluations">
        <Label>Evaluations</Label>
        <Icon sf="list.bullet.clipboard.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sync">
        <Label>Sync</Label>
        <Icon sf="arrow.triangle.2.circlepath" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
