import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  Dimensions,
  Keyboard,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import {
  Button,
  Text,
  Surface,
  useTheme,
  ActivityIndicator,
  Divider,
  Searchbar,
  List,
} from "react-native-paper";

interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (latitude: number, longitude: number) => void;
  editable?: boolean;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "error";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAP_HEIGHT = 300;

// OpenStreetMap HTML with Leaflet.js - no API key required
const getMapHTML = (lat: number, lng: number, canEdit: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { font-size: 8px !important; }
    .coordinates-display {
      position: absolute;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: rgba(255,255,255,0.95);
      padding: 8px 12px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      z-index: 1000;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .coordinates-display strong { color: #1976d2; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="coordinates-display">
    <strong>Lat:</strong> <span id="lat">${lat.toFixed(6)}</span> | 
    <strong>Lng:</strong> <span id="lng">${lng.toFixed(6)}</span>
  </div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([${lat}, ${lng}], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
    
    var marker = L.marker([${lat}, ${lng}], { 
      draggable: ${canEdit} 
    }).addTo(map);
    
    function updateCoordinates(lat, lng) {
      document.getElementById('lat').textContent = lat.toFixed(6);
      document.getElementById('lng').textContent = lng.toFixed(6);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'locationSelected',
        latitude: lat,
        longitude: lng
      }));
    }
    
    marker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      updateCoordinates(pos.lat, pos.lng);
    });
    
    ${
      canEdit
        ? `
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    });
    `
        : ""
    }
    
    // Function to update marker from React Native
    window.setLocation = function(lat, lng) {
      console.log('Setting location to:', lat, lng);
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 16, { animate: true });
      updateCoordinates(lat, lng);
    };
  </script>
</body>
</html>
`;

export function LocationPicker({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  editable = true,
}: LocationPickerProps) {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);

  // Default to Kathmandu, Nepal coordinates
  const defaultLat = initialLatitude ?? 27.7172;
  const defaultLng = initialLongitude ?? 85.324;

  const [currentPosition, setCurrentPosition] = useState({
    latitude: defaultLat,
    longitude: defaultLng,
  });
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Key to force re-render of WebView

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Handle message from WebView (location selected)
  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "locationSelected") {
          setCurrentPosition({
            latitude: data.latitude,
            longitude: data.longitude,
          });
          onLocationSelect(data.latitude, data.longitude);
        }
      } catch (error) {
        console.error("Error parsing WebView message:", error);
      }
    },
    [onLocationSelect],
  );

  // Update map when position changes
  const updateMapLocation = useCallback(
    (lat: number, lng: number) => {
      console.log("[Location] Updating map to:", lat, lng);
      if (webViewRef.current && mapLoaded) {
        webViewRef.current.injectJavaScript(
          `window.setLocation(${lat}, ${lng}); true;`,
        );
      } else {
        // If map not loaded yet, force re-render with new coordinates
        setCurrentPosition({ latitude: lat, longitude: lng });
        setMapKey((prev) => prev + 1);
      }
    },
    [mapLoaded],
  );

  // Request current location from device
  const requestCurrentLocation = useCallback(async () => {
    setLocationStatus("requesting");
    setIsLoading(true);

    try {
      // Check if location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      console.log("[Location] Services enabled:", serviceEnabled);

      if (!serviceEnabled) {
        setLocationStatus("error");
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        );
        setIsLoading(false);
        return;
      }

      // Request permission
      console.log("[Location] Requesting foreground permission...");
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      console.log(
        "[Location] Permission status:",
        status,
        "canAskAgain:",
        canAskAgain,
      );

      if (status !== "granted") {
        setLocationStatus("denied");
        Alert.alert(
          "Location Permission Denied",
          "Location permission is required to capture property coordinates. You can still drop a pin on the map or search for a landmark.",
          [
            { text: "OK", style: "default" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        );
        setIsLoading(false);
        return;
      }

      setLocationStatus("granted");

      // Get current position with high accuracy
      console.log("[Location] Getting current position...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLat = location.coords.latitude;
      const newLng = location.coords.longitude;
      console.log("[Location] Got coordinates:", newLat, newLng);

      setCurrentPosition({ latitude: newLat, longitude: newLng });
      onLocationSelect(newLat, newLng);

      // Update map - force re-render to ensure coordinates update
      updateMapLocation(newLat, newLng);
    } catch (error) {
      setLocationStatus("error");
      console.error("[Location] Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Failed to get your current location. You can drop a pin on the map or search for a landmark.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, updateMapLocation]);

  // Search for landmarks using OpenStreetMap Nominatim API (free, no key needed)
  const searchLandmark = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowResults(true);
    Keyboard.dismiss();

    try {
      // Add Nepal bias to search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&countrycodes=np&limit=5`,
        {
          headers: {
            "User-Agent": "EvaluationApp/1.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResult[] = await response.json();
      setSearchResults(data);

      if (data.length === 0) {
        // Try without country restriction
        const globalResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery,
          )}&limit=5`,
          {
            headers: {
              "User-Agent": "EvaluationApp/1.0",
            },
          },
        );
        const globalData: SearchResult[] = await globalResponse.json();
        setSearchResults(globalData);
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert(
        "Search Error",
        "Failed to search for location. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Handle search result selection
  const handleSelectSearchResult = useCallback(
    (result: SearchResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      setCurrentPosition({ latitude: lat, longitude: lng });
      onLocationSelect(lat, lng);
      updateMapLocation(lat, lng);

      setShowResults(false);
      setSearchQuery("");
      setSearchResults([]);
    },
    [onLocationSelect, updateMapLocation],
  );

  // Trigger location callback on initial mount if we have initial values
  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      onLocationSelect(initialLatitude, initialLongitude);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search landmark (e.g., Boudha Stupa)"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={searchLandmark}
        onIconPress={searchLandmark}
        loading={isSearching}
        style={styles.searchBar}
      />

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <Surface style={styles.searchResults} elevation={3}>
          {searchResults.map((result) => (
            <List.Item
              key={result.place_id}
              title={result.display_name.split(",")[0]}
              description={result.display_name.split(",").slice(1, 3).join(",")}
              onPress={() => handleSelectSearchResult(result)}
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
            description="Try a different search term"
            left={(props) => (
              <List.Icon {...props} icon="alert-circle-outline" />
            )}
          />
        </Surface>
      )}

      {/* GPS Button */}
      <Button
        mode="contained"
        onPress={requestCurrentLocation}
        loading={isLoading}
        disabled={isLoading || !editable}
        icon="crosshairs-gps"
        style={styles.gpsButton}
      >
        Use Current Location
      </Button>

      <Text variant="bodySmall" style={styles.helperText}>
        Tap on the map to drop a pin, search, or use GPS
      </Text>

      {/* Map Container */}
      <Surface style={styles.mapContainer} elevation={2}>
        {!mapLoaded && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading Map...</Text>
          </View>
        )}
        <WebView
          key={mapKey}
          ref={webViewRef}
          source={{
            html: getMapHTML(
              currentPosition.latitude,
              currentPosition.longitude,
              editable,
            ),
          }}
          style={styles.webView}
          onMessage={handleMessage}
          onLoad={() => setMapLoaded(true)}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </Surface>

      {/* Selected Coordinates Display */}
      <Surface style={styles.coordinatesCard} elevation={1}>
        <Text variant="labelMedium" style={styles.coordinatesLabel}>
          Selected Coordinates
        </Text>
        <Divider style={styles.divider} />
        <View style={styles.coordinatesRow}>
          <View style={styles.coordinateItem}>
            <Text variant="labelSmall" style={{ opacity: 0.6 }}>
              Latitude
            </Text>
            <Text variant="titleMedium" style={styles.coordinateValue}>
              {currentPosition.latitude.toFixed(6)}
            </Text>
          </View>
          <View style={styles.coordinateDivider} />
          <View style={styles.coordinateItem}>
            <Text variant="labelSmall" style={{ opacity: 0.6 }}>
              Longitude
            </Text>
            <Text variant="titleMedium" style={styles.coordinateValue}>
              {currentPosition.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  searchBar: {
    marginBottom: 8,
  },
  searchResults: {
    borderRadius: 8,
    marginBottom: 8,
    maxHeight: 200,
    overflow: "hidden",
  },
  gpsButton: {
    marginBottom: 8,
  },
  helperText: {
    opacity: 0.6,
    marginBottom: 12,
    textAlign: "center",
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.7,
  },
  coordinatesCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  coordinatesLabel: {
    fontWeight: "600",
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  coordinatesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coordinateItem: {
    flex: 1,
    alignItems: "center",
  },
  coordinateDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  coordinateValue: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "600",
    marginTop: 4,
  },
});

export default LocationPicker;
