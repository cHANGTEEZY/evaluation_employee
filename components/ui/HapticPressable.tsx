import React from "react";
import { Pressable, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";
type HapticPressableProps = PressableProps & {
    children: React.ReactNode;
    hapticsEnabled?: boolean;
    hapticStyle?: Haptics.ImpactFeedbackStyle;
};
export const HapticPressable: React.FC<HapticPressableProps> = ({ children, onPress, hapticsEnabled = true, hapticStyle = Haptics.ImpactFeedbackStyle.Medium, ...rest }) => {
    const handlePress: PressableProps["onPress"] = (event) => {
        if (hapticsEnabled) {
            Haptics.impactAsync(hapticStyle).catch(() => {
            });
        }
        if (onPress) {
            onPress(event);
        }
    };
    return (<Pressable onPress={handlePress} {...rest}>
      {children}
    </Pressable>);
};
