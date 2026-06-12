import React from "react";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Camera,
  CameraRef,
  CircleLayer,
  LineLayer,
  MapView,
  MapViewRef,
  ShapeSource,
  SymbolLayer,
} from "@maplibre/maplibre-react-native";
import type { PropertyEvaluationData } from "../../../lib/property-evaluation-api";
import { EMPTY_GEOJSON, NEPAL_BOUNDS } from "./constants";
import { step0Styles as styles } from "./styles";

interface LocationMapProps {
  mapRef: React.RefObject<MapViewRef | null>;
  cameraRef: React.RefObject<CameraRef | null>;
  mapStyleUrl: string;
  initialCameraSettings: {
    zoomLevel: number;
    centerCoordinate: number[];
  };
  evalPointsGeoJSON: GeoJSON.FeatureCollection;
  waterGeoJSON: GeoJSON.FeatureCollection | null;
  transmissionGeoJSON: GeoJSON.FeatureCollection | null;
  evalData: PropertyEvaluationData | null;
  isLoadingEval: boolean;
  isMapMoving: boolean;
  hasValidCoordinates: boolean;
  onMapPress: (feature: GeoJSON.Feature) => void;
  onRegionDidChange: (
    feature: GeoJSON.Feature<GeoJSON.Point, { isUserInteraction?: boolean }>,
  ) => void;
}

function MapLegend() {
  return (
    <View style={styles.mapLegendOverlay}>
      <View style={styles.legendItem}>
        <MaterialCommunityIcons name="map-marker" size={13} color="#d32f2f" />
        <Text variant="labelSmall" style={styles.legendText}>
          Selected
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: "#6A1B9A" }]} />
        <Text variant="labelSmall" style={styles.legendText}>
          Heritage
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: "#1565C0" }]} />
        <Text variant="labelSmall" style={styles.legendText}>
          Flood
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: "#c62828" }]} />
        <Text variant="labelSmall" style={styles.legendText}>
          Landslide
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendLine, { backgroundColor: "#1565C0" }]} />
        <Text variant="labelSmall" style={styles.legendText}>
          Water
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendLine, { backgroundColor: "#E65100" }]} />
        <Text variant="labelSmall" style={styles.legendText}>
          Power
        </Text>
      </View>
    </View>
  );
}

export function LocationMap({
  mapRef,
  cameraRef,
  mapStyleUrl,
  initialCameraSettings,
  evalPointsGeoJSON,
  waterGeoJSON,
  transmissionGeoJSON,
  evalData,
  isLoadingEval,
  isMapMoving,
  hasValidCoordinates,
  onMapPress,
  onRegionDidChange,
}: LocationMapProps) {
  const hasEvalPoints = evalPointsGeoJSON.features.length > 0;

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        mapStyle={mapStyleUrl}
        logoEnabled={false}
        attributionEnabled={true}
        compassViewMargins={{ x: 23, y: 16 }}
        regionDidChangeDebounceTime={100}
        onPress={onMapPress}
        onRegionDidChange={onRegionDidChange}
        style={styles.mapView}
      >
        <Camera
          ref={cameraRef}
          maxBounds={NEPAL_BOUNDS}
          defaultSettings={initialCameraSettings}
        />

        <ShapeSource id="eval-points-source" shape={evalPointsGeoJSON}>
          <CircleLayer
            id="heritage-circles"
            filter={["==", ["get", "kind"], "heritage"]}
            style={{
              circleRadius: 10,
              circleColor: "#6A1B9A",
              circleStrokeColor: "#ffffff",
              circleStrokeWidth: 2,
              circleOpacity: hasEvalPoints ? 1 : 0,
            }}
          />
          <CircleLayer
            id="flood-circles"
            filter={["==", ["get", "kind"], "flood"]}
            style={{
              circleRadius: 8,
              circleColor: "#1565C0",
              circleStrokeColor: "#ffffff",
              circleStrokeWidth: 2,
              circleOpacity: hasEvalPoints ? 1 : 0,
            }}
          />
          <CircleLayer
            id="landslide-circles"
            filter={["==", ["get", "kind"], "landslide"]}
            style={{
              circleRadius: 8,
              circleColor: "#c62828",
              circleStrokeColor: "#ffffff",
              circleStrokeWidth: 2,
              circleOpacity: hasEvalPoints ? 1 : 0,
            }}
          />
          <SymbolLayer
            id="eval-point-labels"
            style={{
              textField: ["get", "label"],
              textSize: 11,
              textColor: "#ffffff",
              textHaloColor: "rgba(0,0,0,0.75)",
              textHaloWidth: 1.5,
              textOffset: [0, -2.2],
              textAnchor: "bottom",
              textFont: ["Open Sans Bold", "Arial Unicode MS Bold"],
              textAllowOverlap: true,
              textOpacity: hasEvalPoints ? 1 : 0,
            }}
          />
        </ShapeSource>

        <ShapeSource id="water-source" shape={waterGeoJSON ?? EMPTY_GEOJSON}>
          <LineLayer
            id="water-line"
            style={{
              lineColor: "#1565C0",
              lineWidth: 3,
              lineOpacity: waterGeoJSON ? 0.8 : 0,
            }}
          />
        </ShapeSource>

        <ShapeSource
          id="transmission-source"
          shape={transmissionGeoJSON ?? EMPTY_GEOJSON}
        >
          <LineLayer
            id="transmission-line"
            style={{
              lineColor: "#E65100",
              lineWidth: 2.5,
              lineOpacity: transmissionGeoJSON ? 0.8 : 0,
              lineDasharray: [4, 2],
            }}
          />
        </ShapeSource>
      </MapView>

      <View pointerEvents="none" style={styles.centerPinOverlay}>
        <MaterialCommunityIcons name="map-marker" size={44} color="#d32f2f" />
      </View>

      {(isLoadingEval || isMapMoving) && hasValidCoordinates && (
        <View style={styles.mapLoadingOverlay}>
          <View style={styles.mapLoadingPill}>
            <ActivityIndicator size={14} color="#ffffff" />
            <Text style={styles.mapLoadingText}>
              {isMapMoving ? "Locating..." : "Fetching data..."}
            </Text>
          </View>
        </View>
      )}

      {evalData && <MapLegend />}
    </View>
  );
}
