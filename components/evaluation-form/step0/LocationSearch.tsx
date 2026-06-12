import React from "react";
import { Button, List, Searchbar, Surface, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { SearchResultItem } from "./types";
import { step0Styles as styles } from "./styles";

interface LocationSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  searchResults: SearchResultItem[];
  showResults: boolean;
  isSearching: boolean;
  isResolvingCoordinates: boolean;
  onSelectPlace: (item: SearchResultItem) => void;
  onUseCurrentLocation: () => void;
  isLoadingLocation: boolean;
}

export function LocationSearch({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults,
  showResults,
  isSearching,
  isResolvingCoordinates,
  onSelectPlace,
  onUseCurrentLocation,
  isLoadingLocation,
}: LocationSearchProps) {
  const theme = useTheme();

  return (
    <>
      <Searchbar
        placeholder="Search place (min 3 chars, e.g. Kathmandu, Boudha)"
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        onSubmitEditing={onSearch}
        onIconPress={onSearch}
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
              onPress={() => onSelectPlace(result)}
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
        onPress={onUseCurrentLocation}
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
    </>
  );
}
