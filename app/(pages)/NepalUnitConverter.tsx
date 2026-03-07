import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { useTheme, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  ModeToggle,
  UnitInput,
  UnitResultSection,
} from "../../components/nepal-unit-converter";
import type { ConverterMode } from "../../components/nepal-unit-converter";
import {
  AREA_UNITS,
  AREA_UNIT_GROUPS,
  LENGTH_UNITS,
  LENGTH_UNIT_GROUPS,
  areaToSquareMeters,
  squareMetersToArea,
  lengthToMeters,
  metersToLength,
} from "../../lib/nepal-unit-converter";
import type { AreaUnitKey } from "../../lib/nepal-unit-converter";
import type { LengthUnitKey } from "../../lib/nepal-unit-converter";

function formatDisplayValue(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n) && Math.abs(n) < 1e15) {
    return n.toLocaleString();
  }
  const fixed = n.toFixed(6).replace(/\.?0+$/, "");
  const num = parseFloat(fixed);
  if (Math.abs(num) >= 1000 || (Math.abs(num) < 0.0001 && num !== 0)) {
    return num.toExponential(4).replace(/(\.\d*?)0+(e[+-]\d+)/i, "$1$2");
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

const NepalUnitConverter = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<ConverterMode>("area");
  const [inputValue, setInputValue] = useState("1");
  const [fromUnitArea, setFromUnitArea] = useState<AreaUnitKey>("ropani");
  const [fromUnitLength, setFromUnitLength] = useState<LengthUnitKey>("haat");

  const numericValue = useMemo(() => {
    const n = parseFloat(inputValue);
    return Number.isFinite(n) ? n : 0;
  }, [inputValue]);

  const areaResults = useMemo(() => {
    const m2 = areaToSquareMeters(numericValue, fromUnitArea);
    return squareMetersToArea(m2);
  }, [numericValue, fromUnitArea]);

  const lengthResults = useMemo(() => {
    const m = lengthToMeters(numericValue, fromUnitLength);
    return metersToLength(m);
  }, [numericValue, fromUnitLength]);

  const fromUnit = mode === "area" ? fromUnitArea : fromUnitLength;
  const units = mode === "area" ? AREA_UNITS : LENGTH_UNITS;
  const results = mode === "area" ? areaResults : lengthResults;

  const handleModeChange = useCallback((newMode: ConverterMode) => {
    setMode(newMode);
  }, []);

  const handleUnitSelect = useCallback(
    (unitId: string) => {
      if (mode === "area") {
        setFromUnitArea(unitId as AreaUnitKey);
      } else {
        setFromUnitLength(unitId as LengthUnitKey);
      }
    },
    [mode],
  );

  const handleUnitCardPress = useCallback(
    (unitKey: string) => {
      if (mode === "area") {
        setFromUnitArea(unitKey as AreaUnitKey);
        setInputValue(
          formatDisplayValue(areaResults[unitKey as AreaUnitKey] ?? 0),
        );
      } else {
        setFromUnitLength(unitKey as LengthUnitKey);
        setInputValue(
          formatDisplayValue(lengthResults[unitKey as LengthUnitKey] ?? 0),
        );
      }
    },
    [mode, areaResults, lengthResults],
  );

  const handleNumericChange = useCallback((_num: number) => {
    // Optional: sync external state; we already derive from inputValue
  }, []);

  const getAreaLabel = useCallback((key: string) => {
    return AREA_UNITS.find((u) => u.id === key)?.label ?? key;
  }, []);

  const getLengthLabel = useCallback((key: string) => {
    return LENGTH_UNITS.find((u) => u.id === key)?.label ?? key;
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={[
          styles.header,
          { paddingTop: insets.top + 14, borderRadius: 30 },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextWrap}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Nepal Unit Converter
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              Convert between Nepali traditional and
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              standard units for area and length instantly
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <ModeToggle value={mode} onValueChange={handleModeChange} />

        <UnitInput
          value={inputValue}
          onValueChange={setInputValue}
          onNumericChange={handleNumericChange}
          units={units}
          selectedUnitId={fromUnit}
          onUnitSelect={handleUnitSelect}
        />

        {mode === "area" && (
          <>
            <UnitResultSection
              title="Hill Region (Ropani System)"
              icon="image-filter-hdr"
              unitKeys={AREA_UNIT_GROUPS.hill}
              results={areaResults}
              fromUnit={fromUnitArea}
              formatValue={formatDisplayValue}
              getUnitLabel={getAreaLabel}
              onUnitPress={handleUnitCardPress}
            />
            <UnitResultSection
              title="Terai Region (Bigha System)"
              icon="sprout"
              unitKeys={AREA_UNIT_GROUPS.terai}
              results={areaResults}
              fromUnit={fromUnitArea}
              formatValue={formatDisplayValue}
              getUnitLabel={getAreaLabel}
              onUnitPress={handleUnitCardPress}
            />
            <UnitResultSection
              title="Standard Units"
              icon="ruler-square"
              unitKeys={AREA_UNIT_GROUPS.standard}
              results={areaResults}
              fromUnit={fromUnitArea}
              formatValue={formatDisplayValue}
              getUnitLabel={getAreaLabel}
              onUnitPress={handleUnitCardPress}
            />
          </>
        )}

        {mode === "length" && (
          <>
            <UnitResultSection
              title="Nepali Traditional Units"
              icon="ruler"
              unitKeys={LENGTH_UNIT_GROUPS.nepali}
              results={lengthResults}
              fromUnit={fromUnitLength}
              formatValue={formatDisplayValue}
              getUnitLabel={getLengthLabel}
              onUnitPress={handleUnitCardPress}
            />
            <UnitResultSection
              title="Standard Units"
              icon="ruler-square"
              unitKeys={LENGTH_UNIT_GROUPS.standard}
              results={lengthResults}
              fromUnit={fromUnitLength}
              formatValue={formatDisplayValue}
              getUnitLabel={getLengthLabel}
              onUnitPress={handleUnitCardPress}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default NepalUnitConverter;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 16,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headerTitle: {
    color: "white",
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
});
