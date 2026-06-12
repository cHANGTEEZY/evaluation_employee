import { getGalliMapsApiKey } from "../../../constants";
import {
  GALLI_API_BASE,
  NEPAL_CENTER_LAT,
  NEPAL_CENTER_LNG,
} from "./constants";
import type {
  GalliReverseData,
  GalliSearchFeature,
  SearchResultItem,
} from "./types";

const NOMINATIM_HEADERS = { "User-Agent": "EvaluationApp/1.0" };

export async function reverseGeocodeAddress(
  lat: number,
  lng: number,
  signal: AbortSignal,
): Promise<string | null> {
  const token = getGalliMapsApiKey();
  if (!token) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: NOMINATIM_HEADERS, signal },
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data?.display_name ?? "";
    } catch {
      return null;
    }
  }

  try {
    const url = `${GALLI_API_BASE}/reverse/generalReverse?accessToken=${encodeURIComponent(token)}&lat=${lat}&lng=${lng}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error("galli failed");
    const json = (await res.json()) as {
      success?: boolean;
      data?: GalliReverseData;
    };
    if (!json?.success || !json.data) return null;
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
    return parts.length ? parts.join(", ") : "Address not found";
  } catch {
    if (signal.aborted) return null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: NOMINATIM_HEADERS, signal },
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data?.display_name ?? "Address not found";
    } catch {
      return null;
    }
  }
}

async function searchGalli(
  query: string,
  lat: number,
  lng: number,
): Promise<SearchResultItem[] | null> {
  const token = getGalliMapsApiKey();
  if (!token) return null;
  const baseParams = `word=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}`;
  let url = `${GALLI_API_BASE}/search/autocomplete?accessToken=${encodeURIComponent(token)}&${baseParams}`;
  let response = await fetch(url);
  if (!response.ok && response.status === 401) {
    url = `${GALLI_API_BASE}/search/autocomplete?acessToken=${encodeURIComponent(token)}&${baseParams}`;
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
}

async function searchNominatim(query: string): Promise<SearchResultItem[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&limit=5`,
    { headers: NOMINATIM_HEADERS },
  );
  if (!res.ok) return [];
  const data: Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      state?: string;
      city?: string;
      municipality?: string;
    };
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
}

export async function searchPlaces(
  query: string,
  formLat?: number,
  formLng?: number,
): Promise<SearchResultItem[]> {
  const lat = typeof formLat === "number" ? formLat : NEPAL_CENTER_LAT;
  const lng = typeof formLng === "number" ? formLng : NEPAL_CENTER_LNG;
  const galliResults = await searchGalli(query, lat, lng);
  if (galliResults !== null) return galliResults;
  return searchNominatim(query);
}

export async function resolvePlaceCoordinates(
  item: SearchResultItem,
  formLat?: number,
  formLng?: number,
): Promise<[number, number] | null> {
  if (item.lat != null && item.lon != null) {
    return [parseFloat(item.lon), parseFloat(item.lat)];
  }
  const token = getGalliMapsApiKey();
  if (!token) return null;
  const lat = typeof formLat === "number" ? formLat : NEPAL_CENTER_LAT;
  const lng = typeof formLng === "number" ? formLng : NEPAL_CENTER_LNG;
  const baseParams = `name=${encodeURIComponent(item.name)}&currentLat=${lat}&currentLng=${lng}`;
  let url = `${GALLI_API_BASE}/search/currentLocation?accessToken=${encodeURIComponent(token)}&${baseParams}`;
  let response = await fetch(url);
  if (!response.ok && response.status === 401) {
    url = `${GALLI_API_BASE}/search/currentLocation?acessToken=${encodeURIComponent(token)}&${baseParams}`;
    response = await fetch(url);
  }
  const text = await response.text();
  let json: {
    success?: boolean;
    data?: {
      type?: string;
      features?: GalliSearchFeature[];
    };
    message?: string;
  };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      response.ok ? "Invalid response" : `HTTP ${response.status}`,
    );
  }
  if (!response.ok) {
    throw new Error(json?.message || `HTTP ${response.status}`);
  }
  const features = json?.data?.features;
  if (features?.length && features[0].geometry?.coordinates) {
    return features[0].geometry.coordinates;
  }
  return null;
}
