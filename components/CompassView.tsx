import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import CompassHeading from "react-native-compass-heading";
import * as Haptics from "expo-haptics";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortestArc(from: number, to: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return from + delta;
}

function getDirection(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
}

const MAJOR_TICKS = ["N", "E", "S", "W"];

// ─── Props ────────────────────────────────────────────────────────────────────
export interface CompassViewProps {
  size?: number;
  showReadout?: boolean;
  readoutBelowCompass?: boolean;
  hapticOnNorth?: boolean;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CompassView({
  size = Dimensions.get("window").width * 0.9,
  showReadout = true,
  readoutBelowCompass = false,
  hapticOnNorth = true,
  style,
}: CompassViewProps) {
  const rotationRef = useRef(0);
  const animatedRot = useSharedValue(0);

  const [displayHeading, setDisplayHeading] = useState(0);
  const [direction, setDirection] = useState("N");
  const [sensorStatus, setSensorStatus] = useState<"loading" | "active" | "unavailable">("loading");

  const lastRoundedRef = useRef(-1);
  const nearCardinalRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // react-native-compass-heading uses the OS native compass APIs:
    //   iOS  → CLLocationManager (Core Location) — already tilt-compensated
    //   Android → SensorManager.getRotationMatrix + getOrientation — also tilt-compensated
    // `degree_update_rate` = minimum degree change to trigger a callback (1 = every 1°)
    CompassHeading.start(1, ({ heading }: { heading: number }) => {
      if (!mounted) return;

      if (sensorStatus !== "active") setSensorStatus("active");

      const dest = shortestArc(rotationRef.current, heading);
      rotationRef.current = dest;

      animatedRot.value = withTiming(-dest, {
        duration: 80,
        easing: Easing.out(Easing.quad),
      });

      const rounded = Math.round(heading);
      if (rounded !== lastRoundedRef.current) {
        setDisplayHeading(rounded);
        setDirection(getDirection(heading));
        lastRoundedRef.current = rounded;
      }

      if (hapticOnNorth) {
        const isCardinal = rounded % 90 <= 2 || rounded % 90 >= 88;
        if (isCardinal && !nearCardinalRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        nearCardinalRef.current = isCardinal;
      }
    });

    // If no heading arrives within 3s, sensor is unavailable
    const timer = setTimeout(() => {
      if (mounted && lastRoundedRef.current === -1) {
        setSensorStatus("unavailable");
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      CompassHeading.stop();
    };
  }, [animatedRot, hapticOnNorth]);

  const animatedRoseStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedRot.value}deg` }],
  }));

  // ── Layout geometry ─────────────────────────────────────────────────────────
  const R = size / 2;
  const tickOuterRadius = R * 0.75;
  const numberRadius = R * 0.92;
  const cardinalRadius = R * 0.52;

  const compassContent = (
    <View style={[styles.compassContainer, { width: size, height: size }]}>
      {/* Fixed top indicator */}
      <View style={styles.fixedPointerContainer}>
        <View style={styles.fixedPointer} />
      </View>

      {/* Fixed centre crosshair */}
      <View style={styles.centerLevelContainer}>
        <View style={styles.centerCircle} />
        <View style={styles.centerCrosshairV} />
        <View style={styles.centerCrosshairH} />
      </View>

      {/* Rotating compass rose */}
      <Animated.View
        style={[styles.rose, { width: size, height: size }, animatedRoseStyle]}
      >
        {/* Tick marks every 2° */}
        {Array.from({ length: 180 }).map((_, i) => {
          const degree = i * 2;
          const is30 = degree % 30 === 0;
          const is10 = degree % 10 === 0;
          return (
            <View
              key={`tick-${degree}`}
              style={[
                styles.tickContainer,
                {
                  height: tickOuterRadius * 2,
                  transform: [{ rotate: `${degree}deg` }],
                },
              ]}
            >
              <View
                style={[
                  styles.tick,
                  {
                    width: is30 ? 2 : 1,
                    height: is30 ? 16 : is10 ? 12 : 8,
                  },
                ]}
              />
            </View>
          );
        })}

        {/* Degree numbers every 30° */}
        {Array.from({ length: 12 }).map((_, i) => {
          const degree = i * 30;
          const angle = (degree * Math.PI) / 180;
          const tx = Math.sin(angle) * numberRadius;
          const ty = -Math.cos(angle) * numberRadius;
          return (
            <View
              key={`num-${degree}`}
              style={[
                styles.numberContainer,
                { transform: [{ translateX: tx }, { translateY: ty }] },
              ]}
            >
              <Text style={styles.degreeNumberText}>{degree}</Text>
              {degree === 0 && <View style={styles.redTriangle} />}
            </View>
          );
        })}

        {/* Cardinal labels */}
        {MAJOR_TICKS.map((label, i) => {
          const angle = i * 90;
          const rad = (angle * Math.PI) / 180;
          const tx = Math.sin(rad) * cardinalRadius;
          const ty = -Math.cos(rad) * cardinalRadius;
          return (
            <Text
              key={label}
              style={[
                styles.cardinalLabel,
                label === "N" && styles.cardinalLabelNorth,
                { transform: [{ translateX: tx }, { translateY: ty }] },
              ]}
            >
              {label}
            </Text>
          );
        })}

        <View style={styles.rotatingCrosshairV} />
        <View style={styles.rotatingCrosshairH} />
      </Animated.View>
    </View>
  );

  return (
    <View style={[styles.screen, style]}>
      {sensorStatus === "unavailable" && (
        <View style={styles.sensorBanner}>
          <Text style={styles.sensorBannerText}>
            Compass not available on this device.{"\n"}
            A physical device with a magnetic sensor is required.
          </Text>
        </View>
      )}

      <View
        style={
          readoutBelowCompass ? styles.compassOnlyWrapper : styles.compassWrapper
        }
      >
        {compassContent}
      </View>

      {showReadout && (
        <View
          style={readoutBelowCompass ? styles.readoutBelow : styles.readoutBottom}
        >
          <Text style={styles.readoutHeading}>
            {displayHeading}° {direction}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  compassWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  compassOnlyWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  compassContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  fixedPointerContainer: {
    position: "absolute",
    top: -15,
    zIndex: 10,
    alignItems: "center",
  },
  fixedPointer: {
    width: 3,
    height: 35,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  rose: {
    alignItems: "center",
    justifyContent: "center",
  },
  tickContainer: {
    position: "absolute",
    width: 2,
    alignItems: "center",
  },
  tick: {
    backgroundColor: "#fff",
  },
  numberContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  degreeNumberText: {
    position: "absolute",
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
  },
  redTriangle: {
    position: "absolute",
    top: 14,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FF3B30",
  },
  cardinalLabel: {
    position: "absolute",
    color: "#fff",
    fontSize: 28,
    fontWeight: "500",
  },
  cardinalLabelNorth: {
    color: "#FF3B30",
    fontWeight: "700",
  },
  centerLevelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  centerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  centerCrosshairV: {
    position: "absolute",
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  centerCrosshairH: {
    position: "absolute",
    width: 14,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  rotatingCrosshairV: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  rotatingCrosshairH: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  readoutBelow: {
    alignItems: "center",
    marginTop: 40,
  },
  readoutBottom: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  readoutHeading: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "300",
    fontVariant: ["tabular-nums"],
  },
  sensorBanner: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,60,60,0.85)",
    borderRadius: 12,
    padding: 16,
    zIndex: 100,
  },
  sensorBannerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
});
