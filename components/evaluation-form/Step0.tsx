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
  Platform,
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
import { getGalliMapsApiKey } from "../../constants";
import {
  MapView,
  MapViewRef,
  Camera,
  CameraRef,
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

// Same as old working code: use Galli style for all platforms when token is set.
// When token is missing, fallback so the map still loads (e.g. in dev without .env).
const FALLBACK_MAP_STYLE =
  "https://demotiles.maplibre.org/styles/osm-bright-gl-style/style.json";

function getMapStyleUrl(): string {
  const token = getGalliMapsApiKey();
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

// GeoJSON helpers for map overlays

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

// Build a point FeatureCollection from eval data for heritage + disaster markers
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

// Threshold for auto-populating risk fields (km)
const RISK_DISTANCE_THRESHOLD_KM = 2;

// How long the user must stop panning before we commit coordinates & fetch data
// 800ms feels responsive yet avoids mid-gesture API calls (food-app pattern)
const SETTLE_DEBOUNCE_MS = 800;

const Step0 = () => {
  const theme = useTheme();
  const { setValue, getValues } = useFormContext<ValuationFormValues>();

  // Committed coordinates — only updated after the user stops panning.
  // These drive the address block and eval data display.
  const [committedCoords, setCommittedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    const lat = getValues("latitude");
    const lng = getValues("longitude");
    return typeof lat === "number" && typeof lng === "number"
      ? { lat, lng }
      : null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isResolvingCoordinates, setIsResolvingCoordinates] = useState(false);
  const [reverseAddress, setReverseAddress] = useState<string | null>(null);

  const [evalData, setEvalData] = useState<PropertyEvaluationData | null>(null);
  const [isLoadingEval, setIsLoadingEval] = useState(false);
  // true while the user is actively panning the map (hides address, shows hint)
  const [isMapMoving, setIsMapMoving] = useState(false);

  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  // Prevent re-flying every time coordinates change after a tap
  const hasFlewToInitialPin = useRef(false);

  // ── Settle-debounce refs (no re-renders during panning) ─────────
  // Stores the latest map-center while the user is still panning.
  const pendingCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  // Single timer that gates ALL downstream work (form commit + APIs).
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AbortController so a new commit cancels any in-flight API requests.
  const commitAbortRef = useRef<AbortController | null>(null);
  // Flag: true while a programmatic camera move is in progress.
  // While true, handleRegionDidChange is completely suppressed — this prevents the
  // feedback loop where Android fires onRegionDidChange multiple times (mid-animation
  // AND on completion), which previously caused infinite fetching & pin snap-back.
  const programmaticMoveActiveRef = useRef(false);
  // Generation counter — incremented on each flyToCoordinate call.
  // Prevents stale programmatic commits from executing after a newer move has started.
  const moveGenerationRef = useRef(0);
  // Separate timer for the autoCommit inside flyToCoordinate — intentionally NOT stored in
  // settleTimerRef so that scheduleSettle (called by user-gesture events) cannot cancel it.
  const programmaticCommitTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // The single function that does ALL work after settle
  const commitLocation = useCallback(
    async (lat: number, lng: number) => {
      // Cancel any previous in-flight commit
      commitAbortRef.current?.abort();
      const controller = new AbortController();
      commitAbortRef.current = controller;
      const { signal } = controller;

      // 1. Commit coordinates to form (skip validation — only matters at submit)
      setValue("latitude", lat, { shouldDirty: true });
      setValue("longitude", lng, { shouldDirty: true });
      setCommittedCoords({ lat, lng });
      setIsMapMoving(false);

      // 2. Reverse geocode
      const reverseGeocode = async () => {
        const token = getGalliMapsApiKey();
        if (!token) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              { headers: { "User-Agent": "EvaluationApp/1.0" }, signal },
            );
            if (!res.ok) return;
            const data = await res.json();
            if (!signal.aborted) setReverseAddress(data?.display_name ?? "");
          } catch {
            // aborted or network error — ignore
          }
          return;
        }
        try {
          const url = `${GALLI_API_BASE}/reverse/generalReverse?accessToken=${encodeURIComponent(token)}&lat=${lat}&lng=${lng}`;
          const res = await fetch(url, { signal });
          if (!res.ok) throw new Error("galli failed");
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
          if (!signal.aborted)
            setReverseAddress(
              parts.length ? parts.join(", ") : "Address not found",
            );
        } catch {
          if (signal.aborted) return;
          // Fallback to Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              { headers: { "User-Agent": "EvaluationApp/1.0" }, signal },
            );
            if (!res.ok) return;
            const data = await res.json();
            if (!signal.aborted)
              setReverseAddress(data?.display_name ?? "Address not found");
          } catch {
            // aborted or network error — ignore
          }
        }
      };

      // 3. Property evaluation fetch
      const fetchEval = async () => {
        setIsLoadingEval(true);
        try {
          const data = await fetchPropertyEvaluation(lat, lng);
          if (signal.aborted) return;

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
        } catch (err) {
          if (!signal.aborted)
            console.error("[Step0] Property eval error:", err);
        } finally {
          if (!signal.aborted) setIsLoadingEval(false);
        }
      };

      // Run reverse geocode and eval fetch in parallel
      await Promise.all([reverseGeocode(), fetchEval()]);
    },
    [setValue],
  );

  // Keep a stable ref to commitLocation so flyToCoordinate can call it
  // without creating a circular useCallback dependency.
  const commitLocationRef = useRef(commitLocation);
  commitLocationRef.current = commitLocation;

  // Fly the camera and optionally commit the location after animation settles.
  // The commit is done directly (not via onRegionDidChange) to avoid the
  // feedback loop while still resolving address/eval data for programmatic moves.
  const flyToCoordinate = useCallback(
    (latitude: number, longitude: number, zoom?: number, autoCommit = true) => {
      const ANIM_DURATION = 500;
      // On Android, onRegionDidChange fires multiple times per programmatic move
      // (mid-animation AND on completion). The settle buffer must be long enough
      // to outlast ALL of those spurious events before we clear the flag.
      const SETTLE_BUFFER = Platform.OS === "android" ? 1200 : 200;

      // Block ALL onRegionDidChange events until the programmatic commit fires.
      programmaticMoveActiveRef.current = true;
      moveGenerationRef.current += 1;
      const capturedGeneration = moveGenerationRef.current;

      // Cancel any pending user-gesture settle since we're overriding with a programmatic move
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

      if (zoom != null) {
        cameraRef.current?.setCamera?.({
          centerCoordinate: [longitude, latitude],
          zoomLevel: zoom,
          animationDuration: ANIM_DURATION,
        });
      } else {
        cameraRef.current?.flyTo?.([longitude, latitude], ANIM_DURATION);
      }
      if (autoCommit) {
        // Use a SEPARATE timer (programmaticCommitTimerRef, not settleTimerRef) so that
        // scheduleSettle — triggered by spurious Android onRegionDidChange events — cannot
        // accidentally cancel this commit and replace it with mid-animation coordinates.
        if (programmaticCommitTimerRef.current) {
          clearTimeout(programmaticCommitTimerRef.current);
        }
        programmaticCommitTimerRef.current = setTimeout(() => {
          programmaticCommitTimerRef.current = null;
          // Skip if a newer programmatic move has started since this was scheduled
          if (moveGenerationRef.current !== capturedGeneration) return;
          // Re-open the gate for user-gesture onRegionDidChange events
          programmaticMoveActiveRef.current = false;
          commitLocationRef.current(latitude, longitude);
        }, ANIM_DURATION + SETTLE_BUFFER);
      } else {
        // No autoCommit — clear the flag after the animation + buffer
        setTimeout(() => {
          if (moveGenerationRef.current === capturedGeneration) {
            programmaticMoveActiveRef.current = false;
          }
        }, ANIM_DURATION + SETTLE_BUFFER);
      }
    },
    [],
  );

  // ── scheduleSettle: debounced commit after user stops panning ────
  const scheduleSettle = useCallback(
    (lat: number, lng: number) => {
      pendingCoordsRef.current = { lat, lng };
      setIsMapMoving(true);

      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

      settleTimerRef.current = setTimeout(() => {
        const coords = pendingCoordsRef.current;
        if (coords) {
          commitLocation(coords.lat, coords.lng);
        }
      }, SETTLE_DEBOUNCE_MS);
    },
    [commitLocation],
  );

  // Clean up timers & abort on unmount
  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (programmaticCommitTimerRef.current) {
        clearTimeout(programmaticCommitTimerRef.current);
      }
      commitAbortRef.current?.abort();
    };
  }, []);

  // ── Map tap handler — fly camera to tapped point ────────────────
  const handleMapPress = useCallback(
    (feature: GeoJSON.Feature) => {
      const geom = feature?.geometry;
      if (geom?.type === "Point" && Array.isArray(geom.coordinates)) {
        const longitude = geom.coordinates[0];
        const latitude = geom.coordinates[1];
        flyToCoordinate(latitude, longitude, ZOOM_WHEN_PINNED);
      }
    },
    [flyToCoordinate],
  );

  // ── Map region change handler ───────────────────────────────────
  const handleRegionDidChange = useCallback(
    (
      feature: GeoJSON.Feature<GeoJSON.Point, { isUserInteraction?: boolean }>,
    ) => {
      // PRIMARY GUARD: MapLibre provides `isUserInteraction` in the event properties.
      // On Android, programmatic camera moves (flyTo/setCamera) fire onRegionDidChange
      // multiple times with isUserInteraction=false. Only respond to genuine user gestures.
      const isUser = feature?.properties?.isUserInteraction;
      if (isUser === false) {
        return;
      }

      // SECONDARY GUARD: flag set by flyToCoordinate — catches any edge case where
      // isUserInteraction might not be present or is unreliable.
      if (programmaticMoveActiveRef.current) {
        return;
      }

      const geom = feature?.geometry;
      if (geom?.type === "Point" && Array.isArray(geom.coordinates)) {
        const lng = geom.coordinates[0];
        const lat = geom.coordinates[1];
        scheduleSettle(lat, lng);
      }
    },
    [scheduleSettle],
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
    const formLat = getValues("latitude");
    const formLng = getValues("longitude");
    const lat = typeof formLat === "number" ? formLat : NEPAL_CENTER_LAT;
    const lng = typeof formLng === "number" ? formLng : NEPAL_CENTER_LNG;

    const tryGalli = async (): Promise<SearchResultItem[] | null> => {
      const token = getGalliMapsApiKey();
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
  }, [searchQuery, getValues]);

  const handleSelectPlace = useCallback(
    async (item: SearchResultItem) => {
      setShowResults(false);
      setSearchQuery("");
      setSearchResults([]);

      if (item.lat != null && item.lon != null) {
        const latitude = parseFloat(item.lat);
        const longitude = parseFloat(item.lon);
        // Fly to coordinate — onRegionDidChange will trigger commitLocation via scheduleSettle
        flyToCoordinate(latitude, longitude, ZOOM_WHEN_PINNED);
        return;
      }

      const token = getGalliMapsApiKey();
      if (!token) {
        Alert.alert(
          "Configuration",
          "Galli Maps token not set. Pick a location on the map or use current location.",
        );
        return;
      }
      setIsResolvingCoordinates(true);
      const formLat = getValues("latitude");
      const formLng = getValues("longitude");
      const lat = typeof formLat === "number" ? formLat : NEPAL_CENTER_LAT;
      const lng = typeof formLng === "number" ? formLng : NEPAL_CENTER_LNG;
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
          // Fly to coordinate — onRegionDidChange will trigger commitLocation via scheduleSettle
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
    [flyToCoordinate, getValues],
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

      // Validate that GPS coordinates are within Nepal bounds.
      // Galli Maps only serves Nepal tiles — flying to out-of-bounds coordinates
      // (e.g. Android emulator defaults to California) would show a blank map
      // and cause API 400 errors.
      const [swLng, swLat] = NEPAL_BOUNDS.sw;
      const [neLng, neLat] = NEPAL_BOUNDS.ne;
      if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) {
        Alert.alert(
          "Location Outside Nepal",
          "Your current GPS location is outside Nepal. This app only supports locations within Nepal. Please search for a location or tap on the map instead.",
        );
        return;
      }

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
  }, [flyToCoordinate]);

  const hasValidCoordinates = committedCoords != null;

  // On edit mode, hydrate evalData from the stored form field (runs before initial fly)
  useEffect(() => {
    if (evalData) return;
    const stored = getValues("property_evaluation_data");
    if (stored) {
      try {
        setEvalData(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On first mount only: if coordinates are already set (edit mode), fly to them.
  // flyToCoordinate auto-commits (fetches address + eval) unless data is already hydrated.
  useEffect(() => {
    if (hasFlewToInitialPin.current) return;
    const lat = getValues("latitude");
    const lng = getValues("longitude");
    if (typeof lat === "number" && typeof lng === "number") {
      hasFlewToInitialPin.current = true;
      // If evalData was hydrated from storage above, skip the API fetch
      flyToCoordinate(lat, lng, ZOOM_WHEN_PINNED);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Map overlay GeoJSON ─────────────────────────────────────────────

  // Memoize the map style URL so that rapid state updates (location loading,
  // eval fetching, etc.) don't pass a new string reference to MapView on every
  // render — on Android this can cause the map tiles to reload mid-session.
  const mapStyleUrl = useMemo(() => getMapStyleUrl(), []);

  // CRITICAL FIX (Android): Freeze Camera defaultSettings to mount-time values.
  // On Android, passing a new object literal on every render causes the native Camera
  // to re-apply the settings, firing onRegionDidChange (which calls commitLocation →
  // setCommittedCoords → re-render → new defaultSettings object → loop).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialCameraSettings = useMemo(() => {
    const lat = getValues("latitude");
    const lng = getValues("longitude");
    const hasCoords = typeof lat === "number" && typeof lng === "number";
    return {
      zoomLevel: hasCoords ? ZOOM_WHEN_PINNED : DEFAULT_ZOOM,
      centerCoordinate: hasCoords ? [lng, lat] : [KATHMANDU_LNG, KATHMANDU_LAT],
    };
  }, []); // Empty deps — only computed once at mount

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
          mapStyle={mapStyleUrl}
          logoEnabled={false}
          attributionEnabled={true}
          compassViewMargins={{ x: 23, y: 16 }}
          regionDidChangeDebounceTime={100}
          onPress={handleMapPress}
          onRegionDidChange={handleRegionDidChange}
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

        {/* Fixed center pin overlay — always at exact center */}
        <View pointerEvents="none" style={styles.centerPinOverlay}>
          <MaterialCommunityIcons name="map-marker" size={44} color="#d32f2f" />
        </View>

        {/* Loading overlay — shown after user stops panning while APIs resolve */}
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

      {hasValidCoordinates && !isMapMoving && (
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
            description={`Lat: ${committedCoords.lat.toFixed(6)}, Long: ${committedCoords.lng.toFixed(6)}`}
            left={(props) => <List.Icon {...props} icon="crosshairs-gps" />}
          />
        </Surface>
      )}

      {/* ── Property Evaluation Data (read-only) ───────────────────── */}

      {isLoadingEval && hasValidCoordinates && !isMapMoving && (
        <View style={styles.evalLoading}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall" style={{ marginLeft: 8 }}>
            Fetching property evaluation data...
          </Text>
        </View>
      )}

      {evalData && !isMapMoving && (
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
                    evalData.water.distance != null &&
                      `Distance: ${evalData.water.distance.toFixed(0)} m`,
                    evalData.water.bridge && `Bridge: ${evalData.water.bridge}`,
                    evalData.water.tunnel && `Tunnel: ${evalData.water.tunnel}`,
                  ]
                    .filter(Boolean)
                    .join("\n")}
                  left={(props) => <List.Icon {...props} icon="water" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                  descriptionNumberOfLines={5}
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
                    evalData.transmissionline.distance != null &&
                      `Distance: ${evalData.transmissionline.distance.toFixed(0)} m`,
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
                  descriptionNumberOfLines={6}
                />
              </View>
            </Surface>
          )}

          {/* World Heritage */}
          {evalData.worldheritage && (
            <Surface style={styles.evalCard} elevation={1}>
              <View style={styles.evalCardInner}>
                <List.Subheader style={styles.cardHeader}>
                  World Heritage
                </List.Subheader>
                <List.Item
                  title={evalData.worldheritage.name}
                  description={`Distance: ${evalData.worldheritage.distance.toFixed(4)} km`}
                  left={(props) => <List.Icon {...props} icon="bank" />}
                  titleStyle={styles.readOnlyTitle}
                  descriptionStyle={styles.readOnlyDesc}
                  titleNumberOfLines={2}
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
    overflow: Platform.OS === "android" ? "hidden" : "visible",
  },
  mapView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centerPinOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    // The icon is 44x44; offset by half to center the tip on the map center.
    // map-marker icon has its tip at the bottom-center, so shift up by full height
    // and left by half width.
    marginLeft: -22,
    marginTop: -44,
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
  },
  mapLoadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapLoadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
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
