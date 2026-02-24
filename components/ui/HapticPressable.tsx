import React from "react";
import { Pressable, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";

type HapticPressableProps = PressableProps & {
  children: React.ReactNode;
  /**
   * Whether to enable haptic feedback on press.
   * Defaults to true.
   */
  hapticsEnabled?: boolean;
  /**
   * Optional custom haptic pattern.
   * Defaults to Haptics.ImpactFeedbackStyle.Medium.
   */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
};

/**
 * A thin wrapper around Pressable that adds haptic feedback on press.
 *
 * Layout:
 * - Uses Pressable directly so it behaves like any other Pressable wrapper.
 * - Does not inject extra View layers, so wrapping existing content should not
 *   change layout beyond normal Pressable behavior.
 */
export const HapticPressable: React.FC<HapticPressableProps> = ({
  children,
  onPress,
  hapticsEnabled = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Medium,
  ...rest
}) => {
  const handlePress: PressableProps["onPress"] = (event) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(hapticStyle).catch(() => {
        // Best-effort only; ignore haptics errors
      });
    }

    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Pressable onPress={handlePress} {...rest}>
      {children}
    </Pressable>
  );
};

