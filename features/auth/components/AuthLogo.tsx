import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

const AuthLogo = ({ size = 120, color = "#4B5563" }: Props) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <G opacity={0.8}>
          {/* Main X shape with checkmark accent */}
          <Path
            d="M25 20 L50 50 L75 20"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M25 80 L50 50 L75 80"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Subtle accent line */}
          <Path
            d="M50 50 L65 65"
            stroke="#6B7280"
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.6}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AuthLogo;
