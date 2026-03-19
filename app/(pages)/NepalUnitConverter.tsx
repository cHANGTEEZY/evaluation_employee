import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { useTheme, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  metersToCompoundNepaliLength,
  squareMetersToCompoundHill,
  squareMetersToCompoundTerai,
} from "../../lib/nepal-unit-converter";
import type { AreaUnitKey } from "../../lib/nepal-unit-converter";
import type { LengthUnitKey } from "../../lib/nepal-unit-converter";

function formatDisplayValue(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n) && Math.abs(n) < 1e15) {
    return n.toLocaleString();
  }
  // Display with up to 2 decimal places for readability.
  const fixed = n.toFixed(2).replace(/\.?0+$/, "");
  const num = parseFloat(fixed);
  if (Math.abs(num) >= 1000 || (Math.abs(num) < 0.0001 && num !== 0)) {
    return num.toExponential(2).replace(/(\.\d*?)0+(e[+-]\d+)/i, "$1$2");
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const NepalUnitConverter = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<ConverterMode>("area");
  const [displayMode, setDisplayMode] = useState<"exact" | "relative">("exact");
  const [inputValue, setInputValue] = useState("1");
  const [fromUnitArea, setFromUnitArea] = useState<AreaUnitKey>("ropani");
  const [fromUnitLength, setFromUnitLength] = useState<LengthUnitKey>("haat");

  const numericValue = useMemo(() => {
    const n = parseFloat(inputValue);
    return Number.isFinite(n) ? n : 0;
  }, [inputValue]);

  const areaM2 = useMemo(() => {
    return areaToSquareMeters(numericValue, fromUnitArea);
  }, [numericValue, fromUnitArea]);
  const areaResultsExact = useMemo(() => {
    return squareMetersToArea(areaM2);
  }, [areaM2]);
  const areaResultsRelative = useMemo(() => {
    if (displayMode !== "relative") return areaResultsExact;
    const hill = squareMetersToCompoundHill(areaM2);
    const terai = squareMetersToCompoundTerai(areaM2);
    return {
      ...areaResultsExact,
      ...hill,
      ...terai,
    };
  }, [areaM2, areaResultsExact, displayMode]);

  const lengthM = useMemo(() => {
    return lengthToMeters(numericValue, fromUnitLength);
  }, [numericValue, fromUnitLength]);
  const lengthResultsExact = useMemo(() => {
    return metersToLength(lengthM);
  }, [lengthM]);
  const lengthResultsRelative = useMemo(() => {
    if (displayMode !== "relative") return lengthResultsExact;
    const nepali = metersToCompoundNepaliLength(lengthM);
    return {
      ...lengthResultsExact,
      ...nepali,
    };
  }, [displayMode, lengthM, lengthResultsExact]);

  const fromUnit = mode === "area" ? fromUnitArea : fromUnitLength;
  const units = mode === "area" ? AREA_UNITS : LENGTH_UNITS;

  function formatCompoundValue(n: number): string {
    if (!Number.isFinite(n)) return "0";
    return Math.trunc(n).toLocaleString();
  }

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
          formatDisplayValue(
            areaResultsExact[unitKey as AreaUnitKey] ?? 0,
          ),
        );
      } else {
        setFromUnitLength(unitKey as LengthUnitKey);
        setInputValue(
          formatDisplayValue(
            lengthResultsExact[unitKey as LengthUnitKey] ?? 0,
          ),
        );
      }
    },
    [mode, areaResultsExact, lengthResultsExact],
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

        <View style={styles.displayModeToggleRow}>
          <Pressable
            onPress={() => setDisplayMode("exact")}
            style={[
              styles.displayModeBtn,
              displayMode === "exact" && {
                backgroundColor:
                  theme.colors.primaryContainer ?? theme.colors.primary,
                borderColor: theme.colors.primary,
                borderWidth: 2,
              },
            ]}
          >
            <Text
              variant="labelLarge"
              style={[
                styles.displayModeLabel,
                {
                  color:
                    displayMode === "exact"
                      ? theme.colors.onPrimaryContainer ?? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Exact
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDisplayMode("relative")}
            style={[
              styles.displayModeBtn,
              displayMode === "relative" && {
                backgroundColor:
                  theme.colors.primaryContainer ?? theme.colors.primary,
                borderColor: theme.colors.primary,
                borderWidth: 2,
              },
            ]}
          >
            <Text
              variant="labelLarge"
              style={[
                styles.displayModeLabel,
                {
                  color:
                    displayMode === "relative"
                      ? theme.colors.onPrimaryContainer ?? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Relative
            </Text>
          </Pressable>
        </View>

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
              results={areaResultsRelative}
              fromUnit={fromUnitArea}
              formatValue={displayMode === "relative" ? formatCompoundValue : formatDisplayValue}
              getUnitLabel={getAreaLabel}
              onUnitPress={handleUnitCardPress}
            />
            <UnitResultSection
              title="Terai Region (Bigha System)"
              icon="sprout"
              unitKeys={AREA_UNIT_GROUPS.terai}
              results={areaResultsRelative}
              fromUnit={fromUnitArea}
              formatValue={displayMode === "relative" ? formatCompoundValue : formatDisplayValue}
              getUnitLabel={getAreaLabel}
              onUnitPress={handleUnitCardPress}
            />
            <UnitResultSection
              title="Standard Units"
              icon="ruler-square"
              unitKeys={AREA_UNIT_GROUPS.standard}
              results={areaResultsExact}
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
              results={lengthResultsRelative}
              fromUnit={fromUnitLength}
              formatValue={displayMode === "relative" ? formatCompoundValue : formatDisplayValue}
              getUnitLabel={getLengthLabel}
              onUnitPress={handleUnitCardPress}
            />
            <UnitResultSection
              title="Standard Units"
              icon="ruler-square"
              unitKeys={LENGTH_UNIT_GROUPS.standard}
              results={lengthResultsExact}
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
  displayModeToggleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  displayModeBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  displayModeLabel: {
    fontWeight: "700",
  },
});
