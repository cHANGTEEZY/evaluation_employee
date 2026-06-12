import React from "react";
import { List, Surface } from "react-native-paper";
import type { Coordinates } from "./types";
import { step0Styles as styles } from "./styles";

interface LocationAddressCardProps {
  coords: Coordinates;
  reverseAddress: string | null;
}

export function LocationAddressCard({
  coords,
  reverseAddress,
}: LocationAddressCardProps) {
  return (
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
        description={`Lat: ${coords.lat.toFixed(6)}, Long: ${coords.lng.toFixed(6)}`}
        left={(props) => <List.Icon {...props} icon="crosshairs-gps" />}
      />
    </Surface>
  );
}
