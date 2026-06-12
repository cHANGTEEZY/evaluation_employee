import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
type UnitCardProps = {
    label: string;
    value: string;
    isHighlighted?: boolean;
    onPress?: () => void;
};
const UnitCard = ({ label, value, isHighlighted, onPress }: UnitCardProps) => {
    const theme = useTheme();
    const cardContent = (<>
      <Text variant="labelMedium" style={[styles.unitLabel, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      <Text variant="titleMedium" style={[styles.value, { color: theme.colors.onSurface }]} numberOfLines={1}>
        {value}
      </Text>
    </>);
    const cardStyle = [
        styles.card,
        {
            backgroundColor: theme.colors.surface,
            borderColor: isHighlighted ? theme.colors.primary : theme.colors.outline,
            borderWidth: isHighlighted ? 2 : StyleSheet.hairlineWidth,
        },
    ];
    if (onPress) {
        return (<Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.7 }]}>
        {cardContent}
      </Pressable>);
    }
    return <View style={cardStyle}>{cardContent}</View>;
};
export default UnitCard;
const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        minWidth: 100,
    },
    unitLabel: {
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    value: {
        fontWeight: "700",
    },
});
