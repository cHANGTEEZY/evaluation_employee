# Google Maps API Integration Guide for Expo Mobile App

> **Property Valuation Mobile App - Complete Implementation Guide**
>
> This guide covers Google Maps integration for coordinate capture, location selection, and GPS tracking on both Android and iOS platforms.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites & API Setup](#2-prerequisites--api-setup)
3. [Package Installation](#3-package-installation)
4. [Configuration](#4-configuration)
5. [Core Implementation](#5-core-implementation)
6. [Platform-Specific Considerations](#6-platform-specific-considerations)
7. [Edge Cases & Solutions](#7-edge-cases--solutions)
8. [Offline Support](#8-offline-support)
9. [Additional Features](#9-additional-features)
10. [Testing Guide](#10-testing-guide)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Overview

### Goals

- Drop pin on map to get latitude/longitude coordinates
- Use device's current location (with user permission)
- Store coordinates in offline SQLite database
- Sync coordinates to backend when online
- Display property locations on interactive map

### Integration Points with Existing App

- **Schema**: Already has `latitude` and `longitude` fields in `valuations` table
- **Form Steps**: Integrate into Step3 or Step4 of evaluation form
- **Offline Storage**: Coordinates cached locally until sync

---

## 2. Prerequisites & API Setup

### 2.1 Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Geocoding API** (for reverse geocoding)
   - **Places API** (optional, for address search)

### 2.2 API Key Creation

```bash
# Create two separate API keys for security:
# 1. Android API Key - restricted to Android apps
# 2. iOS API Key - restricted to iOS apps
```

#### Android API Key Restrictions:

- Application restrictions: **Android apps**
- Add package name: `com.changteezy.exporouterexample`
- Add SHA-1 certificate fingerprint

#### iOS API Key Restrictions:

- Application restrictions: **iOS apps**
- Add bundle identifier: `com.changteezy.expo-router-example`

### 2.3 Get SHA-1 Fingerprint (Android)

```bash
# Development build
cd android && ./gradlew signingReport

# For EAS builds, get from EAS dashboard:
# Project Settings > Credentials > Android > Show SHA-1
```

---

## 3. Package Installation

### 3.1 Install Required Packages

```bash
# Main packages
pnpm add react-native-maps expo-location

# For EAS builds
npx expo install react-native-maps expo-location
```

### 3.2 Package Versions Compatibility

| Package           | Version | Expo SDK 54 Compatible |
| ----------------- | ------- | ---------------------- |
| react-native-maps | ^1.14.0 | ✅                     |
| expo-location     | ~18.0.4 | ✅                     |

---

## 4. Configuration

### 4.1 Update app.json

```json
{
  "expo": {
    "plugins": [
      // ... existing plugins
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location for property valuation.",
          "locationAlwaysPermission": "Allow $(PRODUCT_NAME) to use your location for property valuation.",
          "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location for property valuation."
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.FOREGROUND_SERVICE"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY"
        }
      }
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.changteezy.expo-router-example",
      "appleTeamId": "XPZVK3T5VQ",
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY"
      },
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Allow Evaluation to access your location to capture property coordinates.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Allow Evaluation to access your location to capture property coordinates.",
        "NSLocationAlwaysUsageDescription": "Allow Evaluation to access your location to capture property coordinates."
      }
    }
  }
}
```

### 4.2 Environment Variables

Create/update `.env`:

```env
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=your_android_api_key
EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=your_ios_api_key
```

> **IMPORTANT**: For production, use `eas secret:create` to store API keys securely.

---

## 5. Core Implementation

### 5.1 Location Picker Component

Create `components/LocationPicker.tsx`:

```tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import MapView, {
  Marker,
  MapPressEvent,
  Region,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Location from "expo-location";
import { Button, Text, IconButton, useTheme } from "react-native-paper";

interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (latitude: number, longitude: number) => void;
  editable?: boolean;
}

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "error";

export function LocationPicker({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  editable = true,
}: LocationPickerProps) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);

  // Default to Nepal coordinates (for property valuation context)
  const defaultRegion: Region = {
    latitude: initialLatitude ?? 27.7172,
    longitude: initialLongitude ?? 85.324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const [region, setRegion] = useState<Region>(defaultRegion);
  const [markerPosition, setMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialLatitude && initialLongitude
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null,
  );
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);

  // Request current location
  const requestCurrentLocation = useCallback(async () => {
    setLocationStatus("requesting");
    setIsLoading(true);

    try {
      // Check if location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationStatus("error");
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to use this feature.",
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
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationStatus("denied");
        Alert.alert(
          "Location Permission Denied",
          "Location permission is required to capture property coordinates. Please grant permission in settings.",
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

      setLocationStatus("granted");

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const newPosition = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setMarkerPosition(newPosition);
      setRegion({
        ...newPosition,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      // Animate to new location
      mapRef.current?.animateToRegion(
        {
          ...newPosition,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500,
      );

      onLocationSelect(newPosition.latitude, newPosition.longitude);
    } catch (error) {
      setLocationStatus("error");
      console.error("Error getting location:", error);

      // Handle specific error cases
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("timeout")) {
        Alert.alert(
          "Location Timeout",
          "Could not get your location. Please try again or drop a pin manually.",
        );
      } else if (errorMessage.includes("denied")) {
        Alert.alert(
          "Location Denied",
          "Location access was denied. You can drop a pin manually on the map.",
        );
      } else {
        Alert.alert(
          "Location Error",
          "Failed to get your location. You can drop a pin manually on the map.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect]);

  // Handle map press to drop pin
  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      if (!editable) return;

      const { coordinate } = event.nativeEvent;
      setMarkerPosition(coordinate);
      onLocationSelect(coordinate.latitude, coordinate.longitude);
    },
    [editable, onLocationSelect],
  );

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback(
    (event: {
      nativeEvent: { coordinate: { latitude: number; longitude: number } };
    }) => {
      const { coordinate } = event.nativeEvent;
      setMarkerPosition(coordinate);
      onLocationSelect(coordinate.latitude, coordinate.longitude);
    },
    [onLocationSelect],
  );

  return (
    <View style={styles.container}>
      {/* Map Controls */}
      <View style={styles.controls}>
        <Button
          mode="contained"
          onPress={requestCurrentLocation}
          loading={isLoading}
          disabled={isLoading || !editable}
          icon="crosshairs-gps"
          style={styles.locationButton}
        >
          Use Current Location
        </Button>
        <Text variant="bodySmall" style={styles.helperText}>
          Or tap on the map to drop a pin
        </Text>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={handleMapPress}
          showsUserLocation={locationStatus === "granted"}
          showsMyLocationButton={false}
          showsCompass
          showsScale
          mapType="standard"
          loadingEnabled
          loadingIndicatorColor={theme.colors.primary}
        >
          {markerPosition && (
            <Marker
              coordinate={markerPosition}
              draggable={editable}
              onDragEnd={handleMarkerDragEnd}
              title="Property Location"
              description={`${markerPosition.latitude.toFixed(6)}, ${markerPosition.longitude.toFixed(6)}`}
            />
          )}
        </MapView>

        {/* Center on location button */}
        {locationStatus === "granted" && (
          <IconButton
            icon="crosshairs"
            mode="contained"
            style={styles.centerButton}
            onPress={requestCurrentLocation}
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Getting Location...</Text>
          </View>
        )}
      </View>

      {/* Coordinates Display */}
      {markerPosition && (
        <View style={styles.coordinatesContainer}>
          <Text variant="bodyMedium" style={styles.coordinatesLabel}>
            Selected Coordinates:
          </Text>
          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateBox}>
              <Text variant="labelSmall">Latitude</Text>
              <Text variant="bodyLarge" style={styles.coordinateValue}>
                {markerPosition.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.coordinateBox}>
              <Text variant="labelSmall">Longitude</Text>
              <Text variant="bodyLarge" style={styles.coordinateValue}>
                {markerPosition.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    padding: 16,
    alignItems: "center",
  },
  locationButton: {
    marginBottom: 8,
  },
  helperText: {
    opacity: 0.7,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centerButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
  },
  coordinatesContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  coordinatesLabel: {
    marginBottom: 8,
  },
  coordinatesRow: {
    flexDirection: "row",
    gap: 16,
  },
  coordinateBox: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  coordinateValue: {
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
```

### 5.2 Location Hook

Create `lib/hooks/useLocation.ts`:

```tsx
import { useState, useCallback } from "react";
import * as Location from "expo-location";
import { Platform, Alert, Linking } from "react-native";

interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseLocationReturn {
  location: LocationResult | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
  requestLocation: () => Promise<LocationResult | null>;
  checkPermission: () => Promise<boolean>;
  openSettings: () => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);

  const openSettings = useCallback(() => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  }, []);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setError("Location services are disabled");
        return false;
      }

      // Check permission status
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === Location.PermissionStatus.GRANTED;
    } catch (err) {
      setError("Failed to check location permission");
      return false;
    }
  }, []);

  const requestLocation =
    useCallback(async (): Promise<LocationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if location services are enabled
        const serviceEnabled = await Location.hasServicesEnabledAsync();
        if (!serviceEnabled) {
          throw new Error("SERVICES_DISABLED");
        }

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);

        if (status !== Location.PermissionStatus.GRANTED) {
          throw new Error("PERMISSION_DENIED");
        }

        // Get location with timeout
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        // Set a 15-second timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("TIMEOUT")), 15000);
        });

        const currentLocation = await Promise.race([
          locationPromise,
          timeoutPromise,
        ]);

        const result: LocationResult = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
          altitude: currentLocation.coords.altitude,
          heading: currentLocation.coords.heading,
          speed: currentLocation.coords.speed,
          timestamp: currentLocation.timestamp,
        };

        setLocation(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        switch (errorMessage) {
          case "SERVICES_DISABLED":
            setError("Location services are disabled on this device");
            Alert.alert(
              "Location Services Disabled",
              "Please enable location services to use this feature.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: openSettings },
              ],
            );
            break;
          case "PERMISSION_DENIED":
            setError("Location permission was denied");
            Alert.alert(
              "Permission Required",
              "Location access is needed to capture property coordinates.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: openSettings },
              ],
            );
            break;
          case "TIMEOUT":
            setError("Location request timed out");
            Alert.alert(
              "Location Timeout",
              "Could not get your location. Please check GPS signal and try again.",
            );
            break;
          default:
            setError(`Location error: ${errorMessage}`);
            Alert.alert(
              "Location Error",
              "Failed to get your current location.",
            );
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    }, [openSettings]);

  return {
    location,
    isLoading,
    error,
    permissionStatus,
    requestLocation,
    checkPermission,
    openSettings,
  };
}
```

### 5.3 Reverse Geocoding Service

Create `lib/services/geocoding.ts`:

```tsx
interface GeocodingResult {
  formattedAddress: string;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY;

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const components = result.address_components;

    const getComponent = (type: string): string | null => {
      const component = components.find((c: { types: string[] }) =>
        c.types.includes(type),
      );
      return component ? component.long_name : null;
    };

    return {
      formattedAddress: result.formatted_address,
      street: getComponent("route"),
      city: getComponent("locality") || getComponent("sublocality"),
      state: getComponent("administrative_area_level_1"),
      country: getComponent("country"),
      postalCode: getComponent("postal_code"),
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
```

---

## 6. Platform-Specific Considerations

### 6.1 Android-Specific Issues & Solutions

| Issue                                   | Cause                       | Solution                                                              |
| --------------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| Map not showing                         | Missing API key             | Verify `android.config.googleMaps.apiKey` in app.json                 |
| Blank map with gray tiles               | API key restrictions        | Ensure package name and SHA-1 are correct in Google Console           |
| Location permission denied after update | Runtime permission reset    | Always request permission at runtime, don't assume granted            |
| GPS accuracy issues                     | Device in Power Saving mode | Request high accuracy mode, show user prompt to disable battery saver |
| Map crashes on old devices              | unsupported GL version      | Add fallback to default `MapView` without `PROVIDER_GOOGLE`           |

**Android ProGuard Rules** (if using ProGuard):

```proguard
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.maps.android.** { *; }
```

### 6.2 iOS-Specific Issues & Solutions

| Issue                               | Cause                       | Solution                                                |
| ----------------------------------- | --------------------------- | ------------------------------------------------------- |
| App rejected by Apple               | Missing usage description   | Add `NSLocationWhenInUseUsageDescription` to Info.plist |
| Location updates stop in background | iOS background restrictions | Use `expo-location` background mode (if needed)         |
| Map gestures conflict with scroll   | Nested scroll containers    | Wrap map in fixed-height container                      |
| Slow initial load                   | Cold start delay            | Show loading indicator, preload map region              |

### 6.3 Cross-Platform Code

```tsx
import { Platform } from "react-native";
import { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from "react-native-maps";

// Use Google Maps on Android, Apple Maps on iOS (optional)
const mapProvider = Platform.select({
  android: PROVIDER_GOOGLE,
  ios: PROVIDER_GOOGLE, // Can use PROVIDER_DEFAULT for Apple Maps
});

// Platform-specific accuracy settings
const locationAccuracy = Platform.select({
  android: Location.Accuracy.BestForNavigation,
  ios: Location.Accuracy.BestForNavigation,
});
```

---

## 7. Edge Cases & Solutions

### 7.1 Permission Handling

```tsx
// Handle all permission states
async function handleLocationPermission(): Promise<boolean> {
  const { status, canAskAgain } =
    await Location.getForegroundPermissionsAsync();

  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return true;

    case Location.PermissionStatus.DENIED:
      if (canAskAgain) {
        // Re-request permission
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        return newStatus === Location.PermissionStatus.GRANTED;
      } else {
        // User permanently denied - direct to settings
        Alert.alert(
          "Permission Required",
          "Please enable location permission in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

    case Location.PermissionStatus.UNDETERMINED:
      const { status: requestedStatus } =
        await Location.requestForegroundPermissionsAsync();
      return requestedStatus === Location.PermissionStatus.GRANTED;

    default:
      return false;
  }
}
```

### 7.2 Network Connectivity

```tsx
import { useNetworkState } from "expo-network";

function LocationPickerWithNetworkCheck() {
  const networkState = useNetworkState();

  // Maps require network - show offline message
  if (!networkState.isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Text>Map unavailable offline</Text>
        <Text variant="bodySmall">
          You can still enter coordinates manually or sync when back online.
        </Text>
        <ManualCoordinateInput />
      </View>
    );
  }

  return <LocationPicker />;
}
```

### 7.3 GPS Signal Issues

```tsx
async function getLocationWithRetry(
  maxRetries = 3,
  retryDelay = 2000,
): Promise<LocationResult | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try high accuracy first
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 0,
      });

      // Check accuracy threshold
      if (location.coords.accuracy && location.coords.accuracy < 50) {
        return formatLocationResult(location);
      }

      // If accuracy is poor, wait and retry
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Fall back to last known position
  const lastKnown = await Location.getLastKnownPositionAsync();
  return lastKnown ? formatLocationResult(lastKnown) : null;
}
```

### 7.4 Map Memory Management

```tsx
import { useEffect, useRef } from "react";
import MapView from "react-native-maps";

function OptimizedMapView() {
  const mapRef = useRef<MapView>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Force garbage collection on map
      if (mapRef.current) {
        mapRef.current.props.onMapReady = undefined;
      }
    };
  }, []);

  return (
    <MapView
      ref={mapRef}
      // Limit cached tiles to reduce memory
      maxZoomLevel={18}
      minZoomLevel={5}
      // Disable features you don't need
      pitchEnabled={false}
      rotateEnabled={false}
      // Use lite mode for static display (Android only)
      liteMode={false}
    />
  );
}
```

### 7.5 Coordinate Validation

```tsx
function isValidCoordinate(
  latitude: number | undefined | null,
  longitude: number | undefined | null,
): boolean {
  if (latitude === undefined || latitude === null) return false;
  if (longitude === undefined || longitude === null) return false;
  if (typeof latitude !== "number" || typeof longitude !== "number")
    return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;

  // Valid ranges
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;

  // Check for null island (0, 0)
  if (latitude === 0 && longitude === 0) {
    console.warn("Warning: Coordinates are at null island (0, 0)");
  }

  return true;
}
```

---

## 8. Offline Support

### 8.1 Caching Coordinates Locally

Already implemented in the existing schema. Coordinates are stored in SQLite:

```typescript
// In lib/schema.ts - already exists
latitude: number | null;
longitude: number | null;
```

### 8.2 Manual Coordinate Entry Fallback

Create `components/ManualCoordinateInput.tsx`:

```tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";

interface ManualCoordinateInputProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onSubmit: (latitude: number, longitude: number) => void;
}

export function ManualCoordinateInput({
  initialLatitude,
  initialLongitude,
  onSubmit,
}: ManualCoordinateInputProps) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(
    initialLongitude?.toString() ?? "",
  );
  const [errors, setErrors] = useState<{ lat?: string; lng?: string }>({});

  const validate = (): boolean => {
    const newErrors: { lat?: string; lng?: string } = {};

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.lat = "Latitude must be between -90 and 90";
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.lng = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(parseFloat(latitude), parseFloat(longitude));
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Enter Coordinates Manually
      </Text>

      <TextInput
        label="Latitude"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="decimal-pad"
        error={!!errors.lat}
        placeholder="e.g., 27.7172"
        style={styles.input}
      />
      {errors.lat && <HelperText type="error">{errors.lat}</HelperText>}

      <TextInput
        label="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="decimal-pad"
        error={!!errors.lng}
        placeholder="e.g., 85.3240"
        style={styles.input}
      />
      {errors.lng && <HelperText type="error">{errors.lng}</HelperText>}

      <Button mode="contained" onPress={handleSubmit} style={styles.button}>
        Save Coordinates
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
});
```

### 8.3 Cached Map Tiles

For truly offline maps, consider using:

```bash
# Option 1: react-native-maps-osm (OpenStreetMap tiles)
pnpm add react-native-maps-osm

# Option 2: Pre-download tiles for specific regions
# Use a tile caching service or custom tile server
```

---

## 9. Additional Features

### 9.1 Property Distance Calculator

```tsx
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
```

### 9.2 Property Clustering (Multiple Pins)

```tsx
import { Marker } from "react-native-maps";
import Supercluster from "supercluster";

function PropertyMapWithClusters({ properties }) {
  const supercluster = useMemo(() => {
    const index = new Supercluster({
      radius: 40,
      maxZoom: 16,
    });

    const points = properties.map((p) => ({
      type: "Feature",
      properties: { id: p.id, name: p.client_name },
      geometry: {
        type: "Point",
        coordinates: [p.longitude, p.latitude],
      },
    }));

    index.load(points);
    return index;
  }, [properties]);

  // ... render clusters
}
```

### 9.3 Geofencing for Site Visits

```tsx
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const GEOFENCE_TASK = "property-geofence";

// Define geofence regions
async function setupGeofence(
  propertyId: string,
  latitude: number,
  longitude: number,
  radius: number = 100,
) {
  await Location.startGeofencingAsync(GEOFENCE_TASK, [
    {
      identifier: propertyId,
      latitude,
      longitude,
      radius,
      notifyOnEnter: true,
      notifyOnExit: true,
    },
  ]);
}

// Handle geofence events
TaskManager.defineTask(GEOFENCE_TASK, ({ data, error }) => {
  if (error) {
    console.error("Geofence error:", error);
    return;
  }

  const { eventType, region } = data;
  if (eventType === Location.GeofencingEventType.Enter) {
    // Employee entered property site
    console.log(`Entered property: ${region.identifier}`);
    // Auto-update status to "Site Visit Started"
  } else if (eventType === Location.GeofencingEventType.Exit) {
    // Employee left property site
    console.log(`Exited property: ${region.identifier}`);
  }
});
```

### 9.4 Route to Property

```tsx
import { Linking, Platform } from "react-native";

function openDirections(latitude: number, longitude: number, label: string) {
  const scheme = Platform.select({
    ios: "maps:0,0?q=",
    android: "geo:0,0?q=",
  });

  const latLng = `${latitude},${longitude}`;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  });

  if (url) {
    Linking.openURL(url);
  }
}
```

### 9.5 Map View for Admin Dashboard

```tsx
function PropertyLocationsMap({ valuations }) {
  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: 27.7172,
        longitude: 85.324,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }}
    >
      {valuations
        .filter((v) => v.latitude && v.longitude)
        .map((valuation) => (
          <Marker
            key={valuation.id}
            coordinate={{
              latitude: valuation.latitude,
              longitude: valuation.longitude,
            }}
            title={valuation.client_name || "Property"}
            description={valuation.present_property_address}
            pinColor={getStatusColor(valuation.status)}
          />
        ))}
    </MapView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "draft":
      return "orange";
    case "submitted":
      return "blue";
    case "synced":
      return "green";
    default:
      return "red";
  }
}
```

### 9.6 Nearby Properties Detection

```tsx
async function findNearbyProperties(
  currentLat: number,
  currentLng: number,
  radiusKm: number = 5,
): Promise<ValuationRow[]> {
  const allProperties = await getAllValuations();

  return allProperties.filter((property) => {
    if (!property.latitude || !property.longitude) return false;

    const distance = calculateDistance(
      currentLat,
      currentLng,
      property.latitude,
      property.longitude,
    );

    return distance <= radiusKm;
  });
}
```

---

## 10. Testing Guide

### 10.1 Unit Tests

```tsx
// __tests__/location.test.ts
import { isValidCoordinate, calculateDistance } from "../lib/utils/location";

describe("Location Utils", () => {
  test("validates correct coordinates", () => {
    expect(isValidCoordinate(27.7172, 85.324)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
  });

  test("rejects invalid coordinates", () => {
    expect(isValidCoordinate(91, 85)).toBe(false);
    expect(isValidCoordinate(27, 181)).toBe(false);
    expect(isValidCoordinate(null, 85)).toBe(false);
    expect(isValidCoordinate(undefined, undefined)).toBe(false);
  });

  test("calculates distance correctly", () => {
    // Kathmandu to Pokhara ~200km
    const distance = calculateDistance(27.7172, 85.324, 28.2096, 83.9856);
    expect(distance).toBeCloseTo(150, -1); // Approximately 150 km
  });
});
```

### 10.2 Device Testing Checklist

#### Android Testing

- [ ] Test on Android 10+ (API 29+) with new permission model
- [ ] Test on Android 6-9 (API 23-28)
- [ ] Test with location services disabled
- [ ] Test with GPS only mode
- [ ] Test with network location only
- [ ] Test permission denied flow
- [ ] Test "Don't ask again" scenario
- [ ] Test on device without Google Play Services (Huawei)

#### iOS Testing

- [ ] Test on iOS 14+ with precise location toggle
- [ ] Test on iOS 13
- [ ] Test with location services disabled
- [ ] Test permission denied flow
- [ ] Test "while using app" vs "always" permission
- [ ] Test on iPad

### 10.3 Simulating Locations

**Android Emulator:**

```bash
# Set mock location
adb emu geo fix <longitude> <latitude>
# Example: Kathmandu
adb emu geo fix 85.3240 27.7172
```

**iOS Simulator:**

- Debug > Location > Custom Location...
- Or use GPX files for route simulation

---

## 11. Troubleshooting

### Common Issues

| Symptom                           | Likely Cause               | Solution                                        |
| --------------------------------- | -------------------------- | ----------------------------------------------- |
| Map shows gray tiles              | API key invalid/restricted | Check API key restrictions in Google Console    |
| "This app cannot use Google Maps" | Bundle ID mismatch         | Verify bundle ID matches in Google Console      |
| Location always returns null      | Permission not granted     | Check permission status, guide user to settings |
| App crashes on map load           | Memory issue (old devices) | Use `liteMode` prop on Android                  |
| Coordinates show (0, 0)           | Default values not handled | Add null checks before using coordinates        |
| Map lags when dragging            | Too many markers           | Implement marker clustering                     |
| Build fails on iOS                | Missing Google Maps pod    | Run `cd ios && pod install`                     |

### Debug Logging

```tsx
// Enable debug logging for location
if (__DEV__) {
  console.log(
    "Location Services Enabled:",
    await Location.hasServicesEnabledAsync(),
  );
  console.log(
    "Permission Status:",
    await Location.getForegroundPermissionsAsync(),
  );
}
```

---

## Quick Start Checklist

- [ ] Create Google Cloud project and enable Maps APIs
- [ ] Create restricted API keys for Android and iOS
- [ ] Add API keys to `app.json` configuration
- [ ] Install `react-native-maps` and `expo-location`
- [ ] Add location permissions to `app.json`
- [ ] Create `LocationPicker` component
- [ ] Integrate with evaluation form (Step3 or Step4)
- [ ] Add manual coordinate input fallback
- [ ] Test on both Android and iOS devices
- [ ] Create development build (`eas build`)

---

## Resources

- [react-native-maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [expo-location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [EAS Build for Custom Native Code](https://docs.expo.dev/develop/development-builds/create-a-build/)
