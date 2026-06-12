import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, Linking, Platform } from "react-native";
import { useFormContext } from "react-hook-form";
import * as Location from "expo-location";
import { getGalliMapsApiKey } from "../../../constants";
import type { ValuationFormValues } from "../../../constants/form-schema";
import {
  fetchPropertyEvaluation,
  parseLineGeometry,
  type PropertyEvaluationData,
} from "../../../lib/property-evaluation-api";
import { applyEvalDataToForm } from "./apply-eval-to-form";
import {
  DEFAULT_ZOOM,
  getMapStyleUrl,
  KATHMANDU_LAT,
  KATHMANDU_LNG,
  NEPAL_BOUNDS,
  SETTLE_DEBOUNCE_MS,
  ZOOM_WHEN_PINNED,
} from "./constants";
import { makeEvalPointsGeoJSON, makeLineGeoJSON } from "./geojson";
import { reverseGeocodeAddress, resolvePlaceCoordinates, searchPlaces } from "./location-api";
import type { Coordinates, SearchResultItem } from "./types";
import type { CameraRef, MapViewRef } from "@maplibre/maplibre-react-native";

export function useStep0Location() {
  const { setValue, getValues } = useFormContext<ValuationFormValues>();

  const [committedCoords, setCommittedCoords] = useState<Coordinates | null>(
    () => {
      const lat = getValues("latitude");
      const lng = getValues("longitude");
      return typeof lat === "number" && typeof lng === "number"
        ? { lat, lng }
        : null;
    },
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isResolvingCoordinates, setIsResolvingCoordinates] = useState(false);
  const [reverseAddress, setReverseAddress] = useState<string | null>(null);
  const [evalData, setEvalData] = useState<PropertyEvaluationData | null>(null);
  const [isLoadingEval, setIsLoadingEval] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);

  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const hasFlewToInitialPin = useRef(false);
  const pendingCoordsRef = useRef<Coordinates | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitAbortRef = useRef<AbortController | null>(null);
  const programmaticMoveActiveRef = useRef(false);
  const moveGenerationRef = useRef(0);
  const programmaticCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const commitLocation = useCallback(
    async (lat: number, lng: number) => {
      commitAbortRef.current?.abort();
      const controller = new AbortController();
      commitAbortRef.current = controller;
      const { signal } = controller;

      setValue("latitude", lat, { shouldDirty: true });
      setValue("longitude", lng, { shouldDirty: true });
      setCommittedCoords({ lat, lng });
      setIsMapMoving(false);

      const reverseGeocode = async () => {
        const address = await reverseGeocodeAddress(lat, lng, signal);
        if (!signal.aborted && address != null) setReverseAddress(address);
      };

      const fetchEval = async () => {
        setIsLoadingEval(true);
        try {
          const data = await fetchPropertyEvaluation(lat, lng);
          if (signal.aborted) return;
          if (data) {
            setEvalData(data);
            applyEvalDataToForm(data, setValue);
          }
        } catch (err) {
          if (!signal.aborted)
            console.error("[Step0] Property eval error:", err);
        } finally {
          if (!signal.aborted) setIsLoadingEval(false);
        }
      };

      await Promise.all([reverseGeocode(), fetchEval()]);
    },
    [setValue],
  );

  const commitLocationRef = useRef(commitLocation);
  commitLocationRef.current = commitLocation;

  const flyToCoordinate = useCallback(
    (latitude: number, longitude: number, zoom?: number, autoCommit = true) => {
      const ANIM_DURATION = 500;
      const SETTLE_BUFFER = Platform.OS === "android" ? 1200 : 200;
      programmaticMoveActiveRef.current = true;
      moveGenerationRef.current += 1;
      const capturedGeneration = moveGenerationRef.current;
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
        if (programmaticCommitTimerRef.current) {
          clearTimeout(programmaticCommitTimerRef.current);
        }
        programmaticCommitTimerRef.current = setTimeout(() => {
          programmaticCommitTimerRef.current = null;
          if (moveGenerationRef.current !== capturedGeneration) return;
          programmaticMoveActiveRef.current = false;
          commitLocationRef.current(latitude, longitude);
        }, ANIM_DURATION + SETTLE_BUFFER);
      } else {
        setTimeout(() => {
          if (moveGenerationRef.current === capturedGeneration) {
            programmaticMoveActiveRef.current = false;
          }
        }, ANIM_DURATION + SETTLE_BUFFER);
      }
    },
    [],
  );

  const scheduleSettle = useCallback(
    (lat: number, lng: number) => {
      pendingCoordsRef.current = { lat, lng };
      setIsMapMoving(true);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        const coords = pendingCoordsRef.current;
        if (coords) commitLocation(coords.lat, coords.lng);
      }, SETTLE_DEBOUNCE_MS);
    },
    [commitLocation],
  );

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (programmaticCommitTimerRef.current) {
        clearTimeout(programmaticCommitTimerRef.current);
      }
      commitAbortRef.current?.abort();
    };
  }, []);

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

  const handleRegionDidChange = useCallback(
    (
      feature: GeoJSON.Feature<
        GeoJSON.Point,
        { isUserInteraction?: boolean }
      >,
    ) => {
      const isUser = feature?.properties?.isUserInteraction;
      if (isUser === false) return;
      if (programmaticMoveActiveRef.current) return;
      const geom = feature?.geometry;
      if (geom?.type === "Point" && Array.isArray(geom.coordinates)) {
        const lng = geom.coordinates[0];
        const lat = geom.coordinates[1];
        scheduleSettle(lat, lng);
      }
    },
    [scheduleSettle],
  );

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
    try {
      const results = await searchPlaces(
        query,
        typeof formLat === "number" ? formLat : undefined,
        typeof formLng === "number" ? formLng : undefined,
      );
      setSearchResults(results);
      if (results.length === 0) {
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
        flyToCoordinate(
          parseFloat(item.lat),
          parseFloat(item.lon),
          ZOOM_WHEN_PINNED,
        );
        return;
      }
      if (!getGalliMapsApiKey()) {
        Alert.alert(
          "Configuration",
          "Galli Maps token not set. Pick a location on the map or use current location.",
        );
        return;
      }
      const formLat = getValues("latitude");
      const formLng = getValues("longitude");
      setIsResolvingCoordinates(true);
      try {
        const coords = await resolvePlaceCoordinates(
          item,
          typeof formLat === "number" ? formLat : undefined,
          typeof formLng === "number" ? formLng : undefined,
        );
        if (coords) {
          const [longitude, latitude] = coords;
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

  useEffect(() => {
    const stored = getValues("property_evaluation_data");
    if (stored) {
      try {
        setEvalData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (hasFlewToInitialPin.current) return;
    const lat = getValues("latitude");
    const lng = getValues("longitude");
    if (typeof lat === "number" && typeof lng === "number") {
      hasFlewToInitialPin.current = true;
      flyToCoordinate(lat, lng, ZOOM_WHEN_PINNED);
    }
  }, []);

  const mapStyleUrl = useMemo(() => getMapStyleUrl(), []);
  const initialCameraSettings = useMemo(() => {
    const lat = getValues("latitude");
    const lng = getValues("longitude");
    const hasCoords = typeof lat === "number" && typeof lng === "number";
    return {
      zoomLevel: hasCoords ? ZOOM_WHEN_PINNED : DEFAULT_ZOOM,
      centerCoordinate: hasCoords
        ? [lng, lat]
        : [KATHMANDU_LNG, KATHMANDU_LAT],
    };
  }, []);

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

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    showResults,
    isSearching,
    isResolvingCoordinates,
    searchPlace,
    handleSelectPlace,
    handleUseCurrentLocation,
    isLoadingLocation,
    mapRef,
    cameraRef,
    handleMapPress,
    handleRegionDidChange,
    mapStyleUrl,
    initialCameraSettings,
    waterGeoJSON,
    transmissionGeoJSON,
    evalPointsGeoJSON,
    committedCoords,
    reverseAddress,
    evalData,
    isLoadingEval,
    isMapMoving,
    hasValidCoordinates,
  };
}
