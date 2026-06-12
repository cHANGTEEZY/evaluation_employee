import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";
export default function TabLayout() {
    return (<Tabs tabBar={(props) => <TabBar {...props}/>} screenOptions={{
            headerShown: false,
        }}>
      <Tabs.Screen name="home" options={{
            title: "Home",
        }}/>
      <Tabs.Screen name="evaluations" options={{
            title: "Evaluations",
        }}/>
      <Tabs.Screen name="sync" options={{
            title: "Sync",
        }}/>
      <Tabs.Screen name="profile" options={{
            title: "Profile",
        }}/>
    </Tabs>);
}
