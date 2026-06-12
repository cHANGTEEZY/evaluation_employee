import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import ValuationVIcon from "../ValuationVIcon";
import CompassView from "../CompassView";
interface CompassProps {
    onAligned: () => void;
}
const Compass = ({ onAligned }: CompassProps) => {
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    return (<View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerSpacer}/>
        <ValuationVIcon size={36} color={theme.colors.primary}/>
      </View>

      <View style={styles.body}>
        <Text style={[styles.instruction, { color: theme.colors.primary }]}>
          {"Align the north compass\nwith the blueprint header."}
        </Text>

        <CompassView size={280} showReadout readoutBelowCompass showRings={false} showCrosshair={false} hapticOnNorth/>
      </View>

      
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={onAligned} activeOpacity={0.8}>
          <Text style={[styles.buttonText, { color: theme.colors.outline }]}>
            Compass Aligned
          </Text>
        </TouchableOpacity>
      </View>
    </View>);
};
export default Compass;
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    headerSpacer: {
        flex: 1,
    },
    body: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        paddingBottom: 56,
    },
    instruction: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: 0.2,
        lineHeight: 30,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    button: {
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: "center",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});
