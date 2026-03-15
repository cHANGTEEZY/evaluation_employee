import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from "react-native";
import { Magnetometer } from "expo-sensors";
import * as Haptics from "expo-haptics";

const MAGNETIC_DECLINATION = -0.5;

const ALPHA = 0.15;

function rawToHeading(x: number, y: number): number {
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  return (((450 - angle) % 360) + MAGNETIC_DECLINATION + 360) % 360;
}

function shortestArc(from: number, to: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return from + delta;
}

function getDirection(deg: number): string {
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
}

const MAJOR_TICKS = ["N", "E", "S", "W"];
const MINOR_LABELS = ["NE", "SE", "SW", "NW"];

export interface CompassViewProps {
  size?: number;

  showReadout?: boolean;

  readoutBelowCompass?: boolean;

  showRings?: boolean;

  showCrosshair?: boolean;
  hapticOnNorth?: boolean;
  showPointer?: boolean;
  style?: ViewStyle;
}

export default function CompassView({
  size = 280,
  showReadout = true,
  readoutBelowCompass = false,
  showRings = true,
  showCrosshair = true,
  hapticOnNorth = true,
  showPointer = true,
  style,
}: CompassViewProps) {
  const rotationRef = useRef(0);
  const rawHeadingRef = useRef(0);
  const animatedRot = useRef(new Animated.Value(0)).current;
  const [displayHeading, setDisplayHeading] = useState(0);
  const [direction, setDirection] = useState("N");
  const nearNorthRef = useRef(false);
  const animatingRef = useRef<Animated.CompositeAnimation | null>(null);

  const animateTo = useCallback(
    (target: number) => {
      const dest = shortestArc(rotationRef.current, target);
      rotationRef.current = dest;
      animatingRef.current?.stop();
      animatingRef.current = Animated.timing(animatedRot, {
        toValue: -dest,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
      animatingRef.current.start(() => {
        animatingRef.current = null;
      });
    },
    [animatedRot],
  );

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener(({ x, y }) => {
      const raw = rawToHeading(x, y);
      const prev = rawHeadingRef.current;
      let delta = raw - prev;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const filtered = (prev + ALPHA * delta + 360) % 360;
      rawHeadingRef.current = filtered;

      const rounded = Math.round(filtered);
      setDisplayHeading(rounded);
      setDirection(getDirection(filtered));
      animateTo(filtered);

      if (hapticOnNorth) {
        const nearNorth = rounded <= 5 || rounded >= 355;
        if (nearNorth && !nearNorthRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        nearNorthRef.current = nearNorth;
      }
    });
    return () => sub.remove();
  }, [animateTo, hapticOnNorth]);

  const roseRotate = animatedRot.interpolate({
    inputRange: [-720, 720],
    outputRange: ["-720deg", "720deg"],
    extrapolate: "extend",
  });

  const labelR = (118 / 280) * size;
  const needleHeight = (70 / 280) * size;

  const dynamicStyles = getDynamicStyles(size, needleHeight);

  const pointerTriangleBase = Math.round((14 / 280) * size);
  const pointerTriangleHeight = Math.round((10 / 280) * size);
  const pointerStemHeight = Math.round((10 / 280) * size);
  const pointerStemWidth = Math.round((3 / 280) * size);

  const pointerTopOffset = -(
    pointerTriangleHeight +
    pointerStemHeight +
    Math.round((4 / 280) * size)
  );

  const compassContent = (
    <>
      {showRings && (
        <>
          <View style={[styles.outerRing, dynamicStyles.outerRing]} />
          <View style={[styles.innerRing, dynamicStyles.innerRing]} />
        </>
      )}

      <Animated.View
        style={[
          styles.rose,
          dynamicStyles.rose,
          { transform: [{ rotate: roseRotate }] },
        ]}
      >
        {Array.from({ length: 72 }).map((_, i) => {
          const isMajor = i % 18 === 0;
          const isMinor = i % 9 === 0 && !isMajor;
          return (
            <View
              key={i}
              style={[
                dynamicStyles.tick,
                { transform: [{ rotate: `${i * 5}deg` }] },
                isMajor && dynamicStyles.tickMajor,
                isMinor && dynamicStyles.tickMinor,
              ]}
            />
          );
        })}

        {MAJOR_TICKS.map((label, i) => {
          const angle = i * 90;
          const rad = (angle * Math.PI) / 180;
          const tx = Math.sin(rad) * labelR;
          const ty = -Math.cos(rad) * labelR;
          const isNorth = label === "N";
          return (
            <Text
              key={label}
              style={[
                dynamicStyles.cardinalLabel,
                isNorth && dynamicStyles.northLabel,
                { transform: [{ translateX: tx }, { translateY: ty }] },
              ]}
            >
              {label}
            </Text>
          );
        })}

        {MINOR_LABELS.map((label, i) => {
          const angle = 45 + i * 90;
          const rad = (angle * Math.PI) / 180;
          const tx = Math.sin(rad) * labelR;
          const ty = -Math.cos(rad) * labelR;
          return (
            <Text
              key={label}
              style={[
                dynamicStyles.intercardinalLabel,
                { transform: [{ translateX: tx }, { translateY: ty }] },
              ]}
            >
              {label}
            </Text>
          );
        })}

        <View style={styles.needleContainer}>
          <View style={[dynamicStyles.needleNorth, { height: needleHeight }]} />
          <View style={[dynamicStyles.needleSouth, { height: needleHeight }]} />
        </View>
      </Animated.View>

      <View style={[dynamicStyles.centreDot, styles.centreDot]} />

      {showCrosshair && (
        <>
          <View
            style={[
              styles.crosshair,
              styles.crosshairV,
              dynamicStyles.crosshairV,
            ]}
          />
          <View
            style={[
              styles.crosshair,
              styles.crosshairH,
              dynamicStyles.crosshairH,
            ]}
          />
        </>
      )}

      {/* ── Apple Maps-style fixed direction pointer ── */}
      {showPointer && (
        <View
          style={[styles.pointerWrapper, { top: pointerTopOffset }]}
          pointerEvents="none"
        >
          {/* Triangle chevron */}
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: pointerTriangleBase / 2,
              borderRightWidth: pointerTriangleBase / 2,
              borderTopWidth: 0,
              borderBottomWidth: pointerTriangleHeight,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: "transparent",
              borderTopColor: "transparent",
              // flip: triangle points downward INTO the compass
              transform: [{ rotate: "180deg" }],
              borderStyle: "solid",
              // We use borderTop trick for downward triangle instead:
            }}
          />
          {/* Using a proper downward-pointing triangle via top border */}
          <View style={{ marginTop: -pointerTriangleHeight }}>
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: pointerTriangleBase / 2,
                borderRightWidth: pointerTriangleBase / 2,
                borderTopWidth: pointerTriangleHeight,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#007AFF",
                borderStyle: "solid",
              }}
            />
          </View>
          {/* Stem below triangle */}
          <View
            style={{
              width: pointerStemWidth,
              height: pointerStemHeight,
              backgroundColor: "#007AFF",
              borderRadius: pointerStemWidth / 2,
              marginTop: 0,
            }}
          />
        </View>
      )}

      {showReadout && !readoutBelowCompass && (
        <View style={styles.readout}>
          <Text style={styles.degreesText}>{displayHeading}°</Text>
          <Text style={styles.directionText}>{direction}</Text>
        </View>
      )}
    </>
  );

  if (readoutBelowCompass) {
    return (
      <View style={[styles.screen, styles.screenColumn, style]}>
        <View
          style={[styles.compassOnlyWrapper, { width: size, height: size }]}
        >
          {compassContent}
        </View>
        {showReadout && (
          <View style={styles.readoutBelow}>
            <Text style={styles.degreesText}>{displayHeading}°</Text>
            <Text style={styles.directionText}>{direction}</Text>
          </View>
        )}
      </View>
    );
  }

  return <View style={[styles.screen, style]}>{compassContent}</View>;
}

function getDynamicStyles(size: number, needleHeight: number) {
  const outer = size + 60;
  const inner = size + 20;
  const crossLen = size + 80;
  return StyleSheet.create({
    outerRing: {
      width: outer,
      height: outer,
      borderRadius: outer / 2,
    },
    innerRing: {
      width: inner,
      height: inner,
      borderRadius: inner / 2,
    },
    rose: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    // tick: {
    //   position: "absolute" as const,
    //   top: 0,
    //   width: 1,
    //   height: Math.round((8 / 280) * size),
    //   backgroundColor: "rgba(255,255,255,0.2)",
    //   alignSelf: "center" as const,
    // },
    // tickMajor: {
    //   width: 2,
    //   height: Math.round((14 / 280) * size),
    //   backgroundColor: "rgba(255,255,255,0.55)",
    // },
    // tickMinor: {
    //   width: 1.5,
    //   height: Math.round((10 / 280) * size),
    //   backgroundColor: "rgba(255,255,255,0.35)",
    // },
    cardinalLabel: {
      position: "absolute" as const,
      color: "rgba(255,255,255,0.85)",
      fontSize: Math.round((16 / 280) * size),
      fontWeight: "700" as const,
      letterSpacing: 1,
      textAlign: "center" as const,
      width: 30,
      marginLeft: -2,
      marginTop: -10,
    },
    northLabel: {
      color: "#ff4040",
      fontSize: Math.round((18 / 280) * size),
    },
    intercardinalLabel: {
      position: "absolute" as const,
      color: "rgba(255,255,255,0.4)",
      fontSize: Math.round((11 / 280) * size),
      fontWeight: "500" as const,
      textAlign: "center" as const,
      width: 28,
      marginLeft: -14,
      marginTop: -8,
    },
    needleNorth: {
      width: 4,
      backgroundColor: "#ff3030",
      borderRadius: 2,
      marginBottom: 2,
      shadowColor: "#ff3030",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 6,
    },
    needleSouth: {
      width: 4,
      backgroundColor: "rgba(255,255,255,0.25)",
      borderRadius: 2,
      marginTop: 2,
    },
    centreDot: {
      width: Math.round((12 / 280) * size),
      height: Math.round((12 / 280) * size),
      borderRadius: Math.round((6 / 280) * size),
    },
    crosshairV: {
      width: 1,
      height: crossLen,
    },
    crosshairH: {
      width: crossLen,
      height: 1,
    },
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  screenColumn: {
    flexDirection: "column",
    justifyContent: "center",
  },
  compassOnlyWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  readoutBelow: {
    alignItems: "center",
    marginTop: 12,
  },
  outerRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  innerRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  rose: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  needleContainer: {
    position: "absolute",
    alignItems: "center",
  },
  centreDot: {
    position: "absolute",
    backgroundColor: "#fff",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  crosshair: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  crosshairV: {
    width: 1,
  },
  crosshairH: {
    height: 1,
  },
  readout: {
    position: "absolute",
    bottom: "15%",
    alignItems: "center",
  },
  degreesText: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "200",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  directionText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 4,
    marginTop: 4,
  },

  pointerWrapper: {
    position: "absolute",
    alignItems: "center",
  },
});
