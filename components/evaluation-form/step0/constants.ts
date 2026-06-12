import { getGalliMapsApiKey } from "../../../constants";

export const GALLI_API_BASE = "https://route-init.gallimap.com/api/v1";
export const NEPAL_CENTER_LAT = 27.7;
export const NEPAL_CENTER_LNG = 85.3;
export const KATHMANDU_LAT = 27.7172;
export const KATHMANDU_LNG = 85.324;
export const DEFAULT_ZOOM = 13;
export const ZOOM_WHEN_PINNED = 14;
export const RISK_DISTANCE_THRESHOLD_KM = 2;
export const SETTLE_DEBOUNCE_MS = 800;

export const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const FALLBACK_MAP_STYLE =
  "https://demotiles.maplibre.org/styles/osm-bright-gl-style/style.json";

export function getMapStyleUrl(): string {
  const token = getGalliMapsApiKey();
  if (token) {
    return `https://map-init.gallimap.com/styles/light/style.json?accessToken=${token}`;
  }
  return FALLBACK_MAP_STYLE;
}

export const NEPAL_BOUNDS = {
  sw: [80.0, 26.3] as [number, number],
  ne: [88.2, 30.4] as [number, number],
};
