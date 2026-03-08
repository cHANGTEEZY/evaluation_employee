import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";
import * as Haptics from "expo-haptics";

export interface PlotPoint {
  x: number;
  y: number;
}

export interface PlotDistance {
  feet: number;
  inches: number;
}

export interface PlotterData {
  points: PlotPoint[];
  /** distances[i] = edge from points[i] to points[(i+1) % n] */
  distances: PlotDistance[];
  isClosed: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export interface PropertyPlotterRef {
  clear: () => void;
  getData: () => PlotterData;
  loadData: (data: PlotterData) => void;
  capture: () => Promise<string | undefined>;
}

interface PropertyPlotterProps {
  onDataChange?: (data: PlotterData) => void;
}

//* Distance from point P to point Q.
function distanceToPoint(tap: PlotPoint, pt: PlotPoint): number {
  return Math.hypot(tap.x - pt.x, tap.y - pt.y);
}

//* Perpendicular distance from point P to segment AB, clamped to segment.
function distanceToSegment(p: PlotPoint, a: PlotPoint, b: PlotPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distanceToPoint(p, a);
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq),
  );
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function midpoint(a: PlotPoint, b: PlotPoint): PlotPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function formatDistance(d: PlotDistance | undefined): string {
  if (!d) return "";
  const { feet, inches } = d;
  if (feet > 0 && inches > 0) return `${feet} ft ${inches} in`;
  if (feet > 0) return `${feet} ft`;
  if (inches > 0) return `${inches} in`;
  return "";
}

//* Constants
const HIT_VERTEX_PX = 22;
const HIT_EDGE_PX = 15;
const VERTEX_RADIUS = 7;

const PropertyPlotter = forwardRef<PropertyPlotterRef, PropertyPlotterProps>(
  ({ onDataChange }, ref) => {
    const theme = useTheme();

    const [points, setPoints] = useState<PlotPoint[]>([]);
    const [distances, setDistances] = useState<PlotDistance[]>([]);
    const [isClosed, setIsClosed] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Distance dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogEdgeIndex, setDialogEdgeIndex] = useState<number | null>(null);
    const [dialogFeet, setDialogFeet] = useState("");
    const [dialogInches, setDialogInches] = useState("");

    // Delete-node dialog: index of point to delete, or null
    const [deletePointIndex, setDeletePointIndex] = useState<number | null>(
      null,
    );

    // Drag: long-press a vertex then drag to move it
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(
      null,
    );
    const [draggingPointPosition, setDraggingPointPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const draggingPointIndexRef = useRef<number | null>(null);
    const justFinishedDraggingRef = useRef(false);
    const pendingLoadDataRef = useRef<PlotterData | null>(null);
    const viewShotRef = useRef<ViewShot>(null);

    // Keep latest state in refs so gesture callbacks can read them without stale closures
    const pointsRef = useRef(points);
    const distancesRef = useRef(distances);
    const isClosedRef = useRef(isClosed);

    const syncAndNotify = useCallback(
      (
        nextPoints: PlotPoint[],
        nextDistances: PlotDistance[],
        nextClosed: boolean,
      ) => {
        pointsRef.current = nextPoints;
        distancesRef.current = nextDistances;
        isClosedRef.current = nextClosed;
        setPoints(nextPoints);
        setDistances(nextDistances);
        setIsClosed(nextClosed);
        onDataChange?.({
          points: nextPoints,
          distances: nextDistances,
          isClosed: nextClosed,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        });
      },
      [canvasSize, onDataChange],
    );

    useImperativeHandle(ref, () => ({
      clear() {
        syncAndNotify([], [], false);
      },
      getData(): PlotterData {
        return {
          points: pointsRef.current,
          distances: distancesRef.current,
          isClosed: isClosedRef.current,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        };
      },
      async capture() {
        return viewShotRef.current?.capture?.();
      },
      loadData(data: PlotterData) {
        const w = canvasSize.width;
        const h = canvasSize.height;
        if (!w || !h) {
          pendingLoadDataRef.current = data;
          return;
        }
        pendingLoadDataRef.current = null;
        const scaled = scalePoints(
          data.points,
          data.canvasWidth,
          data.canvasHeight,
          w,
          h,
        );
        syncAndNotify(scaled, data.distances ?? [], data.isClosed);
      },
    }));

    // When canvas gets dimensions after mount, apply any loadData that was called too early
    useEffect(() => {
      const data = pendingLoadDataRef.current;
      if (!data || !canvasSize.width || !canvasSize.height) return;
      pendingLoadDataRef.current = null;
      const scaled = scalePoints(
        data.points,
        data.canvasWidth,
        data.canvasHeight,
        canvasSize.width,
        canvasSize.height,
      );
      syncAndNotify(scaled, data.distances ?? [], data.isClosed);
    }, [canvasSize.width, canvasSize.height, syncAndNotify]);

    const tap = Gesture.Tap()
      .runOnJS(true)
      .onEnd((e) => {
        if (justFinishedDraggingRef.current) {
          justFinishedDraggingRef.current = false;
          return;
        }
        const tap: PlotPoint = { x: e.x, y: e.y };
        const pts = pointsRef.current;
        const closed = isClosedRef.current;

        const n = pts.length;

        if (closed) {
          // When closed: vertex tap = delete, edge tap = distance
          for (let i = 0; i < n; i++) {
            if (distanceToPoint(tap, pts[i]) < HIT_VERTEX_PX) {
              setDeletePointIndex(i);
              return;
            }
          }
          const edgeIdx = findNearestEdge(tap, pts, closed);
          if (edgeIdx !== null) openDistanceDialog(edgeIdx);
          return;
        }

        // When open: tap first point (p1) with 3+ points = close; any other point = delete
        for (let i = 0; i < n; i++) {
          if (distanceToPoint(tap, pts[i]) < HIT_VERTEX_PX) {
            if (i === 0 && n >= 3) {
              syncAndNotify(pts, distancesRef.current, true);
              return;
            }
            setDeletePointIndex(i);
            return;
          }
        }

        // Check if tap is near an existing edge
        const edgeIdx = findNearestEdge(tap, pts, false);
        if (edgeIdx !== null) {
          openDistanceDialog(edgeIdx);
          return;
        }

        // Add new point
        syncAndNotify([...pts, tap], distancesRef.current, false);
      });

    // ── Long-press + drag to move a vertex ──────────────────────────────────
    const longPress = Gesture.LongPress()
      .minDuration(400)
      .runOnJS(true)
      .onStart((e) => {
        const pt: PlotPoint = { x: e.x, y: e.y };
        const pts = pointsRef.current;
        for (let i = 0; i < pts.length; i++) {
          if (distanceToPoint(pt, pts[i]) < HIT_VERTEX_PX) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
            draggingPointIndexRef.current = i;
            setDraggingPointIndex(i);
            setDraggingPointPosition({ x: e.x, y: e.y });
            return;
          }
        }
      });

    const pan = Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onUpdate((e) => {
        if (draggingPointIndexRef.current === null) return;
        setDraggingPointPosition({ x: e.x, y: e.y });
      })
      .onEnd((e) => {
        const i = draggingPointIndexRef.current;
        if (i === null) return;
        justFinishedDraggingRef.current = true;
        const pts = [...pointsRef.current];
        pts[i] = { x: e.x, y: e.y };
        syncAndNotify(pts, distancesRef.current, isClosedRef.current);
        draggingPointIndexRef.current = null;
        setDraggingPointIndex(null);
        setDraggingPointPosition(null);
      });

    const composed = Gesture.Simultaneous(tap, longPress, pan);

    // ── Edge finding ───────────────────────────────────────────────────────

    function findNearestEdge(
      tap: PlotPoint,
      pts: PlotPoint[],
      includeClosure: boolean,
    ): number | null {
      const n = pts.length;
      const edgeCount = includeClosure ? n : n - 1;
      let bestIdx: number | null = null;
      let bestDist = HIT_EDGE_PX;
      for (let i = 0; i < edgeCount; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const d = distanceToSegment(tap, a, b);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    // ── Distance dialog ────────────────────────────────────────────────────

    function openDistanceDialog(edgeIndex: number) {
      const existing = distancesRef.current[edgeIndex];
      setDialogEdgeIndex(edgeIndex);
      setDialogFeet(existing?.feet ? String(existing.feet) : "");
      setDialogInches(existing?.inches ? String(existing.inches) : "");
      setDialogVisible(true);
    }

    function confirmDistance() {
      if (dialogEdgeIndex === null) return;
      const feet = parseInt(dialogFeet, 10) || 0;
      const inches = parseInt(dialogInches, 10) || 0;
      const updated = [...distancesRef.current];
      updated[dialogEdgeIndex] = { feet, inches };
      distancesRef.current = updated;
      setDistances(updated);
      onDataChange?.({
        points: pointsRef.current,
        distances: updated,
        isClosed: isClosedRef.current,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      });
      setDialogVisible(false);
      setDialogEdgeIndex(null);
    }

    function cancelDistance() {
      setDialogVisible(false);
      setDialogEdgeIndex(null);
    }

    function confirmDeletePoint() {
      const i = deletePointIndex;
      setDeletePointIndex(null);
      if (i == null || points.length <= 1) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const pts = pointsRef.current;
      const dists = distancesRef.current;
      const n = pts.length;
      const newPts = [...pts.slice(0, i), ...pts.slice(i + 1)];
      // Remove edges that involved point i; insert placeholder for the new gap edge
      const left = dists.slice(0, Math.max(0, i - 1));
      const right = dists.slice(i + 1, isClosedRef.current ? n : n - 1);
      const newDist = [...left, { feet: 0, inches: 0 }, ...right].slice(
        0,
        Math.max(0, newPts.length - 1),
      );
      syncAndNotify(newPts, newDist, false);
    }

    function cancelDeletePoint() {
      setDeletePointIndex(null);
    }

    function handleUndo() {
      if (points.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const newPts = points.slice(0, -1);
      const newDist = distances.slice(0, Math.max(0, newPts.length - 1));
      syncAndNotify(newPts, newDist, false);
    }

    const n = points.length;
    const edgeCount = isClosed ? n : n - 1;
    // When dragging, show the vertex at the drag position
    const displayPoints =
      draggingPointIndex !== null && draggingPointPosition
        ? points.map((p, i) =>
            i === draggingPointIndex ? draggingPointPosition : p,
          )
        : points;

    const primaryColor = "#2563eb";
    const primaryStroke = "#1e40af";
    const closableColor = "#16a34a";
    const closableStroke = "#15803d";
    const edgeColor = primaryColor;
    const selectedEdgeColor = "#dc2626";
    const labelBg = "rgba(255,255,255,0.9)";

    return (
      <View style={styles.wrapper}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
          style={styles.canvasWrapper}
        >
          <GestureDetector gesture={composed}>
            <View
              style={styles.canvasContainer}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setCanvasSize({ width, height });
              }}
            >
              <Svg
              width={canvasSize.width || "100%"}
              height={canvasSize.height || "100%"}
              style={styles.svg}
            >
              {/* Grid lines */}
              {canvasSize.width > 0 &&
                Array.from({
                  length: Math.floor(canvasSize.width / 40) + 1,
                }).map((_, i) => (
                  <Line
                    key={`gx-${i}`}
                    x1={i * 40}
                    y1={0}
                    x2={i * 40}
                    y2={canvasSize.height}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                ))}
              {canvasSize.height > 0 &&
                Array.from({
                  length: Math.floor(canvasSize.height / 40) + 1,
                }).map((_, i) => (
                  <Line
                    key={`gy-${i}`}
                    x1={0}
                    y1={i * 40}
                    x2={canvasSize.width}
                    y2={i * 40}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                ))}

              {/* Edges */}
              {Array.from({ length: edgeCount }).map((_, i) => {
                const a = displayPoints[i];
                const b = displayPoints[(i + 1) % n];
                const isSelected = i === dialogEdgeIndex;
                const label = formatDistance(distances[i]);
                const mid = midpoint(a, b);
                return (
                  <G key={`edge-${i}`}>
                    <Line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={isSelected ? selectedEdgeColor : edgeColor}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    {label.length > 0 && (
                      <G>
                        {/* Label background */}
                        <SvgText
                          x={mid.x}
                          y={mid.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight="600"
                          fill="transparent"
                          stroke={labelBg}
                          strokeWidth={6}
                          strokeLinejoin="round"
                        >
                          {label}
                        </SvgText>
                        {/* Label text */}
                        <SvgText
                          x={mid.x}
                          y={mid.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight="600"
                          fill={isSelected ? selectedEdgeColor : edgeColor}
                        >
                          {label}
                        </SvgText>
                      </G>
                    )}
                  </G>
                );
              })}

              {/* Vertices — visible on white: blue fill + dark stroke */}
              {displayPoints.map((pt, i) => {
                const isFirst = i === 0;
                const canClose = isFirst && n >= 3 && !isClosed;
                const fillColor = canClose ? closableColor : primaryColor;
                const strokeColor = canClose ? closableStroke : primaryStroke;
                const labelY = pt.y - VERTEX_RADIUS - 20;
                const labelW = 24;
                const labelH = 14;
                return (
                  <G key={`vertex-${i}`}>
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={canClose ? VERTEX_RADIUS + 3 : VERTEX_RADIUS}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={2}
                    />
                    {/* Label background so it doesn't overlap lines */}
                    <Rect
                      x={pt.x - labelW / 2}
                      y={labelY - labelH / 2}
                      width={labelW}
                      height={labelH}
                      rx={4}
                      fill="white"
                      stroke={strokeColor}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={pt.x}
                      y={labelY}
                      textAnchor="middle"
                      fontSize={9}
                      fill={strokeColor}
                      fontWeight="700"
                    >
                      {`p${i + 1}`}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
            </View>
          </GestureDetector>
        </ViewShot>

        {/* Hint text */}
        <SvgHint
          points={points}
          isClosed={isClosed}
          primaryColor={primaryColor}
        />

        <View style={styles.toolbar}>
          <Button
            mode="outlined"
            icon="undo"
            onPress={handleUndo}
            disabled={points.length === 0}
            compact
            textColor={theme.colors.tertiary}
            style={[styles.undoButton, { borderColor: theme.colors.outline }]}
          >
            Undo
          </Button>
        </View>

        {/* Distance dialog */}
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={cancelDistance}>
            <Dialog.Title>Set Edge Distance</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Feet"
                value={dialogFeet}
                onChangeText={setDialogFeet}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.dialogInput}
                right={<TextInput.Affix text="ft" />}
              />
              <TextInput
                label="Inches"
                value={dialogInches}
                onChangeText={setDialogInches}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.dialogInput}
                right={<TextInput.Affix text="in" />}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={cancelDistance}>Cancel</Button>
              <Button onPress={confirmDistance}>OK</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Delete point dialog */}
          <Dialog
            visible={deletePointIndex !== null}
            onDismiss={cancelDeletePoint}
          >
            <Dialog.Title>Delete point</Dialog.Title>
            <Dialog.Content>
              {deletePointIndex !== null && (
                <RNText style={{ color: theme.colors.onSurface }}>
                  Delete p{deletePointIndex + 1}? This will remove the point and
                  its connected edges.
                </RNText>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={cancelDeletePoint}>Cancel</Button>
              <Button
                onPress={confirmDeletePoint}
                textColor={theme.colors.error}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    );
  },
);

PropertyPlotter.displayName = "PropertyPlotter";
export default PropertyPlotter;

// ─── Hint sub-component ──────────────────────────────────────────────────────

function SvgHint({
  points,
  isClosed,
  primaryColor,
}: {
  points: PlotPoint[];
  isClosed: boolean;
  primaryColor: string;
}) {
  let hint = "Tap to place the first point";
  if (points.length === 1) hint = "Tap to place the next point";
  else if (points.length === 2)
    hint = "Continue tapping — tap first point to close";
  else if (points.length >= 3 && !isClosed)
    hint =
      "Tap p1 to close • long-press + drag to move a point • tap edge for distance";
  else if (isClosed)
    hint =
      "Long-press + drag to move a point • tap to delete • tap edge for distance • Undo to reopen";

  return (
    <Svg width="100%" height={20} style={styles.hintSvg}>
      <SvgText
        x="50%"
        textAnchor="middle"
        y={14}
        fontSize={10}
        fill={primaryColor}
        opacity={0.7}
      >
        {hint}
      </SvgText>
    </Svg>
  );
}

//* Scale helper (for resume editing at a different canvas size)

function scalePoints(
  pts: PlotPoint[],
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
): PlotPoint[] {
  if (!fromW || !fromH || !toW || !toH) return pts;
  const sx = toW / fromW;
  const sy = toH / fromH;
  return pts.map((p) => ({ x: p.x * sx, y: p.y * sy }));
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  canvasWrapper: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  svg: {
    flex: 1,
  },
  hintSvg: {
    marginTop: 2,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    marginTop: 8,
  },
  undoButton: {
    alignSelf: "flex-start",
  },
  dialogInput: {
    marginBottom: 8,
  },
});
