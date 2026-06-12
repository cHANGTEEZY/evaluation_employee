import React from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { LocationAddressCard } from "./step0/LocationAddressCard";
import { LocationMap } from "./step0/LocationMap";
import { LocationSearch } from "./step0/LocationSearch";
import { PropertyEvaluationPanel } from "./step0/PropertyEvaluationPanel";
import { step0Styles as styles } from "./step0/styles";
import { useStep0Location } from "./step0/useStep0Location";

const Step0 = () => {
  const location = useStep0Location();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LocationSearch
        searchQuery={location.searchQuery}
        onSearchQueryChange={location.setSearchQuery}
        onSearch={location.searchPlace}
        searchResults={location.searchResults}
        showResults={location.showResults}
        isSearching={location.isSearching}
        isResolvingCoordinates={location.isResolvingCoordinates}
        onSelectPlace={location.handleSelectPlace}
        onUseCurrentLocation={location.handleUseCurrentLocation}
        isLoadingLocation={location.isLoadingLocation}
      />

      <LocationMap
        mapRef={location.mapRef}
        cameraRef={location.cameraRef}
        mapStyleUrl={location.mapStyleUrl}
        initialCameraSettings={location.initialCameraSettings}
        evalPointsGeoJSON={location.evalPointsGeoJSON}
        waterGeoJSON={location.waterGeoJSON}
        transmissionGeoJSON={location.transmissionGeoJSON}
        evalData={location.evalData}
        isLoadingEval={location.isLoadingEval}
        isMapMoving={location.isMapMoving}
        hasValidCoordinates={location.hasValidCoordinates}
        onMapPress={location.handleMapPress}
        onRegionDidChange={location.handleRegionDidChange}
      />

      {location.hasValidCoordinates &&
        !location.isMapMoving &&
        location.committedCoords && (
          <LocationAddressCard
            coords={location.committedCoords}
            reverseAddress={location.reverseAddress}
          />
        )}

      {location.isLoadingEval &&
        location.hasValidCoordinates &&
        !location.isMapMoving && (
          <View style={styles.evalLoading}>
            <ActivityIndicator size="small" />
            <Text variant="bodySmall" style={{ marginLeft: 8 }}>
              Fetching property evaluation data...
            </Text>
          </View>
        )}

      {location.evalData && !location.isMapMoving && (
        <PropertyEvaluationPanel evalData={location.evalData} />
      )}
    </ScrollView>
  );
};

export default Step0;
