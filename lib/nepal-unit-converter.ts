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
export function areaToSquareMeters(
  value: number,
  fromUnit: AreaUnitKey,
): number {
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
  standard: [
    "inch",
    "feet",
    "yard",
    "centimeter",
    "meter",
    "kilometer",
    "mile",
  ] as const,
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

// ─── Compound Nepali length (carry-style) ───────────────────────────────────

export interface CompoundNepaliLength {
  angul: number;
  vitastaa: number;
  haat: number;
  gaj: number;
  dand: number;
  kos: number;
}

/**
 * Convert meters into compound Nepali traditional length units (integers),
 * carrying up only when the remainder crosses the next unit threshold.
 *
 * Unit relationships (from constants in this file):
 * - 1 kos = 2000 dand
 * - 1 dand = 4 haat
 * - 1 gaj = 2 haat
 * - 1 haat = 2 vitastaa = 24 angul
 */
export function metersToCompoundNepaliLength(m: number): CompoundNepaliLength {
  if (!Number.isFinite(m) || m < 0) {
    return { angul: 0, vitastaa: 0, haat: 0, gaj: 0, dand: 0, kos: 0 };
  }

  // Epsilon helps avoid off-by-one due to floating point rounding.
  const eps = 1e-9;
  const kosM = KOS_M;
  const dandM = HAAT_M / DAND_PER_HAAT; // 4 haat
  const gajM = GAJ_TO_HAAT * HAAT_M; // 2 haat
  const vitastaaM = HAAT_M / VITASTAA_PER_HAAT; // 1/2 haat
  const angulM = HAAT_M / ANGUL_PER_HAAT; // 1/24 haat

  let remaining = m;

  const kos = Math.floor((remaining + eps) / kosM);
  remaining = Math.max(0, remaining - kos * kosM);

  const dand = Math.floor((remaining + eps) / dandM);
  remaining = Math.max(0, remaining - dand * dandM);

  const gaj = Math.floor((remaining + eps) / gajM);
  remaining = Math.max(0, remaining - gaj * gajM);

  const haat = Math.floor((remaining + eps) / HAAT_M);
  remaining = Math.max(0, remaining - haat * HAAT_M);

  const vitastaa = Math.floor((remaining + eps) / vitastaaM);
  remaining = Math.max(0, remaining - vitastaa * vitastaaM);

  const angul = Math.floor((remaining + eps) / angulM);

  return { angul, vitastaa, haat, gaj, dand, kos };
}

// ─── Compound area decomposition helpers ─────────────────────────────────────

export interface CompoundHill {
  ropani: number;
  aana: number;
  paisa: number;
  dam: number;
}

export interface CompoundTerai {
  bigha: number;
  kattha: number;
  dhur: number;
}

/**
 * Decompose a square-feet value into integer Hill (Ropani) units.
 * 1 ropani = 508.72 m² = 5475.5 sq ft (approx)
 */
export function sqFtToCompoundHill(sqFt: number): CompoundHill {
  if (!Number.isFinite(sqFt) || sqFt < 0)
    return { ropani: 0, aana: 0, paisa: 0, dam: 0 };
  const m2 = sqFt * SQFT_M2;
  // Total dam units (base sub-unit)
  const totalDam = m2 / (ROPANI_M2 / DAM_PER_ROPANI);
  const damInt = Math.floor(totalDam);
  const ropani = Math.floor(damInt / DAM_PER_ROPANI);
  const remAfterRopani = damInt % DAM_PER_ROPANI;
  // 1 ropani = 16 aana = 64 paisa = 256 dam → 1 aana = 16 dam, 1 paisa = 4 dam
  const aana = Math.floor(remAfterRopani / 16);
  const remAfterAana = remAfterRopani % 16;
  const paisa = Math.floor(remAfterAana / 4);
  const dam = remAfterAana % 4;
  return { ropani, aana, paisa, dam };
}

/**
 * Decompose a square-feet value into integer Terai (Bigha) units.
 * 1 bigha = 6772.63 m² = 72900 sq ft (approx)
 */
export function sqFtToCompoundTerai(sqFt: number): CompoundTerai {
  if (!Number.isFinite(sqFt) || sqFt < 0)
    return { bigha: 0, kattha: 0, dhur: 0 };
  const m2 = sqFt * SQFT_M2;
  // Total dhur units (base sub-unit)
  const totalDhur = m2 / (BIGHA_M2 / DHUR_PER_BIGHA);
  const dhurInt = Math.floor(totalDhur);
  const bigha = Math.floor(dhurInt / DHUR_PER_BIGHA);
  const remAfterBigha = dhurInt % DHUR_PER_BIGHA;
  // 1 bigha = 20 kattha = 400 dhur → 1 kattha = 20 dhur
  const kattha = Math.floor(remAfterBigha / 20);
  const dhur = remAfterBigha % 20;
  return { bigha, kattha, dhur };
}

/** Convert square meters to integer Hill (Ropani) units (carry-style). */
export function squareMetersToCompoundHill(m2: number): CompoundHill {
  const sqFt = m2 / SQFT_M2;
  return sqFtToCompoundHill(sqFt);
}

/** Convert square meters to integer Terai (Bigha) units (carry-style). */
export function squareMetersToCompoundTerai(m2: number): CompoundTerai {
  const sqFt = m2 / SQFT_M2;
  return sqFtToCompoundTerai(sqFt);
}

/** Format Hill compound as a readable string, skipping zero values */
export function formatHill(h: CompoundHill): string {
  const parts: string[] = [];
  if (h.ropani > 0) parts.push(`${h.ropani} Ropani`);
  if (h.aana > 0) parts.push(`${h.aana} Aana`);
  if (h.paisa > 0) parts.push(`${h.paisa} Paisa`);
  if (h.dam > 0) parts.push(`${h.dam} Dam`);
  return parts.length > 0 ? parts.join(" ") : "0 Dam";
}

/** Format Terai compound as a readable string, skipping zero values */
export function formatTerai(t: CompoundTerai): string {
  const parts: string[] = [];
  if (t.bigha > 0) parts.push(`${t.bigha} Bigha`);
  if (t.kattha > 0) parts.push(`${t.kattha} Kattha`);
  if (t.dhur > 0) parts.push(`${t.dhur} Dhur`);
  return parts.length > 0 ? parts.join(" ") : "0 Dhur";
}
