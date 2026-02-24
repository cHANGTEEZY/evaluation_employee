import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  Keyboard,
  Linking,
} from "react-native";
import { Searchbar, Button, List, Surface, useTheme } from "react-native-paper";
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
} from "@maplibre/maplibre-react-native";

// Galli Maps API – https://gallimaps.com/documentation/galli-apis-doc.html

const GALLI_API_BASE = "https://route-init.gallimap.com/api/v1";
const NEPAL_CENTER_LAT = 27.7;
const NEPAL_CENTER_LNG = 85.3;
const DEFAULT_ZOOM = 12;
const ZOOM_WHEN_PINNED = 16;

function getGalliAccessToken(): string {
  return (
    process.env.EXPO_PUBLIC_GALLI_MAPS_API_KEY ??
    process.env.GALLI_MAPS_API_KEY ??
    ""
  );
}

// Use only light style; Galli satellite style URL returns 404
function getMapStyleUrl(): string {
  const token = getGalliAccessToken();
  return `https://map-init.gallimap.com/styles/light/style.json?accessToken=${token}`;
}

/** Search result (Galli or Nominatim fallback). lat/lon set when from Nominatim. */
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
  /** When set (Nominatim fallback), use directly instead of calling Galli Search API */
  lat?: string;
  lon?: string;
}

/** Galli Search API (currentLocation) returns coordinates */
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
    coordinates: [number, number]; // [lng, lat]
  };
}

// Nepal bounding box: [minLng, minLat], [maxLng, maxLat]
const NEPAL_BOUNDS = {
  sw: [80.0, 26.3] as [number, number],
  ne: [88.2, 30.4] as [number, number],
};

/** Galli reverse geocode response */
interface GalliReverseData {
  generalName?: string;
  roadName?: string;
  place?: string;
  municipality?: string;
  ward?: string;
  district?: string;
  province?: string;
}

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

  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);

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
    [setValue]
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
    []
  );

  const handleMapPress = useCallback(
    (feature: GeoJSON.Feature) => {
      const geom = feature?.geometry;
      if (geom?.type === "Point" && Array.isArray(geom.coordinates)) {
        const longitude = geom.coordinates[0];
        const latitude = geom.coordinates[1];
        handleLocationSelect(latitude, longitude);
        console.log("Coordinates: ", longitude, latitude);
      }
    },
    [handleLocationSelect]
  );

  const searchPlace = useCallback(async () => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      Alert.alert(
        "Minimum 3 characters",
        "Please enter at least 3 characters to search."
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
      const baseParams = `word=${encodeURIComponent(
        query
      )}&lat=${lat}&lng=${lng}`;
      let url = `${GALLI_API_BASE}/search/autocomplete?accessToken=${encodeURIComponent(
        token
      )}&${baseParams}`;
      let response = await fetch(url);
      if (!response.ok && response.status === 401) {
        url = `${GALLI_API_BASE}/search/autocomplete?acessToken=${encodeURIComponent(
          token
        )}&${baseParams}`;
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=np&limit=5`,
        { headers: { "User-Agent": "EvaluationApp/1.0" } }
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
          "Galli Maps token not set. Pick a location on the map or use current location."
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
        const baseParams = `name=${encodeURIComponent(
          item.name
        )}&currentLat=${lat}&currentLng=${lng}`;
        let url = `${GALLI_API_BASE}/search/currentLocation?accessToken=${encodeURIComponent(
          token
        )}&${baseParams}`;
        let response = await fetch(url);
        if (!response.ok && response.status === 401) {
          url = `${GALLI_API_BASE}/search/currentLocation?acessToken=${encodeURIComponent(
            token
          )}&${baseParams}`;
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
            response.ok ? "Invalid response" : `HTTP ${response.status}`
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
            "Could not get coordinates for this place. Try another or pick on the map."
          );
        }
      } catch {
        Alert.alert(
          "Search Error",
          "Could not resolve location. Try again or pick on the map."
        );
      } finally {
        setIsResolvingCoordinates(false);
      }
    },
    [handleLocationSelect, flyToCoordinate, currentLatitude, currentLongitude]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(
          "Location Disabled",
          "Please enable location services in settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to use your current position.",
          [
            { text: "OK" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
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
    } catch {
      Alert.alert(
        "Location Error",
        "Could not get your location. Try again or pick on the map."
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [handleLocationSelect, flyToCoordinate]);

  const hasValidCoordinates =
    typeof currentLatitude === "number" && typeof currentLongitude === "number";

  // When user has a pin, zoom in so the location is easy to see
  useEffect(() => {
    if (hasValidCoordinates && currentLatitude != null && currentLongitude != null) {
      flyToCoordinate(currentLatitude, currentLongitude, ZOOM_WHEN_PINNED);
    }
  }, [hasValidCoordinates, currentLatitude, currentLongitude, flyToCoordinate]);

  // Reverse geocode: show address + lat/long below map for verification
  useEffect(() => {
    if (!hasValidCoordinates || currentLatitude == null || currentLongitude == null) {
      setReverseAddress(null);
      return;
    }
    let cancelled = false;
    const token = getGalliAccessToken();
    const fetchGalliReverse = async () => {
      if (!token) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLatitude}&lon=${currentLongitude}`,
          { headers: { "User-Agent": "EvaluationApp/1.0" } }
        );
        if (cancelled || !res.ok) return;
        const data = await res.json();
        const addr = data?.display_name ?? "";
        if (!cancelled) setReverseAddress(addr);
        return;
      }
      try {
        const url = `${GALLI_API_BASE}/reverse/generalReverse?accessToken=${encodeURIComponent(
          token
        )}&lat=${currentLatitude}&lng=${currentLongitude}`;
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
        if (!cancelled) setReverseAddress(parts.length ? parts.join(", ") : "Address not found");
      } catch {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLatitude}&lon=${currentLongitude}`,
          { headers: { "User-Agent": "EvaluationApp/1.0" } }
        );
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (!cancelled) setReverseAddress(data?.display_name ?? "Address not found");
      }
    };
    fetchGalliReverse();
    return () => {
      cancelled = true;
    };
  }, [hasValidCoordinates, currentLatitude, currentLongitude]);

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
          onPress={handleMapPress}
          style={styles.mapView}
        >
          <Camera
            ref={cameraRef}
            bounds={hasValidCoordinates ? undefined : NEPAL_BOUNDS}
            maxBounds={NEPAL_BOUNDS}
            animationDuration={0}
            zoomLevel={hasValidCoordinates ? ZOOM_WHEN_PINNED : DEFAULT_ZOOM}
            centerCoordinate={
              hasValidCoordinates && currentLatitude != null && currentLongitude != null
                ? [currentLongitude, currentLatitude]
                : undefined
            }
          />
          {hasValidCoordinates && (
            <MarkerView
              coordinate={[currentLongitude, currentLatitude]}
              allowOverlap
            >
              <View style={styles.markerPin} />
            </MarkerView>
          )}
        </MapView>
      </View>

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
    height: 400,
    marginHorizontal: -20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
  },

  addressBlock: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },

  mapView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  markerPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1976d2",
    borderWidth: 3,
    borderColor: "#fff",
  },

  heading: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 22,
  },
});

export default Step0;
