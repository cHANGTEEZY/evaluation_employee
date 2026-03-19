import {
  StyleSheet,
  View,
  Alert,
  Image,
  ScrollView,
  Pressable,
  Text as RNText,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Button, Divider, Surface, Text, useTheme } from "react-native-paper";
import { File, Paths } from "expo-file-system";
import { useFormContext } from "react-hook-form";
import ViewShot from "react-native-view-shot";
import PropertyPlotter, {
  type PlotterData,
  type PlotterUIState,
  type PlotTriangle,
  type PropertyPlotterRef,
  type MeasureUnit,
  type TapMode,
} from "../PropertyPlotter";
import { UnitResultSection } from "../nepal-unit-converter";
import {
  AREA_UNITS,
  AREA_UNIT_GROUPS,
  squareMetersToArea,
  squareMetersToCompoundHill,
  squareMetersToCompoundTerai,
} from "../../lib/nepal-unit-converter";

// ─── Heron's formula ─────────────────────────────────────────────────────────

function distInFt(
  d: { feet: number; inches: number; totalFt?: number; meters?: number } | null,
): number | null {
  if (!d) return null;
  // Prefer pre-computed totalFt (set for both imperial and metric inputs)
  if (d.totalFt != null && d.totalFt > 0) return d.totalFt;
  // Fallback: compute from feet+inches (old saved data)
  const total = d.feet + d.inches / 12;
  return total > 0 ? total : null;
}

/**
 * Compute triangle area in sq ft from three side lengths (feet) via Heron's formula.
 * Returns null if any side is missing or the triangle is degenerate.
 */
function heronSqFt(
  a: number | null,
  b: number | null,
  c: number | null,
): number | null {
  if (a == null || b == null || c == null) return null;
  if (a <= 0 || b <= 0 || c <= 0) return null;
  // Triangle inequality: use strict < so near-degenerate triangles still compute
  if (a + b < c || a + c < b || b + c < a) return null;
  const s = (a + b + c) / 2;
  const area2 = s * (s - a) * (s - b) * (s - c);
  if (area2 < 0) return null;
  return Math.sqrt(Math.max(0, area2));
}

function sqFtToSqM(sqFt: number): number {
  return sqFt * 0.09290304;
}

// ─── Step4 ────────────────────────────────────────────────────────────────────

type Step4Props = {
  onDrawingSaved?: (uri: string) => void;
};

const Step4 = ({ onDrawingSaved }: Step4Props) => {
  const form = useFormContext();
  const existingDrawing = form.watch("site_plan_drawing");
  const existingPlotterData = form.watch("site_plan_plotter_data");

  // Parse saved plotter data once so we can seed both the canvas and the
  // AreaDetailsPanel without waiting for the canvas ref to be ready.
  const initialPlotterData = React.useMemo<PlotterData | null>(() => {
    if (!existingPlotterData) return null;
    try {
      return JSON.parse(existingPlotterData) as PlotterData;
    } catch {
      return null;
    }
  }, [existingPlotterData]);

  const [plotterData, setPlotterData] = useState<PlotterData | null>(
    initialPlotterData,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedUri, setSavedUri] = useState<string | null>(
    existingDrawing || null,
  );
  const [plotterUIState, setPlotterUIState] = useState<PlotterUIState>({
    measureUnit: "imperial",
    tapMode: "select",
    selectedCount: 0,
    pointCount: 0,
  });
  const [areaDisplayMode, setAreaDisplayMode] = useState<
    "exact" | "relative"
  >("exact");

  const plotterRef = useRef<PropertyPlotterRef>(null);
  const captureViewRef = useRef<ViewShot>(null);

  const theme = useTheme();

  useEffect(() => {
    if (existingDrawing) setSavedUri(existingDrawing);
  }, [existingDrawing]);

  // Keep the form value in sync with canvas state so draft saves always
  // include the latest plotter data — even without clicking "Save Drawing".
  useEffect(() => {
    if (!plotterData) return;
    form.setValue("site_plan_plotter_data", JSON.stringify(plotterData), {
      shouldDirty: true,
    });
  }, [plotterData]);

  const hasPoints = (plotterData?.points.length ?? 0) > 0;
  const hasTriangles = (plotterData?.triangles?.length ?? 0) > 0;

  const handleSaveDrawing = async () => {
    if (!hasPoints) {
      Alert.alert(
        "No Drawing",
        "Please place at least one point before saving.",
      );
      return;
    }
    try {
      setIsSaving(true);
      // Capture the ViewShot that wraps the canvas + measurement panel so the
      // saved PNG includes both the drawing and all area/side measurements.
      const capturedUri = await captureViewRef.current?.capture?.();
      if (capturedUri) {
        const fileName = `site_plan_${Date.now()}.png`;
        const destFile = new File(Paths.document, fileName);
        const sourceFile = new File(capturedUri);
        await sourceFile.copy(destFile);
        const destUri = destFile.uri;
        setSavedUri(destUri);
        form.setValue("site_plan_drawing", destUri, { shouldDirty: true });
        onDrawingSaved?.(destUri);
      }
      if (plotterData) {
        form.setValue("site_plan_plotter_data", JSON.stringify(plotterData), {
          shouldDirty: true,
        });
      }
      Alert.alert("Success", "Site plan saved successfully!");
    } catch (error) {
      console.error("Error saving site plan:", error);
      Alert.alert("Error", "Failed to save site plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDrawing = () => {
    Alert.alert(
      "Clear Site Plan?",
      "This will remove all points and triangles. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            plotterRef.current?.clear();
            setPlotterData(null);
            setSavedUri(null);
            form.setValue("site_plan_drawing", "");
            form.setValue("site_plan_plotter_data", "");
          },
        },
      ],
    );
  };

  const showSavedPreview = savedUri && !hasPoints && !existingPlotterData;

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
    >
      <Text variant="titleMedium" style={styles.title}>
        Draw Site Plan
      </Text>

      {/* Plotter toolbar — above the canvas */}
      <View style={styles.plotterToolbar}>
        <Button
          mode={
            plotterUIState.measureUnit === "imperial"
              ? "contained-tonal"
              : "outlined"
          }
          icon="ruler"
          onPress={() =>
            plotterRef.current?.setMeasureUnit(
              plotterUIState.measureUnit === "imperial" ? "metric" : "imperial",
            )
          }
          compact
          style={styles.toolbarBtn}
        >
          {plotterUIState.measureUnit === "imperial" ? "ft/in" : "m/cm"}
        </Button>

        <Button
          mode={plotterUIState.tapMode === "delete" ? "contained" : "outlined"}
          icon={
            plotterUIState.tapMode === "delete" ? "cursor-pointer" : "delete"
          }
          onPress={() =>
            plotterRef.current?.setTapMode(
              plotterUIState.tapMode === "select" ? "delete" : "select",
            )
          }
          compact
          buttonColor={
            plotterUIState.tapMode === "delete" ? theme.colors.error : undefined
          }
          textColor={
            plotterUIState.tapMode === "delete" ? "white" : theme.colors.error
          }
          style={[styles.toolbarBtn, { borderColor: theme.colors.error }]}
        >
          {plotterUIState.tapMode === "delete" ? "Delete On" : "Delete"}
        </Button>

        <Button
          mode="outlined"
          icon="undo"
          onPress={() => plotterRef.current?.undo()}
          disabled={plotterUIState.pointCount === 0}
          compact
          textColor={theme.colors.tertiary}
          style={[styles.toolbarBtn, { borderColor: theme.colors.outline }]}
        >
          Undo
        </Button>

        {plotterUIState.selectedCount > 0 && (
          <Button
            mode="outlined"
            icon="close"
            onPress={() => plotterRef.current?.deselectAll()}
            compact
            textColor={theme.colors.error}
            style={[styles.toolbarBtn, { borderColor: theme.colors.error }]}
          >
            {`Deselect (${plotterUIState.selectedCount})`}
          </Button>
        )}
      </View>

      {/* ViewShot wraps the canvas + text data overlay for PNG export */}
      <ViewShot
        ref={captureViewRef}
        options={{ format: "png", quality: 1 }}
        style={styles.viewShotWrapper}
      >
        <View style={styles.canvasContainer}>
          {showSavedPreview ? (
            <>
              <Image
                source={{ uri: savedUri }}
                style={styles.savedImage}
                resizeMode="contain"
              />
              <View
                style={[
                  styles.savedOverlay,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Text style={{ color: theme.colors.onPrimaryContainer }}>
                  ✓ Saved site plan — clear to redraw
                </Text>
              </View>
            </>
          ) : (
            <PropertyPlotter
              ref={plotterRef}
              onDataChange={setPlotterData}
              onUIStateChange={setPlotterUIState}
              initialData={initialPlotterData}
            />
          )}
        </View>

        {/* Structured text data overlay — captured in PNG */}
        {!showSavedPreview && hasTriangles && plotterData && (
          <TextDataOverlay data={plotterData} displayMode={areaDisplayMode} />
        )}
      </ViewShot>

      {/* Measurement panel — visible on screen but NOT in PNG */}
      {!showSavedPreview && hasTriangles && plotterData && (
        <MeasurementPanel
          data={plotterData}
          displayMode={areaDisplayMode}
          onDisplayModeChange={setAreaDisplayMode}
        />
      )}

      {!!savedUri && hasPoints && (
        <View
          style={[
            styles.savedIndicator,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={{ color: theme.colors.onPrimaryContainer }}>
            ✓ Unsaved changes — press Save to update
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleClearDrawing}
          disabled={!hasPoints && !savedUri}
          style={styles.button}
          icon="eraser"
        >
          Clear
        </Button>
        <Button
          mode="contained"
          onPress={handleSaveDrawing}
          loading={isSaving}
          disabled={isSaving || !hasPoints}
          style={styles.button}
          icon="content-save"
        >
          {savedUri ? "Resave" : "Save Drawing"}
        </Button>
      </View>
    </ScrollView>
  );
};

export default Step4;

// ─── TextDataOverlay ──────────────────────────────────────────────────────────
// Compact text overlay with structured calculation data — rendered inside ViewShot
// so it appears in the captured PNG below the canvas.

type TextDataOverlayProps = {
  data: PlotterData;
  displayMode: "exact" | "relative";
};

function TextDataOverlay({ data, displayMode }: TextDataOverlayProps) {
  const { triangles } = data;

  function rawValue(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(n)) return "0";
    return n.toLocaleString(undefined, {
      useGrouping: false,
      maximumFractionDigits: 2,
    });
  }

  interface TriangleResult {
    tri: PlotTriangle;
    index: number;
    sides: [number | null, number | null, number | null];
    areaSqFt: number | null;
    areaSqM: number | null;
  }

  const results: TriangleResult[] = triangles.map((tri, idx) => {
    const [a, b, c] = [
      distInFt(tri.sides[0]),
      distInFt(tri.sides[1]),
      distInFt(tri.sides[2]),
    ];
    const areaSqFt = heronSqFt(a, b, c);
    return {
      tri,
      index: idx,
      sides: [a, b, c],
      areaSqFt,
      areaSqM: areaSqFt != null ? sqFtToSqM(areaSqFt) : null,
    };
  });

  const totalSqFt = results.reduce((sum, r) => sum + (r.areaSqFt ?? 0), 0);
  const measuredCount = results.filter((r) => r.areaSqFt != null).length;
  const totalSqM = totalSqFt * 0.09290304;
  const areaResultsExact = squareMetersToArea(totalSqM);
  const areaResults =
    displayMode === "relative"
      ? {
          ...areaResultsExact,
          ...squareMetersToCompoundHill(totalSqM),
          ...squareMetersToCompoundTerai(totalSqM),
        }
      : areaResultsExact;

  function sideLabelFt(s: number | null): string {
    if (s == null) return "N/A";
    let ft = Math.floor(s);
    let inches = Math.round((s - ft) * 12);
    if (inches >= 12) {
      ft += Math.floor(inches / 12);
      inches = inches % 12;
    }
    if (ft > 0 && inches > 0) return `${ft}ft ${inches}in`;
    if (ft > 0) return `${ft}ft`;
    return `${inches}in`;
  }

  return (
    <View style={styles.textOverlay}>
      <RNText style={styles.textOverlayTitle}>SITE PLAN MEASUREMENTS</RNText>
      <RNText style={styles.textOverlayDivider}>
        ═══════════════════════════════
      </RNText>

      {results.map((r) => {
        const [ai, bi, ci] = r.tri.pointIndices;
        return (
          <View key={r.tri.id} style={styles.textTriBlock}>
            <RNText style={styles.textTriTitle}>
              Triangle {r.index + 1} (p{ai + 1}-p{bi + 1}-p{ci + 1})
            </RNText>
            <RNText style={styles.textTriData}>
              • Side p{ai + 1}→p{bi + 1}: {sideLabelFt(r.sides[0])}
            </RNText>
            <RNText style={styles.textTriData}>
              • Side p{bi + 1}→p{ci + 1}: {sideLabelFt(r.sides[1])}
            </RNText>
            <RNText style={styles.textTriData}>
              • Side p{ci + 1}→p{ai + 1}: {sideLabelFt(r.sides[2])}
            </RNText>
            {r.areaSqFt != null && r.areaSqM != null ? (
              <RNText style={styles.textTriArea}>
                → Area: {rawValue(r.areaSqFt)} sq ft ({rawValue(r.areaSqM)} m²)
              </RNText>
            ) : (
              <RNText style={styles.textTriArea}>→ Area: Incomplete</RNText>
            )}
          </View>
        );
      })}

      {measuredCount > 0 && (
        <>
          <RNText style={styles.textOverlayDivider}>
            ═══════════════════════════════
          </RNText>
          <RNText style={styles.textTotalTitle}>TOTAL AREA</RNText>
          <RNText style={styles.textTotalData}>
            {rawValue(totalSqFt)} sq ft | {rawValue(totalSqM)} m²
          </RNText>
          <RNText style={styles.textTotalData}>
            Ropani: {rawValue(areaResults.ropani)} | Aana:{" "}
            {rawValue(areaResults.aana)}
          </RNText>
          <RNText style={styles.textTotalData}>
            Paisa: {rawValue(areaResults.paisa)} | Dam:{" "}
            {rawValue(areaResults.dam)}
          </RNText>
          <RNText style={styles.textTotalData}>
            Bigha: {rawValue(areaResults.bigha)} | Kattha:{" "}
            {rawValue(areaResults.kattha)}
          </RNText>
          <RNText style={styles.textTotalData}>
            Dhur: {rawValue(areaResults.dhur)} | Square Feet:{" "}
            {rawValue(areaResults.square_feet)}
          </RNText>
          <RNText style={styles.textTotalData}>
            Square Meter: {rawValue(areaResults.square_meter)} | Hectare:{" "}
            {rawValue(areaResults.hectare)}
          </RNText>
          <RNText style={styles.textTotalData}>
            Acre: {rawValue(areaResults.acre)}
          </RNText>
        </>
      )}
    </View>
  );
}

// ─── MeasurementPanel ─────────────────────────────────────────────────────────
// Rendered OUTSIDE ViewShot so it appears on screen but NOT in the captured PNG.
// Uses app theme colors for on-screen display.

type MeasurementPanelProps = {
  data: PlotterData;
  displayMode: "exact" | "relative";
  onDisplayModeChange: (mode: "exact" | "relative") => void;
};

function MeasurementPanel({
  data,
  displayMode,
  onDisplayModeChange,
}: MeasurementPanelProps) {
  const { triangles } = data;
  const theme = useTheme();

  interface TriangleResult {
    tri: PlotTriangle;
    index: number;
    sides: [number | null, number | null, number | null];
    areaSqFt: number | null;
    areaSqM: number | null;
  }

  const results: TriangleResult[] = triangles.map((tri, idx) => {
    const [a, b, c] = [
      distInFt(tri.sides[0]),
      distInFt(tri.sides[1]),
      distInFt(tri.sides[2]),
    ];
    const areaSqFt = heronSqFt(a, b, c);
    return {
      tri,
      index: idx,
      sides: [a, b, c],
      areaSqFt,
      areaSqM: areaSqFt != null ? sqFtToSqM(areaSqFt) : null,
    };
  });

  const totalSqFt = results.reduce((sum, r) => sum + (r.areaSqFt ?? 0), 0);
  const measuredCount = results.filter((r) => r.areaSqFt != null).length;
  const totalSqM = totalSqFt * 0.09290304;
  const areaResultsExact = squareMetersToArea(totalSqM);
  const areaResults =
    displayMode === "relative"
      ? {
          ...areaResultsExact,
          ...squareMetersToCompoundHill(totalSqM),
          ...squareMetersToCompoundTerai(totalSqM),
        }
      : areaResultsExact;

  // Use theme colors for on-screen display
  const cardBg = theme.colors.surfaceVariant;
  const labelColor = theme.colors.onSurfaceVariant;
  const valueColor = theme.colors.onSurface;
  const accentColor = theme.colors.primary;

  function formatValue(n: number): string {
    if (!Number.isFinite(n)) return "0";
    const fixed = n.toFixed(2).replace(/\.?0+$/, "");
    return parseFloat(fixed).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  function getUnitLabel(key: string): string {
    return AREA_UNITS.find((u) => u.id === key)?.label ?? key;
  }

  function pointLabel(idx: number): string {
    return `p${idx + 1}`;
  }

  function sideLabel(s: number | null): string {
    if (s == null) return "—";
    let ft = Math.floor(s);
    let inches = Math.round((s - ft) * 12);
    // Handle rounding that produces 12+ inches
    if (inches >= 12) {
      ft += Math.floor(inches / 12);
      inches = inches % 12;
    }
    if (ft > 0 && inches > 0) return `${ft}′ ${inches}″`;
    if (ft > 0) return `${ft}′`;
    return `${inches}″`;
  }

  return (
    <Surface
      style={[styles.detailsPanel, { backgroundColor: cardBg }]}
      elevation={1}
    >
      <Text
        variant="titleSmall"
        style={[styles.detailsTitle, { color: accentColor }]}
      >
        Area Details
      </Text>

      {/* Per-triangle side breakdown */}
      {results.map((r) => {
        const [ai, bi, ci] = r.tri.pointIndices;
        const allSidesPresent =
          r.sides[0] != null && r.sides[1] != null && r.sides[2] != null;
        const complete = allSidesPresent && r.areaSqFt != null;

        return (
          <View key={r.tri.id} style={styles.triRow}>
            <View style={styles.triHeader}>
              <Text
                variant="labelLarge"
                style={{ color: accentColor, fontWeight: "700" }}
              >
                Triangle {r.index + 1}
              </Text>
              <Text variant="labelMedium" style={{ color: labelColor }}>
                {pointLabel(ai)} – {pointLabel(bi)} – {pointLabel(ci)}
              </Text>
            </View>

            {/* Side lengths */}
            <View style={styles.sidesRow}>
              {([0, 1, 2] as const).map((s) => (
                <View key={s} style={styles.sideCell}>
                  <Text variant="labelSmall" style={{ color: labelColor }}>
                    {s === 0
                      ? `${pointLabel(ai)}→${pointLabel(bi)}`
                      : s === 1
                        ? `${pointLabel(bi)}→${pointLabel(ci)}`
                        : `${pointLabel(ci)}→${pointLabel(ai)}`}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color:
                        r.sides[s] != null ? valueColor : theme.colors.error,
                      fontWeight: "600",
                    }}
                  >
                    {sideLabel(r.sides[s])}
                  </Text>
                </View>
              ))}
            </View>

            {complete && r.areaSqFt != null && r.areaSqM != null ? (
              <View style={styles.areaBlock}>
                <View style={styles.areaRow}>
                  <Text variant="labelSmall" style={{ color: labelColor }}>
                    Area
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: valueColor, fontWeight: "700" }}
                  >
                    {r.areaSqFt.toFixed(4)} sq ft
                    {"  "}
                    <Text style={{ color: labelColor, fontWeight: "400" }}>
                      ({r.areaSqM.toFixed(4)} m²)
                    </Text>
                  </Text>
                </View>
              </View>
            ) : allSidesPresent ? (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.error, marginTop: 4 }}
              >
                Invalid triangle — these side lengths don't form a valid
                triangle. Please re-check your measurements.
              </Text>
            ) : (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.error, marginTop: 4 }}
              >
                Incomplete — tap triangle edges to add all 3 side lengths
              </Text>
            )}

            <Divider style={{ marginTop: 10 }} />
          </View>
        );
      })}

      {/* Total area */}
      {measuredCount > 0 && (
        <View
          style={[
            styles.totalBlock,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text
            variant="titleSmall"
            style={{
              color: theme.colors.onPrimaryContainer,
              fontWeight: "700",
            }}
          >
            Total Area
            {measuredCount < triangles.length
              ? ` (${measuredCount}/${triangles.length} complete)`
              : ""}
          </Text>
          <View style={styles.totalRow}>
            <Text
              variant="bodyLarge"
              style={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: "800",
              }}
            >
              {totalSqFt.toFixed(4)} sq ft
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onPrimaryContainer }}
            >
              {totalSqM.toFixed(4)} m²
            </Text>
          </View>

          <View style={styles.displayModeToggleRow}>
            <Pressable
              onPress={() => onDisplayModeChange("exact")}
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
              onPress={() => onDisplayModeChange("relative")}
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

          <UnitResultSection
            title="Hill Region (Ropani System)"
            icon="image-filter-hdr"
            unitKeys={AREA_UNIT_GROUPS.hill}
            results={areaResults}
            fromUnit="ropani"
            formatValue={formatValue}
            getUnitLabel={getUnitLabel}
          />
          <UnitResultSection
            title="Terai Region (Bigha System)"
            icon="sprout"
            unitKeys={AREA_UNIT_GROUPS.terai}
            results={areaResults}
            fromUnit="bigha"
            formatValue={formatValue}
            getUnitLabel={getUnitLabel}
          />
          <UnitResultSection
            title="Standard Units"
            icon="ruler-square"
            unitKeys={AREA_UNIT_GROUPS.standard}
            results={areaResults}
            fromUnit="square_feet"
            formatValue={formatValue}
            getUnitLabel={getUnitLabel}
          />
        </View>
      )}

      {measuredCount === 0 && (
        <Text
          variant="bodySmall"
          style={{ color: labelColor, textAlign: "center", marginTop: 4 }}
        >
          Create triangles and enter their side lengths to see area
          calculations.
        </Text>
      )}
    </Surface>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingBottom: 20,
  },
  plotterToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  toolbarBtn: {
    alignSelf: "flex-start",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  canvasContainer: {
    height: 480,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  savedImage: {
    flex: 1,
    height: 480,
    width: "100%",
  },
  savedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    alignItems: "center",
  },
  savedIndicator: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
  },
  viewShotWrapper: {
    // ViewShot needs a defined background so the PNG exports cleanly
    backgroundColor: "#ffffff",
  },
  // Text overlay styles (for PNG structured data)
  textOverlay: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderTopWidth: 2,
    borderTopColor: "#1a237e",
  },
  textOverlayTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a237e",
    marginBottom: 4,
  },
  textOverlayDivider: {
    fontSize: 10,
    color: "#9e9e9e",
    marginVertical: 4,
  },
  textTriBlock: {
    marginBottom: 8,
  },
  textTriTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 2,
  },
  textTriData: {
    fontSize: 10,
    color: "#555555",
    marginLeft: 4,
  },
  textTriArea: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1565c0",
    marginLeft: 4,
    marginTop: 2,
  },
  textTotalTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a237e",
    marginTop: 4,
    marginBottom: 4,
  },
  textTotalData: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 4,
  },
  // Area / measurement panel
  detailsPanel: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  detailsTitle: {
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  triRow: {
    marginBottom: 4,
  },
  triHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sidesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  sideCell: {
    flex: 1,
    gap: 2,
  },
  areaBlock: {
    gap: 3,
    marginBottom: 4,
  },
  areaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalBlock: {
    marginTop: 14,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  totalRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "baseline",
  },
  totalUnitBox: {
    gap: 2,
  },
  displayModeToggleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  displayModeBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  displayModeLabel: {
    fontWeight: "700",
  },
});
