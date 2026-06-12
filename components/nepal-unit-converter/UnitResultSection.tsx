import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import UnitCard from "./UnitCard";
type UnitResultSectionProps = {
    title: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    unitKeys: readonly string[];
    results: Record<string, number>;
    fromUnit: string;
    formatValue: (n: number) => string;
    getUnitLabel: (key: string) => string;
    onUnitPress?: (unitKey: string) => void;
};
const UnitResultSection = ({ title, icon = "ruler", unitKeys, results, fromUnit, formatValue, getUnitLabel, onUnitPress, }: UnitResultSectionProps) => {
    const theme = useTheme();
    return (<View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary}/>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
      </View>
      <View style={styles.cardsRow}>
        {(unitKeys as readonly string[]).map((key) => (<UnitCard key={key} label={getUnitLabel(key)} value={formatValue(results[key] ?? 0)} isHighlighted={key === fromUnit} onPress={onUnitPress ? () => onUnitPress(key) : undefined}/>))}
      </View>
    </View>);
};
export default UnitResultSection;
const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontWeight: "600",
    },
    cardsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
});
