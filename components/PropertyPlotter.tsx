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
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";
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
  meters?: number;
  totalFt?: number;
}
export interface PlotTriangle {
  id: string;
  pointIndices: [number, number, number];
  sides: [PlotDistance | null, PlotDistance | null, PlotDistance | null];
}
export interface PlotterData {
  points: PlotPoint[];
  triangles: PlotTriangle[];
  canvasWidth: number;
  canvasHeight: number;
  distances?: PlotDistance[];
  isClosed?: boolean;
}
export type MeasureUnit = "imperial" | "metric";
export type TapMode = "select" | "delete";
export interface PlotterUIState {
  measureUnit: MeasureUnit;
  tapMode: TapMode;
  selectedCount: number;
  pointCount: number;
}
export interface PropertyPlotterRef {
  clear: () => void;
  getData: () => PlotterData;
  loadData: (data: PlotterData) => void;
  capture: () => Promise<string | undefined>;
  setMeasureUnit: (unit: MeasureUnit) => void;
  setTapMode: (mode: TapMode) => void;
  undo: () => void;
  deselectAll: () => void;
}
interface PropertyPlotterProps {
  onDataChange?: (data: PlotterData) => void;
  onUIStateChange?: (state: PlotterUIState) => void;
  initialData?: PlotterData | null;
}
const HIT_VERTEX_PX = 24;
const HIT_EDGE_PX = 18;
const HIT_CENTROID_PX = 20;
const VERTEX_RADIUS = 7;
const TRIANGLE_COLORS = [
  { fill: "rgba(37,99,235,0.12)", stroke: "#2563eb" },
  { fill: "rgba(22,163,74,0.12)", stroke: "#16a34a" },
  { fill: "rgba(217,119,6,0.12)", stroke: "#d97706" },
  { fill: "rgba(168,85,247,0.12)", stroke: "#a855f7" },
  { fill: "rgba(239,68,68,0.12)", stroke: "#ef4444" },
  { fill: "rgba(20,184,166,0.12)", stroke: "#14b8a6" },
];
const SELECTED_COLOR = "#f59e0b";
const VERTEX_COLOR = "#2563eb";
const VERTEX_STROKE = "#1e40af";
const LABEL_BG = "rgba(255,255,255,0.92)";
let _idCounter = 0;
function makeId() {
  return `tri_${Date.now()}_${++_idCounter}`;
}
function ptDist(a: PlotPoint, b: PlotPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function distToSegment(p: PlotPoint, a: PlotPoint, b: PlotPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return ptDist(p, a);
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq),
  );
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
function midpoint(a: PlotPoint, b: PlotPoint): PlotPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function centroid(a: PlotPoint, b: PlotPoint, c: PlotPoint): PlotPoint {
  return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
}
function formatDist(d: PlotDistance | null, unit: MeasureUnit): string {
  if (!d) return "";
  if (unit === "metric") {
    const m =
      d.meters ??
      (d.totalFt != null
        ? d.totalFt * 0.3048
        : (d.feet + d.inches / 12) * 0.3048);
    if (m <= 0) return "";
    if (m >= 1) {
      const cm = Math.round((m % 1) * 100);
      return cm > 0 ? `${Math.floor(m)}m ${cm}cm` : `${m.toFixed(2)}m`;
    }
    return `${Math.round(m * 100)}cm`;
  }
  const { feet, inches } = d;
  if (feet > 0 && inches > 0) return `${feet}′ ${inches}″`;
  if (feet > 0) return `${feet}′`;
  if (inches > 0) return `${inches}″`;
  return "";
}
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
function fanTriangulate(
  pts: PlotPoint[],
  oldDistances: PlotDistance[] = [],
): PlotTriangle[] {
  const n = pts.length;
  if (n < 3) return [];
  const result: PlotTriangle[] = [];
  for (let i = 1; i < n - 1; i++) {
    const side1: PlotDistance | null = oldDistances[i] ?? null;
    const side0: PlotDistance | null =
      i === 1 ? (oldDistances[0] ?? null) : null;
    result.push({
      id: makeId(),
      pointIndices: [0, i, i + 1],
      sides: [side0, side1, null],
    });
  }
  return result;
}
const PropertyPlotter = forwardRef<PropertyPlotterRef, PropertyPlotterProps>(
  ({ onDataChange, onUIStateChange, initialData }, ref) => {
    const theme = useTheme();
    const [measureUnit, setMeasureUnit] = useState<MeasureUnit>("imperial");
    const [tapMode, setTapMode] = useState<TapMode>("select");
    const [points, setPoints] = useState<PlotPoint[]>([]);
    const [triangles, setTriangles] = useState<PlotTriangle[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [distDialog, setDistDialog] = useState<{
      triId: string;
      sideIdx: 0 | 1 | 2;
      feet: string;
      inches: string;
      meters: string;
      centimeters: string;
    } | null>(null);
    const [deletePointIndex, setDeletePointIndex] = useState<number | null>(
      null,
    );
    const [deleteTriId, setDeleteTriId] = useState<string | null>(null);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [draggingPos, setDraggingPos] = useState<PlotPoint | null>(null);
    const draggingIdxRef = useRef<number | null>(null);
    const justFinishedDraggingRef = useRef(false);
    const pendingLoadRef = useRef<PlotterData | null>(initialData ?? null);
    const viewShotRef = useRef<ViewShot>(null);
    const pointsRef = useRef(points);
    const trianglesRef = useRef(triangles);
    const selectedRef = useRef(selectedIndices);
    const tapModeRef = useRef<TapMode>("select");
    const measureUnitRef = useRef<MeasureUnit>("imperial");
    const syncAndNotify = useCallback(
      (
        nextPts: PlotPoint[],
        nextTris: PlotTriangle[],
        nextSel: number[] = [],
      ) => {
        pointsRef.current = nextPts;
        trianglesRef.current = nextTris;
        selectedRef.current = nextSel;
        setPoints(nextPts);
        setTriangles(nextTris);
        setSelectedIndices(nextSel);
        onDataChange?.({
          points: nextPts,
          triangles: nextTris,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        });
      },
      [canvasSize, onDataChange],
    );
    useEffect(() => {
      tapModeRef.current = tapMode;
    }, [tapMode]);
    useEffect(() => {
      measureUnitRef.current = measureUnit;
    }, [measureUnit]);
    const onUIStateChangeRef = useRef(onUIStateChange);
    useEffect(() => {
      onUIStateChangeRef.current = onUIStateChange;
    }, [onUIStateChange]);
    useEffect(() => {
      onUIStateChangeRef.current?.({
        measureUnit,
        tapMode,
        selectedCount: selectedIndices.length,
        pointCount: points.length,
      });
    }, [measureUnit, tapMode, selectedIndices.length, points.length]);
    useImperativeHandle(ref, () => ({
      clear() {
        syncAndNotify([], [], []);
      },
      getData(): PlotterData {
        return {
          points: pointsRef.current,
          triangles: trianglesRef.current,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        };
      },
      async capture() {
        return viewShotRef.current?.capture?.();
      },
      loadData(data: PlotterData) {
        const { width: w, height: h } = canvasSize;
        if (!w || !h) {
          pendingLoadRef.current = data;
          return;
        }
        applyLoad(data, w, h);
      },
      setMeasureUnit(unit: MeasureUnit) {
        setMeasureUnit(unit);
      },
      setTapMode(mode: TapMode) {
        setTapMode(mode);
      },
      undo() {
        const pts = pointsRef.current;
        if (pts.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        const lastIdx = pts.length - 1;
        const newPts = pts.slice(0, -1);
        const newTris = trianglesRef.current
          .filter((t) => !t.pointIndices.includes(lastIdx))
          .map((t) => ({
            ...t,
            pointIndices: t.pointIndices.map((pi) =>
              pi > lastIdx ? pi - 1 : pi,
            ) as [number, number, number],
          }));
        const newSel = selectedRef.current.filter((s) => s !== lastIdx);
        syncAndNotify(newPts, newTris, newSel);
      },
      deselectAll() {
        syncAndNotify(pointsRef.current, trianglesRef.current, []);
      },
    }));
    function applyLoad(data: PlotterData, w: number, h: number) {
      pendingLoadRef.current = null;
      const scaled = scalePoints(
        data.points,
        data.canvasWidth || w,
        data.canvasHeight || h,
        w,
        h,
      );
      let tris = data.triangles ?? [];
      if (tris.length === 0 && data.isClosed && scaled.length >= 3) {
        tris = fanTriangulate(scaled, data.distances ?? []);
      }
      syncAndNotify(scaled, tris, []);
    }
    useEffect(() => {
      const data = pendingLoadRef.current;
      if (!data || !canvasSize.width || !canvasSize.height) return;
      applyLoad(data, canvasSize.width, canvasSize.height);
    }, [canvasSize.width, canvasSize.height]);
    const tap = Gesture.Tap()
      .runOnJS(true)
      .onEnd((e) => {
        if (justFinishedDraggingRef.current) {
          justFinishedDraggingRef.current = false;
          return;
        }
        const tapPt: PlotPoint = { x: e.x, y: e.y };
        const pts = pointsRef.current;
        const tris = trianglesRef.current;
        const sel = selectedRef.current;
        for (let i = 0; i < pts.length; i++) {
          if (ptDist(tapPt, pts[i]) < HIT_VERTEX_PX) {
            if (tapModeRef.current === "delete") {
              setDeletePointIndex(i);
            } else {
              const already = sel.includes(i);
              const newSel = already ? sel.filter((s) => s !== i) : [...sel, i];
              syncAndNotify(pts, tris, newSel);
              Haptics.selectionAsync().catch(() => {});
            }
            return;
          }
        }
        if (sel.length === 0) {
          for (const tri of tris) {
            const [ai, bi, ci] = tri.pointIndices;
            if (ai >= pts.length || bi >= pts.length || ci >= pts.length)
              continue;
            const c = centroid(pts[ai], pts[bi], pts[ci]);
            if (ptDist(tapPt, { x: c.x - 18, y: c.y - 8 }) < HIT_CENTROID_PX) {
              setDeleteTriId(tri.id);
              return;
            }
          }
        }
        for (const tri of tris) {
          const [ai, bi, ci] = tri.pointIndices;
          if (ai >= pts.length || bi >= pts.length || ci >= pts.length)
            continue;
          const verts = [pts[ai], pts[bi], pts[ci]];
          for (let s = 0; s < 3; s++) {
            const a = verts[s];
            const b = verts[(s + 1) % 3];
            if (distToSegment(tapPt, a, b) < HIT_EDGE_PX) {
              const existing = tri.sides[s as 0 | 1 | 2];
              let dialogFeet = "";
              let dialogInches = "";
              let dialogMeters = "";
              let dialogCentimeters = "";
              if (existing) {
                if (measureUnitRef.current === "metric") {
                  const totalMeters =
                    existing.meters ??
                    (existing.totalFt != null
                      ? existing.totalFt * 0.3048
                      : (existing.feet + existing.inches / 12) * 0.3048);
                  if (totalMeters > 0) {
                    dialogMeters = String(Math.floor(totalMeters));
                    dialogCentimeters = String(
                      Math.round((totalMeters % 1) * 100),
                    );
                  }
                } else {
                  const totalFt =
                    existing.totalFt ??
                    (existing.meters != null
                      ? existing.meters / 0.3048
                      : existing.feet + existing.inches / 12);
                  if (totalFt > 0) {
                    let feet = Math.floor(totalFt);
                    let inches = Math.round((totalFt - feet) * 12);
                    if (inches >= 12) {
                      feet += Math.floor(inches / 12);
                      inches = inches % 12;
                    }
                    dialogFeet = String(feet);
                    dialogInches = String(inches);
                  }
                }
              }
              setDistDialog({
                triId: tri.id,
                sideIdx: s as 0 | 1 | 2,
                feet: dialogFeet,
                inches: dialogInches,
                meters: dialogMeters,
                centimeters: dialogCentimeters,
              });
              return;
            }
          }
        }
        if (tapModeRef.current === "select") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          syncAndNotify([...pts, tapPt], tris, sel);
        }
      });
    const longPress = Gesture.LongPress()
      .minDuration(400)
      .runOnJS(true)
      .onStart((e) => {
        const pt: PlotPoint = { x: e.x, y: e.y };
        const pts = pointsRef.current;
        for (let i = 0; i < pts.length; i++) {
          if (ptDist(pt, pts[i]) < HIT_VERTEX_PX) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
              () => {},
            );
            draggingIdxRef.current = i;
            setDraggingIdx(i);
            setDraggingPos({ x: e.x, y: e.y });
            return;
          }
        }
      });
    const pan = Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onUpdate((e) => {
        if (draggingIdxRef.current === null) return;
        setDraggingPos({ x: e.x, y: e.y });
      })
      .onEnd((e) => {
        const i = draggingIdxRef.current;
        if (i === null) return;
        const origin = pointsRef.current[i] ?? { x: 0, y: 0 };
        const movedEnough = ptDist({ x: e.x, y: e.y }, origin) > 6;
        if (movedEnough) {
          justFinishedDraggingRef.current = true;
          const pts = [...pointsRef.current];
          pts[i] = { x: e.x, y: e.y };
          syncAndNotify(pts, trianglesRef.current, selectedRef.current);
        } else {
          setDeletePointIndex(i);
        }
        draggingIdxRef.current = null;
        setDraggingIdx(null);
        setDraggingPos(null);
      });
    const composed = Gesture.Simultaneous(tap, longPress, pan);
    function handleCreateTriangle() {
      const sel = selectedRef.current;
      if (sel.length !== 3) return;
      const [a, b, c] = sel as [number, number, number];
      const newEdges: [number, number][] = [
        [a, b],
        [b, c],
        [c, a],
      ];
      const sides: PlotTriangle["sides"] = [null, null, null];
      for (const existing of trianglesRef.current) {
        const [ea, eb, ec] = existing.pointIndices;
        const exEdges: [number, number][] = [
          [ea, eb],
          [eb, ec],
          [ec, ea],
        ];
        for (let es = 0; es < 3; es++) {
          if (existing.sides[es as 0 | 1 | 2] == null) continue;
          const [ep, eq] = exEdges[es];
          for (let ns = 0; ns < 3; ns++) {
            const [np, nq] = newEdges[ns];
            if ((ep === np && eq === nq) || (ep === nq && eq === np)) {
              sides[ns as 0 | 1 | 2] = existing.sides[es as 0 | 1 | 2];
            }
          }
        }
      }
      const newTri: PlotTriangle = {
        id: makeId(),
        pointIndices: [a, b, c],
        sides,
      };
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      syncAndNotify(pointsRef.current, [...trianglesRef.current, newTri], []);
    }
    function confirmDistance() {
      if (!distDialog) return;
      let dist: PlotDistance;
      if (measureUnitRef.current === "metric") {
        const m = parseFloat(distDialog.meters) || 0;
        const cm = parseFloat(distDialog.centimeters) || 0;
        const totalMeters = m + cm / 100;
        const totalFt = totalMeters / 0.3048;
        dist = { feet: 0, inches: 0, meters: totalMeters, totalFt };
      } else {
        const feet = parseInt(distDialog.feet, 10) || 0;
        const inches = parseInt(distDialog.inches, 10) || 0;
        const totalFt = feet + inches / 12;
        dist = { feet, inches, totalFt };
      }
      const sourceTri = trianglesRef.current.find(
        (t) => t.id === distDialog.triId,
      );
      const [pA, pB, pC] = sourceTri?.pointIndices ?? [0, 0, 0];
      const srcEdges: [number, number][] = [
        [pA, pB],
        [pB, pC],
        [pC, pA],
      ];
      const [edgeP, edgeQ] = srcEdges[distDialog.sideIdx];
      const updated = trianglesRef.current.map((t) => {
        if (t.id === distDialog.triId) {
          const newSides = [...t.sides] as PlotTriangle["sides"];
          newSides[distDialog.sideIdx] = dist;
          return { ...t, sides: newSides };
        }
        const [a, b, c] = t.pointIndices;
        const edges: [number, number][] = [
          [a, b],
          [b, c],
          [c, a],
        ];
        for (let s = 0; s < 3; s++) {
          const [ep, eq] = edges[s];
          if (
            (ep === edgeP && eq === edgeQ) ||
            (ep === edgeQ && eq === edgeP)
          ) {
            const newSides = [...t.sides] as PlotTriangle["sides"];
            newSides[s as 0 | 1 | 2] = dist;
            return { ...t, sides: newSides };
          }
        }
        return t;
      });
      syncAndNotify(pointsRef.current, updated, selectedRef.current);
      setDistDialog(null);
    }
    function confirmDeletePoint() {
      const i = deletePointIndex;
      setDeletePointIndex(null);
      if (i == null) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const pts = pointsRef.current;
      const newPts = [...pts.slice(0, i), ...pts.slice(i + 1)];
      const newTris = trianglesRef.current
        .filter((t) => !t.pointIndices.includes(i))
        .map((t) => ({
          ...t,
          pointIndices: t.pointIndices.map((pi) => (pi > i ? pi - 1 : pi)) as [
            number,
            number,
            number,
          ],
        }));
      const newSel = selectedRef.current
        .filter((s) => s !== i)
        .map((s) => (s > i ? s - 1 : s));
      syncAndNotify(newPts, newTris, newSel);
    }
    function confirmDeleteTriangle() {
      const id = deleteTriId;
      setDeleteTriId(null);
      if (!id) return;
      syncAndNotify(
        pointsRef.current,
        trianglesRef.current.filter((t) => t.id !== id),
        selectedRef.current,
      );
    }
    function handleUndo() {
      const pts = pointsRef.current;
      if (pts.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const lastIdx = pts.length - 1;
      const newPts = pts.slice(0, -1);
      const newTris = trianglesRef.current
        .filter((t) => !t.pointIndices.includes(lastIdx))
        .map((t) => ({
          ...t,
          pointIndices: t.pointIndices.map((pi) =>
            pi > lastIdx ? pi - 1 : pi,
          ) as [number, number, number],
        }));
      const newSel = selectedRef.current.filter((s) => s !== lastIdx);
      syncAndNotify(newPts, newTris, newSel);
    }
    const n = points.length;
    const displayPoints =
      draggingIdx !== null && draggingPos
        ? points.map((p, i) => (i === draggingIdx ? draggingPos : p))
        : points;
    const showCreateButton = selectedIndices.length === 3;
    return (
      <View style={styles.wrapper}>
        {showCreateButton && (
          <View style={styles.createTriangleBanner}>
            <Button
              mode="contained"
              icon="triangle-outline"
              onPress={handleCreateTriangle}
              style={styles.createTriangleBtn}
              buttonColor="#2563eb"
            >
              {`Create Triangle (p${selectedIndices[0] + 1}, p${selectedIndices[1] + 1}, p${selectedIndices[2] + 1})`}
            </Button>
            <Button
              mode="text"
              onPress={() =>
                syncAndNotify(pointsRef.current, trianglesRef.current, [])
              }
              textColor={theme.colors.error}
              compact
            >
              Cancel
            </Button>
          </View>
        )}

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

                {triangles.map((tri, tIdx) => {
                  const [ai, bi, ci] = tri.pointIndices;
                  if (ai >= n || bi >= n || ci >= n) return null;
                  const pa = displayPoints[ai];
                  const pb = displayPoints[bi];
                  const pc = displayPoints[ci];
                  const color = TRIANGLE_COLORS[tIdx % TRIANGLE_COLORS.length];
                  return (
                    <Polygon
                      key={`tri-fill-${tri.id}`}
                      points={`${pa.x},${pa.y} ${pb.x},${pb.y} ${pc.x},${pc.y}`}
                      fill={color.fill}
                      stroke="none"
                    />
                  );
                })}

                {triangles.map((tri, tIdx) => {
                  const [ai, bi, ci] = tri.pointIndices;
                  if (ai >= n || bi >= n || ci >= n) return null;
                  const verts = [
                    displayPoints[ai],
                    displayPoints[bi],
                    displayPoints[ci],
                  ];
                  const color = TRIANGLE_COLORS[tIdx % TRIANGLE_COLORS.length];
                  const cen = centroid(verts[0], verts[1], verts[2]);
                  return (
                    <G key={`tri-${tri.id}`}>
                      {([0, 1, 2] as const).map((s) => {
                        const a = verts[s];
                        const b = verts[(s + 1) % 3];
                        const label = formatDist(tri.sides[s], measureUnit);
                        const mid = midpoint(a, b);
                        const isActive =
                          distDialog?.triId === tri.id &&
                          distDialog?.sideIdx === s;
                        const stroke = isActive ? "#dc2626" : color.stroke;
                        return (
                          <G key={`s${s}`}>
                            <Line
                              x1={a.x}
                              y1={a.y}
                              x2={b.x}
                              y2={b.y}
                              stroke={stroke}
                              strokeWidth={isActive ? 3 : 2}
                            />
                            {label.length > 0 ? (
                              <G>
                                <SvgText
                                  x={mid.x}
                                  y={mid.y + 4}
                                  textAnchor="middle"
                                  fontSize={10}
                                  fontWeight="600"
                                  fill="transparent"
                                  stroke={LABEL_BG}
                                  strokeWidth={6}
                                  strokeLinejoin="round"
                                >
                                  {label}
                                </SvgText>
                                <SvgText
                                  x={mid.x}
                                  y={mid.y + 4}
                                  textAnchor="middle"
                                  fontSize={10}
                                  fontWeight="600"
                                  fill={stroke}
                                >
                                  {label}
                                </SvgText>
                              </G>
                            ) : (
                              <Circle
                                cx={mid.x}
                                cy={mid.y}
                                r={3}
                                fill={color.stroke}
                                opacity={0.35}
                              />
                            )}
                          </G>
                        );
                      })}

                      <G>
                        <Rect
                          x={cen.x - 14}
                          y={cen.y - 10}
                          width={22}
                          height={18}
                          rx={4}
                          fill="rgba(255,255,255,0.88)"
                          stroke={color.stroke}
                          strokeWidth={1}
                        />
                        <SvgText
                          x={cen.x - 3}
                          y={cen.y + 1}
                          fontSize={13}
                          fill={color.stroke}
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          ×
                        </SvgText>
                      </G>
                    </G>
                  );
                })}

                {displayPoints.map((pt, i) => {
                  const isSelected = selectedIndices.includes(i);
                  const selOrder = isSelected
                    ? selectedIndices.indexOf(i) + 1
                    : null;
                  const labelY = pt.y - VERTEX_RADIUS - 14;
                  const labelW = 28;
                  const labelH = 14;
                  return (
                    <G key={`vertex-${i}`}>
                      {isSelected && (
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r={VERTEX_RADIUS + 7}
                          fill={`${SELECTED_COLOR}33`}
                          stroke={SELECTED_COLOR}
                          strokeWidth={2}
                        />
                      )}
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={VERTEX_RADIUS}
                        fill={isSelected ? SELECTED_COLOR : VERTEX_COLOR}
                        stroke={isSelected ? "#b45309" : VERTEX_STROKE}
                        strokeWidth={2}
                      />
                      <Rect
                        x={pt.x - labelW / 2}
                        y={labelY - labelH / 2}
                        width={labelW}
                        height={labelH}
                        rx={4}
                        fill="white"
                        stroke={isSelected ? "#b45309" : VERTEX_STROKE}
                        strokeWidth={1}
                      />
                      <SvgText
                        x={pt.x}
                        y={labelY}
                        textAnchor="middle"
                        fontSize={9}
                        fill={isSelected ? "#b45309" : VERTEX_STROKE}
                        fontWeight="700"
                      >
                        {`p${i + 1}`}
                      </SvgText>
                      {isSelected && selOrder !== null && (
                        <SvgText
                          x={pt.x + VERTEX_RADIUS + 4}
                          y={pt.y - VERTEX_RADIUS}
                          fontSize={9}
                          fill={SELECTED_COLOR}
                          fontWeight="800"
                        >
                          {selOrder}
                        </SvgText>
                      )}
                    </G>
                  );
                })}
              </Svg>
            </View>
          </GestureDetector>
        </ViewShot>

        <PlotterHint
          pointCount={n}
          triangleCount={triangles.length}
          selectedCount={selectedIndices.length}
          primaryColor={VERTEX_COLOR}
        />

        <Portal>
          <Dialog visible={!!distDialog} onDismiss={() => setDistDialog(null)}>
            <Dialog.Title>
              {measureUnit === "metric"
                ? "Set Side Distance (m/cm)"
                : "Set Side Distance (ft/in)"}
            </Dialog.Title>
            <Dialog.Content>
              {measureUnit === "metric" ? (
                <>
                  <TextInput
                    label="Meters"
                    value={distDialog?.meters ?? ""}
                    onChangeText={(v) =>
                      setDistDialog((d) => (d ? { ...d, meters: v } : d))
                    }
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.dialogInput}
                    right={<TextInput.Affix text="m" />}
                  />
                  <TextInput
                    label="Centimeters"
                    value={distDialog?.centimeters ?? ""}
                    onChangeText={(v) =>
                      setDistDialog((d) => (d ? { ...d, centimeters: v } : d))
                    }
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.dialogInput}
                    right={<TextInput.Affix text="cm" />}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    label="Feet"
                    value={distDialog?.feet ?? ""}
                    onChangeText={(v) =>
                      setDistDialog((d) => (d ? { ...d, feet: v } : d))
                    }
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.dialogInput}
                    right={<TextInput.Affix text="ft" />}
                  />
                  <TextInput
                    label="Inches"
                    value={distDialog?.inches ?? ""}
                    onChangeText={(v) =>
                      setDistDialog((d) => (d ? { ...d, inches: v } : d))
                    }
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.dialogInput}
                    right={<TextInput.Affix text="in" />}
                  />
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDistDialog(null)}>Cancel</Button>
              <Button onPress={confirmDistance}>OK</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog
            visible={deletePointIndex !== null}
            onDismiss={() => setDeletePointIndex(null)}
          >
            <Dialog.Title>Delete point</Dialog.Title>
            <Dialog.Content>
              {deletePointIndex !== null && (
                <RNText style={{ color: theme.colors.onSurface }}>
                  Delete p{deletePointIndex + 1}? Any triangles using this point
                  will also be removed.
                </RNText>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeletePointIndex(null)}>Cancel</Button>
              <Button
                onPress={confirmDeletePoint}
                textColor={theme.colors.error}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog
            visible={!!deleteTriId}
            onDismiss={() => setDeleteTriId(null)}
          >
            <Dialog.Title>Delete triangle?</Dialog.Title>
            <Dialog.Content>
              <RNText style={{ color: theme.colors.onSurface }}>
                This will remove the triangle and its measurements. Points will
                remain.
              </RNText>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteTriId(null)}>Cancel</Button>
              <Button
                onPress={confirmDeleteTriangle}
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
function PlotterHint({
  pointCount,
  triangleCount,
  selectedCount,
  primaryColor,
}: {
  pointCount: number;
  triangleCount: number;
  selectedCount: number;
  primaryColor: string;
}) {
  let hint = "Tap to place points on the canvas";
  if (pointCount > 0 && selectedCount === 0 && triangleCount === 0)
    hint =
      "Tap a point to select • select 3 to create a triangle • long-press to move/delete";
  else if (selectedCount === 1)
    hint = "Select 2 more points to form a triangle";
  else if (selectedCount === 2) hint = "Select 1 more point to form a triangle";
  else if (selectedCount >= 3) hint = "Tap 'Create Triangle' above to confirm";
  else if (triangleCount > 0) hint = "";
  return (
    <Svg width="100%" height={18} style={styles.hintSvg}>
      <SvgText
        x="50%"
        textAnchor="middle"
        y={13}
        fontSize={10}
        fill={primaryColor}
        opacity={0.7}
      >
        {hint}
      </SvgText>
    </Svg>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  createTriangleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  createTriangleBtn: {
    flex: 1,
  },
  canvasWrapper: {
    flex: 1,
    minHeight: 380,
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
    gap: 8,
    minHeight: 48,
    marginTop: 6,
  },
  toolbarBtn: {
    alignSelf: "flex-start",
  },
  dialogInput: {
    marginBottom: 8,
  },
});
