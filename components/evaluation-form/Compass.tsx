import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import ValuationVIcon from "../ValuationVIcon";

interface CompassProps {
  onAligned: () => void;
}

function CompassRose() {
  return (
    <Svg width={260} height={260} viewBox="0 0 260 260">
      <Circle cx={130} cy={130} r={128} fill="#9E8E7E" />

      <Circle cx={130} cy={130} r={112} fill="#F0EDE8" />

      <Circle cx={130} cy={130} r={106} fill="#7A9BB5" />

      <Circle
        cx={130}
        cy={130}
        r={88}
        fill="none"
        stroke="white"
        strokeWidth={1.5}
        opacity={0.6}
      />

      <SvgText
        x={130}
        y={44}
        textAnchor="middle"
        fontSize={22}
        fontWeight="bold"
        fill="#111827"
      >
        N
      </SvgText>
      <SvgText
        x={130}
        y={228}
        textAnchor="middle"
        fontSize={22}
        fontWeight="bold"
        fill="#111827"
      >
        S
      </SvgText>
      <SvgText
        x={36}
        y={137}
        textAnchor="middle"
        fontSize={22}
        fontWeight="bold"
        fill="#111827"
      >
        W
      </SvgText>
      <SvgText
        x={224}
        y={137}
        textAnchor="middle"
        fontSize={22}
        fontWeight="bold"
        fill="#111827"
      >
        E
      </SvgText>
      {/* Needle — red north half */}
      <Path d="M130 58 L143 130 L130 142 L117 130 Z" fill="#C0392B" />
      {/* Needle — dark blue south half */}
      <Path d="M130 202 L143 130 L130 118 L117 130 Z" fill="#345C7A" />
      {/* Center white circle */}
      <Circle cx={130} cy={130} r={11} fill="white" />
    </Svg>
  );
}

const Compass = ({ onAligned }: CompassProps) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }} />
        <ValuationVIcon size={36} color={theme.colors.primary} />
      </View>

      <Text style={[styles.instruction, { color: theme.colors.primary }]}>
        Align the north compass{"\n"}with the blueprint header.
      </Text>

      <View style={styles.compassContainer} pointerEvents="none">
        <CompassRose />
      </View>

      <View
        style={[styles.buttonWrapper, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          style={[
            styles.alignedButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={onAligned}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.alignedButtonText, { color: theme.colors.outline }]}
          >
            Compass Aligned
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Compass;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "center",
  },
  instruction: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: 34,
    paddingHorizontal: 32,
    marginTop: 32,
    marginBottom: 40,
  },
  compassContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 0,
    zIndex: 1200,
    elevation: 8,
  },
  alignedButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  alignedButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    zIndex: 1200,
  },
});
