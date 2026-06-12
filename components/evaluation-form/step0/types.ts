export interface SearchResultItem {
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

export interface GalliSearchFeature {
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

export interface GalliReverseData {
  generalName?: string;
  roadName?: string;
  place?: string;
  municipality?: string;
  ward?: string;
  district?: string;
  province?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
