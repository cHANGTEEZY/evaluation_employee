export interface ConservationArea {
  distance: number;
  name: string;
}

export interface Heritage {
  distance: number;
  name: string;
  geometry: [number, number]; // [lng, lat]
}

export interface Disaster {
  disastertype: string;
  geometry: [number, number]; // [lng, lat]
  incidentOn: string;
  streetaddress: string;
  distance: number;
}

export interface NewWard {
  state: string;
  district: string;
  "municipality/vdc": string;
  "municipality/vdc_type": string;
  ward: number;
}

export interface OldWard {
  ward: number;
  vdc: string;
  district: string;
  zone: string;
}

export interface OldVdc {
  vdcname: string;
  district: string;
}

export interface WaterBody {
  type: string;
  name: string;
  bridge: string | null;
  tunnel: string | null;
  geometry: string; // stringified JSON array of coordinate arrays
}

export interface TransmissionLine {
  city: string | null;
  housenumber: string | null;
  cables: string | null;
  circuits: string | null;
  frequency: string | null;
  line: string | null;
  power: string | null;
  voltage: string | null;
  wires: string | null;
  geometry: string; // stringified JSON array of coordinate arrays
}

export interface PropertyEvaluationData {
  conservation_area: ConservationArea;
  heritage: Heritage;
  disasters: Disaster[];
  newward: NewWard;
  oldward: OldWard;
  oldvdc: OldVdc;
  water: WaterBody;
  transmissionline: TransmissionLine;
}

interface PropertyEvaluationResponse {
  status: string;
  message: string;
  data: PropertyEvaluationData;
}

function getGalliAccessToken(): string {
  return (
    process.env.EXPO_PUBLIC_GALLI_MAPS_API_KEY ??
    process.env.GALLI_MAPS_API_KEY ??
    ""
  );
}

const PROPERTY_EVAL_BASE =
  "https://route-dev.gallimap.com/reverse/propertyevaulation";

//* Parse the stringified geometry from water / transmissionline fields into
//* a GeoJSON-compatible coordinate array: number[][] (each item is [lng, lat]).
//* Returns null when parsing fails.
export function parseLineGeometry(
  raw: string | null | undefined,
): number[][] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);

    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      Array.isArray(parsed[0]) &&
      Array.isArray(parsed[0][0])
    ) {
      return parsed[0] as number[][];
    }
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      Array.isArray(parsed[0])
    ) {
      return parsed as number[][];
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchPropertyEvaluation(
  lat: number,
  lng: number,
): Promise<PropertyEvaluationData | null> {
  const token = getGalliAccessToken();
  if (!token) {
    console.warn("[PropertyEval] No Galli Maps access token configured");
    return null;
  }

  const url = `${PROPERTY_EVAL_BASE}/?accessToken=${encodeURIComponent(token)}&lat=${lat}&lng=${lng}`;

  try {
    console.log("[PropertyEval] Fetching:", url);
    const res = await fetch(url);

    const rawText = await res.text();
    console.log(
      "[PropertyEval] HTTP status:",
      res.status,
      "body:",
      JSON.stringify(JSON.parse(rawText), null, 2),
    );

    if (!res.ok) {
      console.warn("[PropertyEval] HTTP error:", res.status);
      return null;
    }

    let json: PropertyEvaluationResponse;
    try {
      json = JSON.parse(rawText);
    } catch {
      console.warn("[PropertyEval] Invalid JSON response");
      return null;
    }

    if (json.status !== "SUCCESS" || !json.data) {
      console.warn(
        "[PropertyEval] API error — status:",
        json.status,
        "message:",
        json.message,
      );
      return null;
    }

    return json.data;
  } catch (error) {
    console.error("[PropertyEval] Fetch error:", error);
    return null;
  }
}
