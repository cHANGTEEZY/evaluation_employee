import React, { useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LEFT_BAR_D = "M 26 18 L 26 82";
const RIGHT_BAR_D = "M 74 18 L 74 82";
const V_PATH_D = "M 36 18 L 50 70 L 64 18";
const BASE_D = "M 32 82 L 68 82";
const BAR_PATH_LENGTH = 80;
const V_PATH_LENGTH = 140;
const BASE_PATH_LENGTH = 80;
const DRAW_DURATION_MS = 1400;
const HOLD_AFTER_DRAW_MS = 400;
const FADE_OUT_DURATION_MS = 500;
type Props = {
  onFinish: () => void;
  minDisplayTime?: number;
};
const AnimatedPath = Animated.createAnimatedComponent(Path);
export default function AnimatedSplashScreen({
  onFinish,
  minDisplayTime = 2500,
}: Props) {
  const leftOffset = useSharedValue(BAR_PATH_LENGTH);
  const rightOffset = useSharedValue(BAR_PATH_LENGTH);
  const vOffset = useSharedValue(V_PATH_LENGTH);
  const baseOffset = useSharedValue(BASE_PATH_LENGTH);
  const containerOpacity = useSharedValue(1);
  useEffect(() => {
    leftOffset.value = withTiming(0, {
      duration: DRAW_DURATION_MS,
    });
    vOffset.value = withDelay(
      150,
      withTiming(0, {
        duration: DRAW_DURATION_MS,
      }),
    );
    rightOffset.value = withDelay(
      250,
      withTiming(0, {
        duration: DRAW_DURATION_MS * 0.7,
      }),
    );
    baseOffset.value = withDelay(
      450,
      withTiming(0, {
        duration: DRAW_DURATION_MS * 0.6,
      }),
    );
    const holdTime = Math.max(
      HOLD_AFTER_DRAW_MS,
      minDisplayTime - DRAW_DURATION_MS - FADE_OUT_DURATION_MS,
    );
    containerOpacity.value = withDelay(
      DRAW_DURATION_MS + holdTime,
      withTiming(0, { duration: FADE_OUT_DURATION_MS }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [minDisplayTime, onFinish]);
  const leftPathProps = useAnimatedProps(() => ({
    strokeDashoffset: leftOffset.value,
  }));
  const rightPathProps = useAnimatedProps(() => ({
    strokeDashoffset: rightOffset.value,
  }));
  const vPathProps = useAnimatedProps(() => ({
    strokeDashoffset: vOffset.value,
  }));
  const basePathProps = useAnimatedProps(() => ({
    strokeDashoffset: baseOffset.value,
  }));
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));
  const size = Math.min(SCREEN_WIDTH * 0.5, 180);
  const viewBox = "0 0 100 100";
  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={viewBox}>
        <AnimatedPath
          d={LEFT_BAR_D}
          fill="none"
          stroke="#A0A0A0"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={BAR_PATH_LENGTH}
          animatedProps={leftPathProps}
        />

        <AnimatedPath
          d={RIGHT_BAR_D}
          fill="none"
          stroke="#A0A0A0"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={BAR_PATH_LENGTH}
          animatedProps={rightPathProps}
        />

        <AnimatedPath
          d={V_PATH_D}
          fill="none"
          stroke="#2962FF"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={V_PATH_LENGTH}
          animatedProps={vPathProps}
        />

        <AnimatedPath
          d={BASE_D}
          fill="none"
          stroke="#2962FF"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={BASE_PATH_LENGTH}
          animatedProps={basePathProps}
        />
      </Svg>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
});
