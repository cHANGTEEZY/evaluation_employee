import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CompassView from "../../components/CompassView";
export default function CompassScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    return (<View style={styles.screen}>
      <TouchableOpacity style={[styles.backButton, { top: insets.top + 16 }]} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff"/>
      </TouchableOpacity>
      <CompassView showReadout showRings showCrosshair hapticOnNorth/>
    </View>);
}
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0a0a0f",
    },
    backButton: {
        position: "absolute",
        left: 16,
        zIndex: 10,
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 22,
    },
});
