/**
 * Nepal unit converter: area (hill, Terai, standard) and length (Nepali traditional, standard).
 * Base units: area → m², length → m.
 */

// --- Area: base = 1 m² ---

/** 1 ropani = 508.72 m²; 1 ropani = 16 aana = 64 paisa = 256 dam */
const ROPANI_M2 = 508.72;
const AANA_PER_ROPANI = 16;
const PAISA_PER_ROPANI = 64;
const DAM_PER_ROPANI = 256;

/** 1 bigha = 6,772.63 m²; 1 bigha = 20 kattha = 400 dhur */
const BIGHA_M2 = 6772.63;
const KATTHA_PER_BIGHA = 20;
const DHUR_PER_BIGHA = 400;

/** Standard area: 1 sq ft = 0.092903 m², 1 acre = 4,046.86 m², 1 hectare = 10,000 m² */
const SQFT_M2 = 0.09290304;
const ACRE_M2 = 4046.86;
const HECTARE_M2 = 10000;

export const AREA_UNIT_GROUPS = {
  hill: ["ropani", "aana", "paisa", "dam"] as const,
  terai: ["bigha", "kattha", "dhur"] as const,
  standard: ["square_feet", "square_meter", "hectare", "acre"] as const,
} as const;

export type AreaUnitKey =
  | (typeof AREA_UNIT_GROUPS.hill)[number]
  | (typeof AREA_UNIT_GROUPS.terai)[number]
  | (typeof AREA_UNIT_GROUPS.standard)[number];

export const AREA_UNITS: { id: AreaUnitKey; label: string }[] = [
  { id: "ropani", label: "Ropani" },
  { id: "aana", label: "Aana" },
  { id: "paisa", label: "Paisa" },
  { id: "dam", label: "Dam" },
  { id: "bigha", label: "Bigha" },
  { id: "kattha", label: "Kattha" },
  { id: "dhur", label: "Dhur" },
  { id: "square_feet", label: "Square Feet" },
  { id: "square_meter", label: "Square Meter" },
  { id: "hectare", label: "Hectare" },
  { id: "acre", label: "Acre" },
];

/** Convert value in given area unit to square meters */
export function areaToSquareMeters(value: number, fromUnit: AreaUnitKey): number {
  if (!Number.isFinite(value)) return 0;
  switch (fromUnit) {
    case "ropani":
      return value * ROPANI_M2;
    case "aana":
      return value * (ROPANI_M2 / AANA_PER_ROPANI);
    case "paisa":
      return value * (ROPANI_M2 / PAISA_PER_ROPANI);
    case "dam":
      return value * (ROPANI_M2 / DAM_PER_ROPANI);
    case "bigha":
      return value * BIGHA_M2;
    case "kattha":
      return value * (BIGHA_M2 / KATTHA_PER_BIGHA);
    case "dhur":
      return value * (BIGHA_M2 / DHUR_PER_BIGHA);
    case "square_feet":
      return value * SQFT_M2;
    case "square_meter":
      return value;
    case "hectare":
      return value * HECTARE_M2;
    case "acre":
      return value * ACRE_M2;
    default:
      return 0;
  }
}

/** Convert square meters to all area units */
export function squareMetersToArea(m2: number): Record<AreaUnitKey, number> {
  if (!Number.isFinite(m2)) m2 = 0;
  return {
    ropani: m2 / ROPANI_M2,
    aana: m2 / (ROPANI_M2 / AANA_PER_ROPANI),
    paisa: m2 / (ROPANI_M2 / PAISA_PER_ROPANI),
    dam: m2 / (ROPANI_M2 / DAM_PER_ROPANI),
    bigha: m2 / BIGHA_M2,
    kattha: m2 / (BIGHA_M2 / KATTHA_PER_BIGHA),
    dhur: m2 / (BIGHA_M2 / DHUR_PER_BIGHA),
    square_feet: m2 / SQFT_M2,
    square_meter: m2,
    hectare: m2 / HECTARE_M2,
    acre: m2 / ACRE_M2,
  };
}

// --- Length: base = 1 m ---

/** 1 haat = 18 in = 0.4572 m; 24 angul = 1 haat; 2 vitastaa = 1 haat; 1 gaj = 2 haat; 1 dand = 4 haat; 1 kos = 2000 dand */
const HAAT_M = 0.4572;
const ANGUL_PER_HAAT = 24;
const VITASTAA_PER_HAAT = 2;
const GAJ_TO_HAAT = 2; // 1 gaj = 2 haat
const DAND_PER_HAAT = 0.25; // 1 dand = 4 haat
const KOS_M = 2000 * 4 * HAAT_M; // 2000 dand * 4 haat/dand * haat_m

/** Standard length */
const INCH_M = 0.0254;
const FEET_M = 0.3048;
const YARD_M = 0.9144;
const CM_M = 0.01;
const MILE_M = 1609.344;

export const LENGTH_UNIT_GROUPS = {
  nepali: ["angul", "vitastaa", "haat", "gaj", "dand", "kos"] as const,
  standard: ["inch", "feet", "yard", "centimeter", "meter", "kilometer", "mile"] as const,
} as const;

export type LengthUnitKey =
  | (typeof LENGTH_UNIT_GROUPS.nepali)[number]
  | (typeof LENGTH_UNIT_GROUPS.standard)[number];

export const LENGTH_UNITS: { id: LengthUnitKey; label: string }[] = [
  { id: "angul", label: "Angul (अङ्गुल)" },
  { id: "vitastaa", label: "Vitastaa (बित्ता)" },
  { id: "haat", label: "Haat (हात)" },
  { id: "gaj", label: "Gaj (गज)" },
  { id: "dand", label: "Dand (दण्ड)" },
  { id: "kos", label: "Kos (कोस)" },
  { id: "inch", label: "Inch" },
  { id: "feet", label: "Feet" },
  { id: "yard", label: "Yard" },
  { id: "centimeter", label: "Centimeter" },
  { id: "meter", label: "Meter" },
  { id: "kilometer", label: "Kilometer" },
  { id: "mile", label: "Mile" },
];

/** Convert value in given length unit to meters */
export function lengthToMeters(value: number, fromUnit: LengthUnitKey): number {
  if (!Number.isFinite(value)) return 0;
  switch (fromUnit) {
    case "angul":
      return value * (HAAT_M / ANGUL_PER_HAAT);
    case "vitastaa":
      return value * (HAAT_M / VITASTAA_PER_HAAT);
    case "haat":
      return value * HAAT_M;
    case "gaj":
      return value * GAJ_TO_HAAT * HAAT_M;
    case "dand":
      return value * (HAAT_M / DAND_PER_HAAT);
    case "kos":
      return value * KOS_M;
    case "inch":
      return value * INCH_M;
    case "feet":
      return value * FEET_M;
    case "yard":
      return value * YARD_M;
    case "centimeter":
      return value * CM_M;
    case "meter":
      return value;
    case "kilometer":
      return value * 1000;
    case "mile":
      return value * MILE_M;
    default:
      return 0;
  }
}

/** Convert meters to all length units */
export function metersToLength(m: number): Record<LengthUnitKey, number> {
  if (!Number.isFinite(m)) m = 0;
  return {
    angul: m / (HAAT_M / ANGUL_PER_HAAT),
    vitastaa: m / (HAAT_M / VITASTAA_PER_HAAT),
    haat: m / HAAT_M,
    gaj: m / (GAJ_TO_HAAT * HAAT_M),
    dand: m / (HAAT_M / DAND_PER_HAAT),
    kos: m / KOS_M,
    inch: m / INCH_M,
    feet: m / FEET_M,
    yard: m / YARD_M,
    centimeter: m / CM_M,
    meter: m,
    kilometer: m / 1000,
    mile: m / MILE_M,
  };
}
