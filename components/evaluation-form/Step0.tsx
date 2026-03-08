import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  Keyboard,
  Linking,
} from "react-native";
import {
  Searchbar,
  Button,
  List,
  Surface,
  useTheme,
  Text,
  ActivityIndicator,
  Divider,
  Chip,
} from "react-native-paper";
import { useFormContext } from "react-hook-form";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { ValuationFormValues } from "../../constants/form-schema";
import {
  MapView,
  MapViewRef,
  Camera,
  CameraRef,
  MarkerView,
  ShapeSource,
  LineLayer,
  CircleLayer,
  SymbolLayer,
} from "@maplibre/maplibre-react-native";

import {
  fetchPropertyEvaluation,
  parseLineGeometry,
  type PropertyEvaluationData,
} from "../../lib/property-evaluation-api";

const GALLI_API_BASE = "https://route-init.gallimap.com/api/v1";
const NEPAL_CENTER_LAT = 27.7;
const NEPAL_CENTER_LNG = 85.3;
// Default view: Kathmandu city level (not full-Nepal bounding box)
const KATHMANDU_LAT = 27.7172;
const KATHMANDU_LNG = 85.324;
const DEFAULT_ZOOM = 13;
const ZOOM_WHEN_PINNED = 14;

// Always-present empty GeoJSON prevents native ShapeSource from crashing
// when layers are conditionally mounted/unmounted on the MapLibre bridge.
const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function getGalliAccessToken(): string {
  return (
    process.env.EXPO_PUBLIC_GALLI_MAPS_API_KEY ??
    process.env.GALLI_MAPS_API_KEY ??
    ""
  );
}

// Same as old working code: use Galli style for all platforms when token is set.
// When token is missing, fallback so the map still loads (e.g. in dev without .env).
const FALLBACK_MAP_STYLE =
  "https://demotiles.maplibre.org/styles/osm-bright-gl-style/style.json";

function getMapStyleUrl(): string {
  const token = getGalliAccessToken();
  if (token) {
    return `https://map-init.gallimap.com/styles/light/style.json?accessToken=${token}`;
  }
  return FALLBACK_MAP_STYLE;
}

interface SearchResultItem {
  name: string;
  province: string;
  district: string;
  municipality: string;
  ward: string;
  distance: string;
  geometry: string;
  nameLower: string;
  id: string;
  lat?: string;
  lon?: string;
}

interface GalliSearchFeature {
  type: "Feature";
  properties: {
    searchedItem: string;
    province: string;
    district: string;
    municipality: string;
    ward: string;
    distance: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

const NEPAL_BOUNDS = {
  sw: [80.0, 26.3] as [number, number],
  ne: [88.2, 30.4] as [number, number],
};

interface GalliReverseData {
  generalName?: string;
  roadName?: string;
  place?: string;
  municipality?: string;
  ward?: string;
  district?: string;
  province?: string;
}

// ── GeoJSON helpers for map overlays ────────────────────────────────────

function makeLineGeoJSON(
  coords: number[][] | null,
): GeoJSON.FeatureCollection | null {
  if (!coords || coords.length < 2) return null;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      },
    ],
  };
}

/** Build a point FeatureCollection from eval data for heritage + disaster markers. */
function makeEvalPointsGeoJSON(
  data: PropertyEvaluationData | null,
): GeoJSON.FeatureCollection {
  if (!data) return EMPTY_GEOJSON;

  const features: GeoJSON.Feature[] = [];

  if (data.heritage?.geometry) {
    features.push({
      type: "Feature",
      properties: { kind: "heritage", label: data.heritage.name ?? "Heritage" },
      geometry: { type: "Point", coordinates: data.heritage.geometry },
    });
  }

  if (data.disasters) {
    for (const d of data.disasters) {
      if (d.geometry) {
        const kind = d.disastertype === "Flood" ? "flood" : "landslide";
        features.push({
          type: "Feature",
          properties: {
            kind,
            label: d.disastertype,
          },
          geometry: { type: "Point", coordinates: d.geometry },
        });
      }
    }
  }

  return { type: "FeatureCollection", features };
}

// ── Threshold for auto-populating risk fields (km) ──────────────────────
const RISK_DISTANCE_THRESHOLD_KM = 2;

const EVAL_DEBOUNCE_MS = 500;

// ── Component ───────────────────────────────────────────────────────────

const Step0 = () => {
  const theme = useTheme();
  const { setValue, watch } = useFormContext<ValuationFormValues>();

  const currentLatitude = watch("latitude");
  const currentLongitude = watch("longitude");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isResolvingCoordinates, setIsResolvingCoordinates] = useState(false);
  const [reverseAddress, setReverseAddress] = useState<string | null>(null);

  const [evalData, setEvalData] = useState<PropertyEvaluationData | null>(null);
  const [isLoadingEval, setIsLoadingEval] = useState(false);

  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  // Prevent re-flying every time coordinates change after a tap
  const hasFlewToInitialPin = useRef(false);
  const handleLocationSelect = useCallback(
    (latitude: number, longitude: number) => {
      setValue("latitude", latitude, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("longitude", longitude, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue],
  );

  const flyToCoordinate = useCallback(
    (latitude: number, longitude: number, zoom?: number) => {
      if (zoom != null) {
        cameraRef.current?.setCamera?.({
          centerCoordinate: [longitude, latitude],
          zoomLevel: zoom,
          animationDuration: 500,
        });
      } else {
        cameraRef.current?.flyTo?.([longitude, latitude], 500);
      }
    },
    [],
  );

  const handleMapPress = useCallback(
    (feature: GeoJSON.Feature) => {
      const geom = feature?.geometry;
      if (geom?.type === "Point" && Array.isArray(geom.coordinates)) {
        const longitude = geom.coordinates[0];
        const latitude = geom.coordinates[1];
        handleLocationSelect(latitude, longitude);
      }
    },
    [handleLocationSelect],
  );

  // ── Search ──────────────────────────────────────────────────────────

  const searchPlace = useCallback(async () => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      Alert.alert(
        "Minimum 3 characters",
        "Please enter at least 3 characters to search.",
      );
      return;
    }
    setIsSearching(true);
    setShowResults(true);
    Keyboard.dismiss();
    const lat =
      typeof currentLatitude === "number" ? currentLatitude : NEPAL_CENTER_LAT;
    const lng =
      typeof currentLongitude === "number"
        ? currentLongitude
        : NEPAL_CENTER_LNG;

    const tryGalli = async (): Promise<SearchResultItem[] | null> => {
      const token = getGalliAccessToken();
      if (!token) return null;
      const baseParams = `word=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}`;
      let url = `${GALLI_API_BASE}/search/autocomplete?accessToken=${encodeURIComponent(token)}&${baseParams}`;
      let response = await fetch(url);
      if (!response.ok && response.status === 401) {
        url = `${GALLI_API_BASE}/search/autocomplete?acessToken=${encodeURIComponent(token)}&${baseParams}`;
        response = await fetch(url);
      }
      const text = await response.text();
      let json: {
        success?: boolean;
        message?: string;
        data?: SearchResultItem[];
      };
      try {
        json = JSON.parse(text);
      } catch {
        return null;
      }
      if (!response.ok) return null;
      return json.success && Array.isArray(json.data) ? json.data : [];
    };

    const tryNominatim = async (): Promise<SearchResultItem[]> => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&limit=5`,
        { headers: { "User-Agent": "EvaluationApp/1.0" } },
      );
      if (!res.ok) return [];
      const data: Array<{
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
        address?: { state?: string; city?: string; municipality?: string };
      }> = await res.json();
      return data.map((r) => {
        const parts = r.display_name.split(",").map((p) => p.trim());
        return {
          id: String(r.place_id),
          name: parts[0] || r.display_name,
          district: r.address?.state ?? parts[1] ?? "",
          municipality:
            r.address?.city ?? r.address?.municipality ?? parts[2] ?? "",
          province: "",
          ward: "",
          distance: "",
          geometry: "",
          nameLower: "",
          lat: r.lat,
          lon: r.lon,
        };
      });
    };

    try {
      const galliResults = await tryGalli();
      if (galliResults !== null) {
        setSearchResults(galliResults);
        return;
      }
      const nominatimResults = await tryNominatim();
      setSearchResults(nominatimResults);
      if (nominatimResults.length === 0) {
        Alert.alert("No results", "No places found. Try a different search.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Search failed";
      Alert.alert("Search Error", message);
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, currentLatitude, currentLongitude]);

  const handleSelectPlace = useCallback(
    async (item: SearchResultItem) => {
      setShowResults(false);
      setSearchQuery("");
      setSearchResults([]);

      if (item.lat != null && item.lon != null) {
        const latitude = parseFloat(item.lat);
        const longitude = parseFloat(item.lon);
        handleLocationSelect(latitude, longitude);
        flyToCoordinate(latitude, longitude, ZOOM_WHEN_PINNED);
        return;
      }

      const token = getGalliAccessToken();
      if (!token) {
        Alert.alert(
          "Configuration",
          "Galli Maps token not set. Pick a location on the map or use current location.",
        );
        return;
      }
      setIsResolvingCoordinates(true);
      const lat =
        typeof currentLatitude === "number"
          ? currentLatitude
          : NEPAL_CENTER_LAT;
      const lng =
        typeof currentLongitude === "number"
          ? currentLongitude
          : NEPAL_CENTER_LNG;
      try {
        const baseParams = `name=${encodeURIComponent(item.name)}&currentLat=${lat}&currentLng=${lng}`;
        let url = `${GALLI_API_BASE}/search/currentLocation?accessToken=${encodeURIComponent(token)}&${baseParams}`;
        let response = await fetch(url);
        if (!response.ok && response.status === 401) {
          url = `${GALLI_API_BASE}/search/currentLocation?acessToken=${encodeURIComponent(token)}&${baseParams}`;
          response = await fetch(url);
        }
        const text = await response.text();
        let json: {
          success?: boolean;
          data?: { type?: string; features?: GalliSearchFeature[] };
        };
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            response.ok ? "Invalid response" : `HTTP ${response.status}`,
          );
        }
        if (!response.ok) {
          throw new Error((json as any)?.message || `HTTP ${response.status}`);
        }
        const features = json?.data?.features;
        if (features?.length && features[0].geometry?.coordinates) {
          const [longitude, latitude] = features[0].geometry.coordinates;
          handleLocationSelect(latitude, longitude);
          flyToCoordinate(latitude, longitude, ZOOM_WHEN_PINNED);
        } else {
          Alert.alert(
            "No coordinates",
            "Could not get coordinates for this place. Try another or pick on the map.",
          );
        }
      } catch {
        Alert.alert(
          "Search Error",
          "Could not resolve location. Try again or pick on the map.",
        );
      } finally {
        setIsResolvingCoordinates(false);
      }
    },
    [handleLocationSelect, flyToCoordinate, currentLatitude, currentLongitude],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(
          "Location Disabled",
          "Please enable location services in device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      // Check current permission; request if not yet granted
      let { status, canAskAgain } =
        await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        if (canAskAgain === false) {
          Alert.alert(
            "Location Permission",
            "Location access was previously denied. Please enable it in app settings to use current location.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to use your current position. You can enable it in app settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      handleLocationSelect(lat, lng);
      flyToCoordinate(lat, lng, ZOOM_WHEN_PINNED);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not get your location.";
      console.warn("[Step0] Use current location error:", err);
      Alert.alert(
        "Location Error",
        `${message} Try again or pick a location on the map.`,
        [
          { text: "OK" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [handleLocationSelect, flyToCoordinate]);

  const hasValidCoordinates =
    typeof currentLatitude === "number" && typeof currentLongitude === "number";

  // On first mount only: if coordinates are already set (edit mode), fly to them.
  // Do NOT re-fly on every tap — the map is already at the tapped location.
  useEffect(() => {
    if (
      !hasFlewToInitialPin.current &&
      hasValidCoordinates &&
      currentLatitude != null &&
      currentLongitude != null
    ) {
      hasFlewToInitialPin.current = true;
      flyToCoordinate(currentLatitude, currentLongitude, ZOOM_WHEN_PINNED);
    }
  }, [hasValidCoordinates, currentLatitude, currentLongitude, flyToCoordinate]);

  // reverse geocode
  useEffect(() => {
    if (
      !hasValidCoordinates ||
      currentLatitude == null ||
      currentLongitude == null
    ) {
      setReverseAddress(null);
      return;
    }
    let cancelled = false;
    const token = getGalliAccessToken();
    const fetchGalliReverse = async () => {
      if (!token) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLatitude}&lon=${currentLongitude}`,
          { headers: { "User-Agent": "EvaluationApp/1.0" } },
        );
        if (cancelled || !res.ok) return;
        const data = await res.json();
        const addr = data?.display_name ?? "";
        if (!cancelled) setReverseAddress(addr);
        return;
      }
      try {
        const url = `${GALLI_API_BASE}/reverse/generalReverse?accessToken=${encodeURIComponent(token)}&lat=${currentLatitude}&lng=${currentLongitude}`;
        const res = await fetch(url);
        if (cancelled || !res.ok) return;
        const json = (await res.json()) as {
          success?: boolean;
          data?: GalliReverseData;
        };
        if (!json?.success || !json.data) return;
        const d = json.data;
        const parts = [
          d.generalName,
          d.roadName,
          d.place,
          d.municipality,
          d.ward,
          d.district,
          d.province,
        ].filter(Boolean);
        if (!cancelled)
          setReverseAddress(
            parts.length ? parts.join(", ") : "Address not found",
          );
      } catch {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLatitude}&lon=${currentLongitude}`,
          { headers: { "User-Agent": "EvaluationApp/1.0" } },
        );
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (!cancelled)
          setReverseAddress(data?.display_name ?? "Address not found");
      }
    };
    fetchGalliReverse();
    return () => {
      cancelled = true;
    };
  }, [hasValidCoordinates, currentLatitude, currentLongitude]);

  // Fetch property evaluation data (debounced to prevent rapid state churn
  // from multiple taps which destabilises the MapLibre native bridge).
  const evalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only clear data when coordinates become truly invalid (user hasn't placed a pin).
    if (
      !hasValidCoordinates ||
      currentLatitude == null ||
      currentLongitude == null
    ) {
      if (evalTimerRef.current) clearTimeout(evalTimerRef.current);
      setEvalData(null);
      return;
    }

    // Cancel any pending debounced call
    if (evalTimerRef.current) clearTimeout(evalTimerRef.current);

    let cancelled = false;
    setIsLoadingEval(true);

    evalTimerRef.current = setTimeout(async () => {
      try {
        const data = await fetchPropertyEvaluation(
          currentLatitude,
          currentLongitude,
        );
        if (cancelled) return;

        if (data) {
          setEvalData(data);
          setValue("property_evaluation_data", JSON.stringify(data), {
            shouldDirty: true,
          });

          if (data.water?.type === "river") {
            setValue("river_side", true, { shouldDirty: true });
          }
          if (data.transmissionline) {
            setValue("high_tension_area", true, { shouldDirty: true });
          }
          if (
            data.heritage &&
            data.heritage.distance < RISK_DISTANCE_THRESHOLD_KM
          ) {
            setValue("heritage_memorial_site", true, { shouldDirty: true });
          }
          const hasNearbyLandslide = data.disasters?.some(
            (d) =>
              d.disastertype === "Landslide" &&
              d.distance < RISK_DISTANCE_THRESHOLD_KM,
          );
          if (hasNearbyLandslide) {
            setValue("landslide_prone_area", true, { shouldDirty: true });
          }
          const hasNearbyFlood = data.disasters?.some(
            (d) =>
              d.disastertype === "Flood" &&
              d.distance < RISK_DISTANCE_THRESHOLD_KM,
          );
          if (hasNearbyFlood) {
            setValue("flood_prone_area", true, { shouldDirty: true });
          }
        }
        // If API returns null, keep old evalData visible rather than flashing to empty
      } catch (err) {
        console.error("[Step0] Property eval error:", err);
      } finally {
        if (!cancelled) setIsLoadingEval(false);
      }
    }, EVAL_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (evalTimerRef.current) clearTimeout(evalTimerRef.current);
    };
  }, [hasValidCoordinates, currentLatitude, currentLongitude, setValue]);

  // On edit mode, hydrate evalData from the stored form field
  useEffect(() => {
    if (evalData) return;
    const stored = watch("property_evaluation_data");
    if (stored) {
      try {
        setEvalData(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Map overlay GeoJSON ─────────────────────────────────────────────

  const waterGeoJSON = useMemo(
    () =>
      evalData
        ? makeLineGeoJSON(parseLineGeometry(evalData.water?.geometry))
        : null,
    [evalData],
  );

  const transmissionGeoJSON = useMemo(
    () =>
      evalData
        ? makeLineGeoJSON(
            parseLineGeometry(evalData.transmissionline?.geometry),
          )
        : null,
    [evalData],
  );

  const evalPointsGeoJSON = useMemo(
    () => makeEvalPointsGeoJSON(evalData),
    [evalData],
  );

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Searchbar
        placeholder="Search place (min 3 chars, e.g. Kathmandu, Boudha)"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={searchPlace}
        onIconPress={searchPlace}
        loading={isSearching || isResolvingCoordinates}
        style={styles.searchBar}
      />

      {showResults && searchResults.length > 0 && (
        <Surface style={styles.searchResults} elevation={3}>
          {searchResults.map((result) => (
            <List.Item
              key={result.id}
              title={result.name}
              description={[result.district, result.municipality]
                .filter(Boolean)
                .join(", ")}
              onPress={() => handleSelectPlace(result)}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              titleNumberOfLines={1}
              descriptionNumberOfLines={2}
            />
          ))}
        </Surface>
      )}

      {showResults && searchResults.length === 0 && !isSearching && (
        <Surface style={styles.searchResults} elevation={3}>
          <List.Item
            title="No results found"
            description="Try at least 3 characters (Galli Maps)"
            left={(props) => (
              <List.Icon {...props} icon="alert-circle-outline" />
            )}
          />
        </Surface>
      )}

      <Button
        mode="outlined"
        onPress={handleUseCurrentLocation}
        loading={isLoadingLocation}
        disabled={isLoadingLocation}
        icon={() => (
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={20}
            color={theme.colors.primary}
          />
        )}
        style={styles.currentLocationButton}
      >
        Use current location
      </Button>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          mapStyle={getMapStyleUrl()}
          logoEnabled={false}
          attributionEnabled={true}
          compassViewMargins={{ x: 23, y: 16 }}
          onPress={handleMapPress}
          style={styles.mapView}
        >
          <Camera
            ref={cameraRef}
            maxBounds={NEPAL_BOUNDS}
            zoomLevel={
              hasValidCoordinates ? ZOOM_WHEN_PINNED : DEFAULT_ZOOM
            }
            centerCoordinate={
              hasValidCoordinates &&
              currentLatitude != null &&
              currentLongitude != null
                ? [currentLongitude, currentLatitude]
                : [KATHMANDU_LNG, KATHMANDU_LAT]
            }
          />

          {hasValidCoordinates && (
            <MarkerView
              coordinate={[currentLongitude, currentLatitude]}
              allowOverlap
            >
              <View style={styles.pinContainer}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={40}
                  color="#d32f2f"
                />
              </View>
            </MarkerView>
          )}

          <ShapeSource id="eval-points-source" shape={evalPointsGeoJSON}>
            <CircleLayer
              id="heritage-circles"
              filter={["==", ["get", "kind"], "heritage"]}
              style={{
                circleRadius: 10,
                circleColor: "#6A1B9A",
                circleStrokeColor: "#ffffff",
                circleStrokeWidth: 2,
                circleOpacity: evalPointsGeoJSON.features.length > 0 ? 1 : 0,
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
                circleOpacity: evalPointsGeoJSON.features.length > 0 ? 1 : 0,
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
                circleOpacity: evalPointsGeoJSON.features.length > 0 ? 1 : 0,
              }}
            />
            {/* Text labels above each point */}
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
                textOpacity: evalPointsGeoJSON.features.length > 0 ? 1 : 0,
              }}
            />
          </ShapeSource>

          {/* Water body polyline — always mounted to avoid native bridge crash */}
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

          {/* Transmission line polyline — always mounted */}
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

        {/* Legend overlay — bottom-left corner of the map */}
        {evalData && (
          <View style={styles.mapLegendOverlay}>
            <View style={styles.legendItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={13}
                color="#d32f2f"
              />
              <Text variant="labelSmall" style={styles.legendText}>
                Selected
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#6A1B9A" }]}
              />
              <Text variant="labelSmall" style={styles.legendText}>
                Heritage
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#1565C0" }]}
              />
              <Text variant="labelSmall" style={styles.legendText}>
                Flood
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#c62828" }]}
              />
              <Text variant="labelSmall" style={styles.legendText}>
                Landslide
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendLine, { backgroundColor: "#1565C0" }]}
              />
              <Text variant="labelSmall" style={styles.legendText}>
                Water
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendLine, { backgroundColor: "#E65100" }]}
              />
              <Text variant="labelSmall" style={styles.legendText}>
                Power
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Address & Coordinates ───────────────────────────────────── */}

      {hasValidCoordinates && (
        <Surface style={styles.addressBlock} elevation={1}>
          {reverseAddress != null && (
            <List.Item
              title="Address"
              description={reverseAddress}
              descriptionNumberOfLines={3}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
          )}
          <List.Item
            title="Coordinates"
            description={`Lat: ${Number(currentLatitude).toFixed(6)}, Long: ${Number(currentLongitude).toFixed(6)}`}
            left={(props) => <List.Icon {...props} icon="crosshairs-gps" />}
          />
        </Surface>
      )}

      {/* ── Property Evaluation Data (read-only) ───────────────────── */}

      {isLoadingEval && hasValidCoordinates && (
        <View style={styles.evalLoading}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall" style={{ marginLeft: 8 }}>
            Fetching property evaluation data...
          </Text>
        </View>
      )}

      {evalData && (
        <View style={styles.evalSection}>
          <Text
            variant="titleMedium"
            style={[styles.evalSectionTitle, { color: theme.colors.primary }]}
          >
            Property Evaluation Data
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
          >
            Auto-fetched from GalliMaps (read-only)
          </Text>

          {/* Ward Info */}
          {evalData.newward && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  Ward Information
                </List.Subheader>
                <List.Item
                  title="Province"
                  description={evalData.newward.state}
                  left={(props) => (
                    <List.Icon {...props} icon="map-marker-radius" />
                  )}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
                <Divider />
                <List.Item
                  title="District"
                  description={evalData.newward.district}
                  left={(props) => (
                    <List.Icon {...props} icon="office-building" />
                  )}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
                <Divider />
                <List.Item
                  title="Municipality / VDC"
                  description={`${evalData.newward["municipality/vdc"]} (${evalData.newward["municipality/vdc_type"]})`}
                  left={(props) => <List.Icon {...props} icon="city" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
                <Divider />
                <List.Item
                  title="Ward"
                  description={String(evalData.newward.ward)}
                  left={(props) => <List.Icon {...props} icon="numeric" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
              </View>
            </Surface>
          )}

          {/* Old Ward Info */}
          {evalData.oldward && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  Old Ward Information
                </List.Subheader>
                <List.Item
                  title="District"
                  description={evalData.oldward.district}
                  left={(props) => (
                    <List.Icon {...props} icon="office-building" />
                  )}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
                <Divider />
                <List.Item
                  title="Zone"
                  description={evalData.oldward.zone}
                  left={(props) => <List.Icon {...props} icon="earth" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
                <Divider />
                <List.Item
                  title="VDC"
                  description={evalData.oldward.vdc}
                  left={(props) => <List.Icon {...props} icon="city-variant" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
                <Divider />
                <List.Item
                  title="Ward"
                  description={String(evalData.oldward.ward)}
                  left={(props) => <List.Icon {...props} icon="numeric" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                />
              </View>
            </Surface>
          )}

          {/* Conservation Area */}
          {evalData.conservation_area && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  Conservation Area
                </List.Subheader>
                <List.Item
                  title={evalData.conservation_area.name.replace(/_/g, " ")}
                  description={`Distance: ${evalData.conservation_area.distance.toFixed(2)} km`}
                  left={(props) => <List.Icon {...props} icon="pine-tree" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                  titleNumberOfLines={2}
                />
              </View>
            </Surface>
          )}

          {/* Heritage Site */}
          {evalData.heritage && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  Heritage Site
                </List.Subheader>
                <List.Item
                  title={evalData.heritage.name}
                  description={`Distance: ${evalData.heritage.distance.toFixed(4)} km`}
                  left={(props) => <List.Icon {...props} icon="castle" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                  titleNumberOfLines={2}
                />
              </View>
            </Surface>
          )}

          {/* Disasters */}
          {evalData.disasters && evalData.disasters.length > 0 && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  Nearby Disasters
                </List.Subheader>
                {evalData.disasters.map((d, idx) => (
                  <React.Fragment key={`disaster-card-${idx}`}>
                    {idx > 0 && <Divider />}
                    <List.Item
                      title={d.disastertype}
                      description={[
                        d.streetaddress?.trim() &&
                          `Location: ${d.streetaddress.trim()}`,
                        `Date: ${d.incidentOn}`,
                        `Distance: ${d.distance.toFixed(2)} km`,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={
                            d.disastertype === "Flood" ? "waves" : "terrain"
                          }
                        />
                      )}
                      titleStyle={styles.readOnlyTitle}
                      descriptionStyle={styles.readOnlyDesc}
                      descriptionNumberOfLines={4}
                    />
                  </React.Fragment>
                ))}
              </View>
            </Surface>
          )}

          {/* Water Body */}
          {evalData.water && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  Water Body
                </List.Subheader>
                <List.Item
                  title={evalData.water.name || evalData.water.type}
                  description={[
                    `Type: ${evalData.water.type}`,
                    evalData.water.bridge && `Bridge: ${evalData.water.bridge}`,
                    evalData.water.tunnel && `Tunnel: ${evalData.water.tunnel}`,
                  ]
                    .filter(Boolean)
                    .join("\n")}
                  left={(props) => <List.Icon {...props} icon="water" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                  descriptionNumberOfLines={4}
                  titleNumberOfLines={2}
                />
              </View>
            </Surface>
          )}

          {/* Transmission Line */}
          {evalData.transmissionline && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  Transmission Line
                </List.Subheader>
                <List.Item
                  title="Power Line"
                  description={[
                    evalData.transmissionline.cables &&
                      `Cables: ${evalData.transmissionline.cables}`,
                    evalData.transmissionline.circuits &&
                      `Circuits: ${evalData.transmissionline.circuits}`,
                    evalData.transmissionline.voltage &&
                      `Voltage: ${evalData.transmissionline.voltage}`,
                    evalData.transmissionline.power &&
                      `Power: ${evalData.transmissionline.power}`,
                  ]
                    .filter(Boolean)
                    .join("\n")}
                  left={(props) => (
                    <List.Icon {...props} icon="transmission-tower" />
                  )}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                  descriptionNumberOfLines={5}
                />
              </View>
            </Surface>
          )}

          {/* Auto-populated risk chips */}
          <View style={styles.autoRiskRow}>
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}
            >
              Auto-detected risk factors (editable in Step 3):
            </Text>
            <View style={styles.chipRow}>
              {evalData.water?.type === "river" && (
                <Chip icon="waves" compact style={styles.riskChip}>
                  Riverside
                </Chip>
              )}
              {evalData.transmissionline && (
                <Chip icon="transmission-tower" compact style={styles.riskChip}>
                  High Tension
                </Chip>
              )}
              {evalData.heritage &&
                evalData.heritage.distance < RISK_DISTANCE_THRESHOLD_KM && (
                  <Chip icon="castle" compact style={styles.riskChip}>
                    Heritage Site
                  </Chip>
                )}
              {evalData.disasters?.some(
                (d) =>
                  d.disastertype === "Landslide" &&
                  d.distance < RISK_DISTANCE_THRESHOLD_KM,
              ) && (
                <Chip icon="terrain" compact style={styles.riskChip}>
                  Landslide Prone
                </Chip>
              )}
              {evalData.disasters?.some(
                (d) =>
                  d.disastertype === "Flood" &&
                  d.distance < RISK_DISTANCE_THRESHOLD_KM,
              ) && (
                <Chip icon="waves" compact style={styles.riskChip}>
                  Flood Prone
                </Chip>
              )}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 0,
  },
  searchResults: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 220,
  },
  currentLocationButton: {
    marginBottom: 12,
  },
  mapContainer: {
    flex: 1,
    height: 460,
    marginHorizontal: -20,
    marginBottom: 8,
    overflow: "visible",
  },
  mapView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  pinContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  markerPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1976d2",
    borderWidth: 3,
    borderColor: "#fff",
  },
  mapLegendOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    maxWidth: "95%",
  },
  addressBlock: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },

  // Map legend items
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    color: "#ffffff",
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
  },

  // Eval loading
  evalLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  // Eval section
  evalSection: {
    marginTop: 4,
  },
  evalSectionTitle: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  evalCard: {
    borderRadius: 12,
    marginBottom: 12,
  },
  evalCardInner: {
    overflow: "hidden",
    borderRadius: 12,
  },
  cardHeader: {
    fontWeight: "700",
    fontSize: 14,
  },
  readOnlyTitle: {
    fontSize: 13,
    opacity: 0.65,
  },
  readOnlyDesc: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Auto-risk chips
  autoRiskRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  riskChip: {
    marginBottom: 4,
  },
});

export default Step0;
