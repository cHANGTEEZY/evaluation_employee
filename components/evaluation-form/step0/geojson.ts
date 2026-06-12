import type { PropertyEvaluationData } from "../../../lib/property-evaluation-api";
import { EMPTY_GEOJSON } from "./constants";

export function makeLineGeoJSON(
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

export function makeEvalPointsGeoJSON(
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
