import { getDb } from "./db";
import {
  type ValuationFormValues,
  normalizeBuildingRatePerSqftInput,
} from "../constants/form-schema";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

// Generate unique ID
export function generateId() {
  return uuidv4();
}

/** Normalize date to ISO string for DB; form/draft may send Date or string. */
function toISODateString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    // Use local date components so the Nepal date is preserved (toISOString() shifts to UTC)
    const yyyy = v.getFullYear();
    const mm = String(v.getMonth() + 1).padStart(2, "0");
    const dd = String(v.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof v === "string") return v;
  return null;
}

export async function createValuationTable() {
  const db = await getDb();

  await db.execAsync(`CREATE TABLE IF NOT EXISTS valuations (
    -- System Fields
    id TEXT PRIMARY KEY,
    server_id TEXT,
    employee_id TEXT,
    status TEXT DEFAULT 'draft',
    sync_status TEXT DEFAULT 'pending',
    created_at TEXT,
    updated_at TEXT,
    submitted_at TEXT,
    synced_at TEXT,
    error_message TEXT,

    -- Basic Details
    ref_no TEXT,
    valuation_date TEXT,
    branch TEXT,
    client_name TEXT,
    contact_number TEXT,
    client_address_nagrita TEXT,

    -- Property Ownership & Location
    owner_of_property TEXT,
    property_address_deed TEXT,
    plot_no TEXT,
    present_property_address TEXT,
    district TEXT,

    -- Valuation Purpose
    valuation_for TEXT,

    -- Road & Access
    road_type TEXT,
    road_width REAL,
    access_road_direction TEXT,
    access_road_direction_others TEXT,

    -- Property Dimensions
    property_area_length REAL,
    property_frontage_direction TEXT,
    property_narrowest_length REAL,
    property_narrowest_direction TEXT,

    -- Access & Rights
    right_of_way INTEGER DEFAULT 0,
    right_of_way_width_ft REAL,
    motorable_access INTEGER DEFAULT 0,
    electricity_available INTEGER DEFAULT 0,
    drainage_near_property INTEGER DEFAULT 0,

    -- Property Classification
    property_type TEXT,
    property_ownership_type TEXT,
    ownership_transferred_through TEXT,
    hold_type TEXT,

    -- Land Rates
    land_rate_unit TEXT,
    commercial_rate_per_anna REAL,
    government_rate_per_anna REAL,

    -- Building Details
    building_type TEXT,
    building_purpose TEXT,
    number_of_storeys INTEGER,
    storey_height REAL,
    building_age_years INTEGER,
    building_rate_per_sqft TEXT,
    completion_date TEXT,

    -- Risk / Area
    landslide_prone_area INTEGER DEFAULT 0,
    landslide_prone_area_setback REAL,
    river_side INTEGER DEFAULT 0,
    river_side_setback REAL,
    high_tension_area INTEGER DEFAULT 0,
    high_tension_area_setback REAL,
    canal_area INTEGER DEFAULT 0,
    canal_area_setback REAL,
    flood_prone_area INTEGER DEFAULT 0,
    flood_prone_area_setback REAL,
    heritage_memorial_site INTEGER DEFAULT 0,
    heritage_memorial_site_setback REAL,

    -- Site & Topography
    site_charge REAL,
    high_land_ft REAL,
    low_land_ft REAL,
    latitude REAL,
    longitude REAL,
    slope_degree REAL,

    -- Payment Details
    payment_cash REAL,
    payment_online REAL,
    payment_online_mode TEXT,
    payment_pending_due REAL,

    -- Documents (stored as JSON)
    documents TEXT,

    -- Site Plan
    site_plan_note TEXT,

    -- Site Plan Drawing (local file URI or remote URL)
    site_plan_image TEXT,

    -- Site Plan Plotter Data (JSON string of PlotterData for resume editing)
    site_plan_plotter_data TEXT,

    -- Property Images (stored as JSON array of URIs)
    property_images TEXT,

    -- Bank Details (for folder structure)
    bank_name TEXT,
    bank_branch_name TEXT,
    city TEXT,
    tole_area TEXT,

    -- Last synced image hashes (JSON) to skip re-upload when unchanged
    synced_image_hashes TEXT,

    -- GalliMaps Property Evaluation API response (JSON)
    property_evaluation_data TEXT
  )`);

  // Lightweight migration: add new columns for existing installs.
  // Older databases won't have some recently added fields; we ALTER TABLE
  // and ignore the error if the column already exists.
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN right_of_way_width_ft REAL;",
    );
  } catch {
    // ignore (likely: duplicate column name)
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN road_type_others TEXT;",
    );
  } catch {
    // ignore (likely: duplicate column name)
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN land_rate_unit TEXT DEFAULT 'anna';",
    );
  } catch {
    // ignore (likely: duplicate column name)
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN document_photos TEXT;",
    );
  } catch {
    // ignore (likely: duplicate column name)
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN synced_image_hashes TEXT;",
    );
  } catch {
    // ignore (likely: duplicate column name)
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN property_evaluation_data TEXT;",
    );
  } catch {
    // ignore (likely: duplicate column name)
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN flood_prone_area INTEGER DEFAULT 0;",
    );
  } catch {
    // ignore
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN flood_prone_area_setback REAL;",
    );
  } catch {
    // ignore
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN building_rate_per_sqft TEXT;",
    );
  } catch {
    // ignore
  }
  try {
    await db.execAsync(
      "ALTER TABLE valuations ADD COLUMN site_plan_plotter_data TEXT;",
    );
  } catch {
    // ignore
  }
}

// Insert a new valuation
export async function insertValuation(
  data: ValuationFormValues,
  options?: { employeeId?: string },
): Promise<string> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  const employeeId = options?.employeeId ?? null;

  await db.runAsync(
    `INSERT INTO valuations (
      id, employee_id, created_at, updated_at, status, sync_status,
      ref_no, valuation_date, branch, client_name, contact_number, client_address_nagrita,
      owner_of_property, property_address_deed, plot_no, present_property_address, district,
      valuation_for, road_type, road_type_others, road_width, access_road_direction, access_road_direction_others,
      property_area_length, property_frontage_direction, property_narrowest_length, property_narrowest_direction,
      right_of_way, right_of_way_width_ft, motorable_access, electricity_available, drainage_near_property,
      property_type, property_ownership_type, ownership_transferred_through, hold_type,
      land_rate_unit, commercial_rate_per_anna, government_rate_per_anna,
      building_type, building_purpose, number_of_storeys, storey_height, building_age_years, building_rate_per_sqft, completion_date,
      landslide_prone_area, landslide_prone_area_setback, river_side, river_side_setback,
      high_tension_area, high_tension_area_setback, canal_area, canal_area_setback,
      flood_prone_area, flood_prone_area_setback, heritage_memorial_site, heritage_memorial_site_setback,
      site_charge, high_land_ft, low_land_ft, latitude, longitude, slope_degree,
      payment_cash, payment_online, payment_online_mode, payment_pending_due,
      documents, site_plan_note, site_plan_image, site_plan_plotter_data, property_images, document_photos,
      bank_name, bank_branch_name, city, tole_area,
      property_evaluation_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      employeeId,
      now,
      now,
      "draft",
      "pending",
      data.ref_no ?? null,
      toISODateString(data.valuation_date),
      data.branch ?? null,
      data.client_name ?? null,
      data.contact_number ?? null,
      data.client_address_nagrita ?? null,
      data.owner_of_property ?? null,
      data.property_address_deed ?? null,
      data.plot_no ?? null,
      data.present_property_address ?? null,
      data.district ?? null,
      data.valuation_for ?? null,
      data.road_type ?? null,
      data.road_type_others ?? null,
      data.road_width ?? null,
      data.access_road_direction ?? null,
      data.access_road_direction_others ?? null,
      data.property_area_length ?? null,
      data.property_frontage_direction ?? null,
      data.property_narrowest_length ?? null,
      data.property_narrowest_direction ?? null,
      data.right_of_way ? 1 : 0,
      data.right_of_way_width_ft ?? null,
      data.motorable_access ? 1 : 0,
      data.electricity_available ? 1 : 0,
      data.drainage_near_property ? 1 : 0,
      data.property_type ?? null,
      data.property_ownership_type ?? null,
      data.ownership_transferred_through ?? null,
      data.hold_type ?? null,
      data.land_rate_unit ?? null,
      data.commercial_rate_per_anna ?? null,
      data.government_rate_per_anna ?? null,
      data.building_type ?? null,
      data.building_purpose ?? null,
      data.number_of_storeys ?? null,
      data.storey_height ?? null,
      data.building_age_years ?? null,
      data.building_rate_per_sqft ? JSON.stringify(data.building_rate_per_sqft) : null,
      toISODateString(data.completion_date),
      data.landslide_prone_area ? 1 : 0,
      data.landslide_prone_area_setback ?? null,
      data.river_side ? 1 : 0,
      data.river_side_setback ?? null,
      data.high_tension_area ? 1 : 0,
      data.high_tension_area_setback ?? null,
      data.canal_area ? 1 : 0,
      data.canal_area_setback ?? null,
      data.flood_prone_area ? 1 : 0,
      data.flood_prone_area_setback ?? null,
      data.heritage_memorial_site ? 1 : 0,
      data.heritage_memorial_site_setback ?? null,
      data.site_charge ?? null,
      data.high_land_ft ?? null,
      data.low_land_ft ?? null,
      data.latitude ?? null,
      data.longitude ?? null,
      data.slope_degree ?? null,
      data.payment_cash ?? null,
      data.payment_online ?? null,
      data.payment_online_mode ?? null,
      data.payment_pending_due ?? null,
      data.documents ? JSON.stringify(data.documents) : null,
      data.site_plan_note ?? null,
      data.site_plan_drawing ?? null,
      data.site_plan_plotter_data ?? null,
      data.property_images ? JSON.stringify(data.property_images) : null,
      data.document_photos ? JSON.stringify(data.document_photos) : null,
      data.bank_name ?? null,
      data.bank_branch_name ?? null,
      data.city ?? null,
      data.tole_area ?? null,
      data.property_evaluation_data ?? null,
    ],
  );

  return id;
}

/**
 * Seed a dummy valuation for testing (uses default form values and generates unique ref no).
 * Call from dev-only UI (e.g. __DEV__ button).
 */
export async function seedDummyValuation(options?: {
  employeeId?: string;
}): Promise<string> {
  const { defaultValuationValues } = await import("../constants/form-schema");
  const { generateClientRefNumber, generateShortId } = await import(
    "./ref-number"
  );
  const clientName = (defaultValuationValues.client_name ?? "Test Client").trim();
  const district = (defaultValuationValues.district ?? "Kathmandu").trim();
  const plotNo = String(defaultValuationValues.plot_no ?? "1").trim();
  const base = generateClientRefNumber(clientName, district, plotNo);
  const existing = await getRefNosStartingWith(base);
  let refNo = base;
  let n = 2;
  while (existing.includes(refNo)) {
    refNo = `${base}_${n}`;
    n += 1;
  }
  refNo = `${refNo}_${generateShortId()}`;
  const data = {
    ...defaultValuationValues,
    ref_no: refNo,
    valuation_date: defaultValuationValues.valuation_date ?? new Date(),
    latitude: defaultValuationValues.latitude ?? 27.7172,
    longitude: defaultValuationValues.longitude ?? 85.324,
  } as ValuationFormValues;
  return insertValuation(data, { employeeId: options?.employeeId });
}

// Update an existing valuation
export async function updateValuation(
  id: string,
  data: Partial<ValuationFormValues>,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  // Build dynamic update query based on provided fields
  const updates: string[] = ["updated_at = ?", "sync_status = ?"];
  const values: (string | number | null)[] = [now, "pending"];

  const fieldMappings: {
    key: keyof ValuationFormValues;
    column: string;
    transform?: (val: unknown) => string | number | null;
  }[] = [
    { key: "ref_no", column: "ref_no" },
    {
      key: "valuation_date",
      column: "valuation_date",
      transform: toISODateString,
    },
    { key: "branch", column: "branch" },
    { key: "client_name", column: "client_name" },
    { key: "contact_number", column: "contact_number" },
    { key: "client_address_nagrita", column: "client_address_nagrita" },
    { key: "owner_of_property", column: "owner_of_property" },
    { key: "property_address_deed", column: "property_address_deed" },
    { key: "plot_no", column: "plot_no" },
    { key: "present_property_address", column: "present_property_address" },
    { key: "district", column: "district" },
    { key: "valuation_for", column: "valuation_for" },
    { key: "road_type", column: "road_type" },
    { key: "road_type_others", column: "road_type_others" },
    { key: "road_width", column: "road_width" },
    { key: "access_road_direction", column: "access_road_direction" },
    { key: "access_road_direction_others", column: "access_road_direction_others" },
    { key: "property_area_length", column: "property_area_length" },
    {
      key: "property_frontage_direction",
      column: "property_frontage_direction",
    },
    { key: "property_narrowest_length", column: "property_narrowest_length" },
    {
      key: "property_narrowest_direction",
      column: "property_narrowest_direction",
    },
    {
      key: "right_of_way",
      column: "right_of_way",
      transform: (v) => (v ? 1 : 0),
    },
    { key: "right_of_way_width_ft", column: "right_of_way_width_ft" },
    {
      key: "motorable_access",
      column: "motorable_access",
      transform: (v) => (v ? 1 : 0),
    },
    {
      key: "electricity_available",
      column: "electricity_available",
      transform: (v) => (v ? 1 : 0),
    },
    {
      key: "drainage_near_property",
      column: "drainage_near_property",
      transform: (v) => (v ? 1 : 0),
    },
    { key: "property_type", column: "property_type" },
    { key: "property_ownership_type", column: "property_ownership_type" },
    {
      key: "ownership_transferred_through",
      column: "ownership_transferred_through",
    },
    { key: "hold_type", column: "hold_type" },
    { key: "land_rate_unit", column: "land_rate_unit" },
    { key: "commercial_rate_per_anna", column: "commercial_rate_per_anna" },
    { key: "government_rate_per_anna", column: "government_rate_per_anna" },
    { key: "building_type", column: "building_type" },
    { key: "building_purpose", column: "building_purpose" },
    { key: "number_of_storeys", column: "number_of_storeys" },
    { key: "storey_height", column: "storey_height" },
    { key: "building_age_years", column: "building_age_years" },
    {
      key: "building_rate_per_sqft",
      column: "building_rate_per_sqft",
      transform: (v) => (v != null && Array.isArray(v) ? JSON.stringify(v) : null),
    },
    {
      key: "completion_date",
      column: "completion_date",
      transform: toISODateString,
    },
    {
      key: "landslide_prone_area",
      column: "landslide_prone_area",
      transform: (v) => (v ? 1 : 0),
    },
    { key: "landslide_prone_area_setback", column: "landslide_prone_area_setback" },
    { key: "river_side", column: "river_side", transform: (v) => (v ? 1 : 0) },
    { key: "river_side_setback", column: "river_side_setback" },
    {
      key: "high_tension_area",
      column: "high_tension_area",
      transform: (v) => (v ? 1 : 0),
    },
    { key: "high_tension_area_setback", column: "high_tension_area_setback" },
    { key: "canal_area", column: "canal_area", transform: (v) => (v ? 1 : 0) },
    { key: "canal_area_setback", column: "canal_area_setback" },
    {
      key: "flood_prone_area",
      column: "flood_prone_area",
      transform: (v) => (v ? 1 : 0),
    },
    { key: "flood_prone_area_setback", column: "flood_prone_area_setback" },
    {
      key: "heritage_memorial_site",
      column: "heritage_memorial_site",
      transform: (v) => (v ? 1 : 0),
    },
    { key: "heritage_memorial_site_setback", column: "heritage_memorial_site_setback" },
    { key: "site_charge", column: "site_charge" },
    { key: "high_land_ft", column: "high_land_ft" },
    { key: "low_land_ft", column: "low_land_ft" },
    { key: "latitude", column: "latitude" },
    { key: "longitude", column: "longitude" },
    { key: "slope_degree", column: "slope_degree" },
    { key: "payment_cash", column: "payment_cash" },
    { key: "payment_online", column: "payment_online" },
    { key: "payment_online_mode", column: "payment_online_mode" },
    { key: "payment_pending_due", column: "payment_pending_due" },
    {
      key: "documents",
      column: "documents",
      transform: (v) => (v ? JSON.stringify(v) : null),
    },
    { key: "site_plan_note", column: "site_plan_note" },
    { key: "site_plan_drawing", column: "site_plan_image" },
    { key: "site_plan_plotter_data", column: "site_plan_plotter_data" },
    {
      key: "property_images",
      column: "property_images",
      transform: (v) => (v ? JSON.stringify(v) : null),
    },
    {
      key: "document_photos",
      column: "document_photos",
      transform: (v) => (v ? JSON.stringify(v) : null),
    },
    { key: "bank_name", column: "bank_name" },
    { key: "bank_branch_name", column: "bank_branch_name" },
    { key: "city", column: "city" },
    { key: "tole_area", column: "tole_area" },
    { key: "property_evaluation_data", column: "property_evaluation_data" },
  ];

  for (const mapping of fieldMappings) {
    if (mapping.key in data) {
      updates.push(`${mapping.column} = ?`);
      const value = data[mapping.key];
      values.push(
        mapping.transform
          ? mapping.transform(value)
          : (value as string | number | null) ?? null,
      );
    }
  }

  values.push(id);

  await db.runAsync(
    `UPDATE valuations SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );
}

// Get a valuation by ID
export async function getValuationById(
  id: string,
): Promise<ValuationRow | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<ValuationRow>(
    "SELECT * FROM valuations WHERE id = ?",
    [id],
  );
  return result ?? null;
}

// Get all valuations (filtered by creator when userId provided; empty when null)
export async function getAllValuations(
  userId: string | null,
): Promise<ValuationRow[]> {
  if (userId === null) return [];
  const db = await getDb();
  const results = await db.getAllAsync<ValuationRow>(
    "SELECT * FROM valuations WHERE employee_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return results;
}

// Get recent valuations (filtered by creator when userId provided; empty when null)
export async function getRecentValuations(
  userId: string | null,
): Promise<ValuationRow[]> {
  if (userId === null) return [];
  const db = await getDb();
  const results = await db.getAllAsync<ValuationRow>(
    "SELECT * FROM valuations WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10",
    [userId],
  );
  return results;
}

// Get valuations by status
export async function getValuationsByStatus(
  status: "draft" | "submitted" | "synced",
): Promise<ValuationRow[]> {
  const db = await getDb();
  const results = await db.getAllAsync<ValuationRow>(
    "SELECT * FROM valuations WHERE status = ? ORDER BY created_at DESC",
    [status],
  );
  return results;
}

// Type for valuation metrics
export interface ValuationMetrics {
  total: number;
  draft: number;
  submitted: number;
  synced: number;
}

// Get valuations metrics counts (filtered by creator when userId provided; zeros when null)
export async function getValuationsMetrics(
  userId: string | null,
): Promise<ValuationMetrics> {
  if (userId === null)
    return { total: 0, draft: 0, submitted: 0, synced: 0 };
  const db = await getDb();
  const result = await db.getFirstAsync<ValuationMetrics>(
    "SELECT COUNT(*) AS total, COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft, COUNT(CASE WHEN status = 'submitted' THEN 1 END) AS submitted, COUNT(CASE WHEN status = 'synced' THEN 1 END) AS synced FROM valuations WHERE employee_id = ?",
    [userId],
  );
  return result ?? { total: 0, draft: 0, submitted: 0, synced: 0 };
}

// Get ref_nos that start with the given prefix (for uniqueness when generating client ref no)
export async function getRefNosStartingWith(
  prefix: string,
  excludeValuationId?: string,
): Promise<string[]> {
  const db = await getDb();
  if (!prefix) return [];
  const likePattern =
    prefix.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_") +
    "%";
  const rows = excludeValuationId
    ? await db.getAllAsync<{ ref_no: string | null }>(
        "SELECT ref_no FROM valuations WHERE ref_no LIKE ? ESCAPE '\\' AND id != ?",
        [likePattern, excludeValuationId],
      )
    : await db.getAllAsync<{ ref_no: string | null }>(
        "SELECT ref_no FROM valuations WHERE ref_no LIKE ? ESCAPE '\\'",
        [likePattern],
      );
  return rows.map((r) => r.ref_no).filter((r): r is string => r != null);
}

// Get pending sync valuations (filtered by creator when userId provided; empty when null)
export async function getPendingSyncValuations(
  userId: string | null,
): Promise<ValuationRow[]> {
  if (userId === null) return [];
  const db = await getDb();
  const results = await db.getAllAsync<ValuationRow>(
    "SELECT * FROM valuations WHERE employee_id = ? AND sync_status = 'pending' ORDER BY created_at ASC",
    [userId],
  );
  return results;
}

// Get failed sync valuations (filtered by creator when userId provided; empty when null)
export async function getFailedSyncValuations(
  userId: string | null,
): Promise<ValuationRow[]> {
  if (userId === null) return [];
  const db = await getDb();
  const results = await db.getAllAsync<ValuationRow>(
    "SELECT * FROM valuations WHERE employee_id = ? AND sync_status = 'error' ORDER BY created_at ASC",
    [userId],
  );
  return results;
}

// Reset failed sync valuations to pending for retry (only for given user; no-op when null)
export async function resetFailedSyncValuations(
  userId: string | null,
): Promise<void> {
  if (userId === null) return;
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE valuations SET sync_status = 'pending', error_message = NULL, updated_at = ? WHERE employee_id = ? AND sync_status = 'error'",
    [now, userId],
  );
}

// Update valuation status
export async function updateValuationStatus(
  id: string,
  status: "pending" | "synced",
  syncStatus?: "pending" | "syncing" | "synced" | "error",
  errorMessage?: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const updates: string[] = ["status = ?", "updated_at = ?"];
  const values: (string | null)[] = [status, now];

  if (syncStatus) {
    updates.push("sync_status = ?");
    values.push(syncStatus);
  }

  if (status === "pending") {
    updates.push("submitted_at = ?");
    values.push(now);
  }

  if (syncStatus === "synced") {
    updates.push("synced_at = ?");
    values.push(now);
  }

  if (errorMessage !== undefined) {
    updates.push("error_message = ?");
    values.push(errorMessage);
  }

  values.push(id);

  await db.runAsync(
    `UPDATE valuations SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );
}

/** Update synced image hashes after a successful sync (so we can skip re-upload when unchanged). */
export async function updateSyncedImageHashes(
  valuationId: string,
  hashes: { propertyImages: string[]; sitePlan: string | null; documentPhotos: string[] },
): Promise<void> {
  const db = await getDb();
  const json = JSON.stringify(hashes);
  await db.runAsync(
    "UPDATE valuations SET synced_image_hashes = ?, updated_at = ? WHERE id = ?",
    [json, new Date().toISOString(), valuationId],
  );
}

/** Update server_id (Drive folder id/url) after successful sync. */
export async function updateValuationServerId(
  valuationId: string,
  serverId: string | null,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE valuations SET server_id = ?, updated_at = ? WHERE id = ?",
    [serverId, new Date().toISOString(), valuationId],
  );
}

// Delete a valuation
export async function deleteValuation(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM valuations WHERE id = ?", [id]);
  // Also delete associated images
  await db.runAsync("DELETE FROM valuation_images WHERE valuation_id = ?", [
    id,
  ]);
}

// Type for database row
export interface ValuationRow {
  id: string;
  server_id: string | null;
  employee_id: string | null;
  status: string;
  sync_status: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  synced_at: string | null;
  error_message: string | null;
  ref_no: string | null;
  valuation_date: string | null;
  branch: string | null;
  client_name: string | null;
  contact_number: string | null;
  client_address_nagrita: string | null;
  owner_of_property: string | null;
  property_address_deed: string | null;
  plot_no: string | null;
  present_property_address: string | null;
  district: string | null;
  valuation_for: string | null;
  road_type: string | null;
  road_type_others: string | null;
  road_width: number | null;
  access_road_direction: string | null;
  access_road_direction_others: string | null;
  property_area_length: number | null;
  property_frontage_direction: string | null;
  property_narrowest_length: number | null;
  property_narrowest_direction: string | null;
      right_of_way: number;
      right_of_way_width_ft: number | null;
  motorable_access: number;
  electricity_available: number;
  drainage_near_property: number;
  property_type: string | null;
  property_ownership_type: string | null;
  ownership_transferred_through: string | null;
  hold_type: string | null;
  land_rate_unit: string | null;
  commercial_rate_per_anna: number | null;
  government_rate_per_anna: number | null;
  building_type: string | null;
  building_purpose: string | null;
  number_of_storeys: number | null;
  storey_height: number | null;
  building_age_years: number | null;
  building_rate_per_sqft: string | null;
  completion_date: string | null;
  landslide_prone_area: number;
  landslide_prone_area_setback: number | null;
  river_side: number;
  river_side_setback: number | null;
  high_tension_area: number;
  high_tension_area_setback: number | null;
  canal_area: number;
  canal_area_setback: number | null;
  flood_prone_area: number;
  flood_prone_area_setback: number | null;
  heritage_memorial_site: number;
  heritage_memorial_site_setback: number | null;
  site_charge: number | null;
  high_land_ft: number | null;
  low_land_ft: number | null;
  latitude: number | null;
  longitude: number | null;
  slope_degree: number | null;
  payment_cash: number | null;
  payment_online: number | null;
  payment_online_mode: string | null;
  payment_pending_due: number | null;
  documents: string | null;
  site_plan_note: string | null;
  site_plan_image: string | null;
  site_plan_plotter_data: string | null;
  property_images: string | null;
  document_photos: string | null;
  bank_name: string | null;
  bank_branch_name: string | null;
  city: string | null;
  tole_area: string | null;
  synced_image_hashes: string | null;
  property_evaluation_data: string | null;
}

// Document keys expected by the form (after removing BPTM, renaming to Nirman Ijajat / Nirman Sampanna)
const DOCUMENT_KEYS = [
  "citizenship_client",
  "citizenship_owner",
  "lorc",
  "charkilla",
  "blueprint",
  "plot_utar",
  "nirman_ijajat",
  "nirman_sampanna",
  "building_drawing",
] as const;

const DEFAULT_DOC_ENTRY = { original: false, photocopy: false };

type DocEntry = { original: boolean; photocopy: boolean };

/** Normalize documents from DB or draft (old keys bptm, nirmal_*, nirmarn_*) to current form shape. */
export function normalizeDocumentsForForm(
  raw: unknown,
): ValuationFormValues["documents"] {
  const doc = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    { original?: boolean; photocopy?: boolean }
  >;
  const result: Record<string, DocEntry> = {};
  for (const key of DOCUMENT_KEYS) {
    result[key] = { ...DEFAULT_DOC_ENTRY };
  }
  // Merge blueprint with bptm (BPTM removed – same as Blueprint)
  const blueprint = doc.blueprint || doc.bptm;
  if (blueprint) {
    result.blueprint = {
      original: !!(result.blueprint?.original || blueprint.original),
      photocopy: !!(result.blueprint?.photocopy || blueprint.photocopy),
    };
  }
  // Map old keys to Nirman Ijajat / Nirman Sampanna
  const nirmanIjajat = doc.nirman_ijajat || doc.nirmal_lagat || doc.nirmarn_lagat;
  if (nirmanIjajat) {
    result.nirman_ijajat = {
      original: !!nirmanIjajat.original,
      photocopy: !!nirmanIjajat.photocopy,
    };
  }
  const nirmanSampanna =
    doc.nirman_sampanna || doc.nirmal_sangarna || doc.nirmarn_sangarna;
  if (nirmanSampanna) {
    result.nirman_sampanna = {
      original: !!nirmanSampanna.original,
      photocopy: !!nirmanSampanna.photocopy,
    };
  }
  // Copy over other known keys
  for (const key of [
    "citizenship_client",
    "citizenship_owner",
    "lorc",
    "charkilla",
    "plot_utar",
    "building_drawing",
  ] as const) {
    if (doc[key]) {
      result[key] = {
        original: !!doc[key].original,
        photocopy: !!doc[key].photocopy,
      };
    }
  }
  return result as ValuationFormValues["documents"];
}

// Convert database row to form values
export function rowToFormValues(
  row: ValuationRow,
): Partial<ValuationFormValues> {
  return {
    ref_no: row.ref_no ?? undefined,
    valuation_date: row.valuation_date
      ? new Date(row.valuation_date)
      : undefined,
    branch: row.branch ?? undefined,
    client_name: row.client_name ?? undefined,
    contact_number: row.contact_number ?? undefined,
    client_address_nagrita: row.client_address_nagrita ?? undefined,
    owner_of_property: row.owner_of_property ?? undefined,
    property_address_deed: row.property_address_deed ?? undefined,
    plot_no: row.plot_no ?? undefined,
    present_property_address: row.present_property_address ?? undefined,
    district: row.district ?? undefined,
    valuation_for: row.valuation_for as ValuationFormValues["valuation_for"],
    road_type: row.road_type as ValuationFormValues["road_type"],
    road_type_others: row.road_type_others ?? undefined,
    road_width: row.road_width ?? undefined,
    access_road_direction:
      row.access_road_direction as ValuationFormValues["access_road_direction"],
    access_road_direction_others: row.access_road_direction_others ?? undefined,
    property_area_length: row.property_area_length ?? undefined,
    property_frontage_direction:
      row.property_frontage_direction as ValuationFormValues["property_frontage_direction"],
    property_narrowest_length: row.property_narrowest_length ?? undefined,
    property_narrowest_direction:
      row.property_narrowest_direction as ValuationFormValues["property_narrowest_direction"],
    right_of_way: row.right_of_way === 1,
    right_of_way_width_ft: row.right_of_way_width_ft ?? undefined,
    right_of_way_m:
      row.right_of_way_width_ft != null
        ? [3, 4, 6, 8, 22, 50].includes(row.right_of_way_width_ft)
          ? String(row.right_of_way_width_ft)
          : "other"
        : "",
    motorable_access: row.motorable_access === 1,
    electricity_available: row.electricity_available === 1,
    drainage_near_property: row.drainage_near_property === 1,
    property_type: row.property_type as ValuationFormValues["property_type"],
    property_ownership_type:
      row.property_ownership_type as ValuationFormValues["property_ownership_type"],
    ownership_transferred_through:
      row.ownership_transferred_through as ValuationFormValues["ownership_transferred_through"],
    hold_type: row.hold_type as ValuationFormValues["hold_type"],
    land_rate_unit: (row.land_rate_unit as ValuationFormValues["land_rate_unit"]) ?? "anna",
    commercial_rate_per_anna: row.commercial_rate_per_anna ?? undefined,
    government_rate_per_anna: row.government_rate_per_anna ?? undefined,
    building_type: row.building_type as ValuationFormValues["building_type"],
    building_purpose:
      row.building_purpose as ValuationFormValues["building_purpose"],
    number_of_storeys: row.number_of_storeys ?? undefined,
    storey_height: row.storey_height ?? undefined,
    building_age_years: row.building_age_years ?? undefined,
    building_rate_per_sqft: row.building_rate_per_sqft
      ? normalizeBuildingRatePerSqftInput(JSON.parse(row.building_rate_per_sqft))
      : undefined,
    completion_date: row.completion_date
      ? new Date(row.completion_date)
      : undefined,
    landslide_prone_area: row.landslide_prone_area === 1,
    landslide_prone_area_setback: row.landslide_prone_area_setback ?? undefined,
    river_side: row.river_side === 1,
    river_side_setback: row.river_side_setback ?? undefined,
    high_tension_area: row.high_tension_area === 1,
    high_tension_area_setback: row.high_tension_area_setback ?? undefined,
    canal_area: row.canal_area === 1,
    canal_area_setback: row.canal_area_setback ?? undefined,
    flood_prone_area: row.flood_prone_area === 1,
    flood_prone_area_setback: row.flood_prone_area_setback ?? undefined,
    heritage_memorial_site: row.heritage_memorial_site === 1,
    heritage_memorial_site_setback: row.heritage_memorial_site_setback ?? undefined,
    site_charge: row.site_charge ?? undefined,
    high_land_ft: row.high_land_ft ?? undefined,
    low_land_ft: row.low_land_ft ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    slope_degree: row.slope_degree ?? undefined,
    payment_cash: row.payment_cash ?? undefined,
    payment_online: row.payment_online ?? undefined,
    payment_online_mode:
      row.payment_online_mode as ValuationFormValues["payment_online_mode"],
    payment_pending_due: row.payment_pending_due ?? undefined,
    documents: row.documents
      ? normalizeDocumentsForForm(JSON.parse(row.documents))
      : undefined,
    site_plan_note: row.site_plan_note ?? undefined,
    site_plan_drawing: row.site_plan_image ?? undefined,
    site_plan_plotter_data: row.site_plan_plotter_data ?? undefined,
    property_images: row.property_images
      ? JSON.parse(row.property_images)
      : undefined,
    document_photos: row.document_photos
      ? JSON.parse(row.document_photos)
      : undefined,
    bank_name: row.bank_name ?? undefined,
    bank_branch_name: row.bank_branch_name ?? undefined,
    city: row.city ?? undefined,
    tole_area: row.tole_area ?? undefined,
    property_evaluation_data: row.property_evaluation_data ?? undefined,
  };
}

export async function createValuationImagesTable() {
  const db = await getDb();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS valuation_images (
        id TEXT PRIMARY KEY,
        valuation_id TEXT,
        local_uri TEXT,
        remote_url TEXT,
        upload_status TEXT,
        captured_at TEXT,
        latitude TEXT,
        longitude TEXT,
        FOREIGN KEY (valuation_id) REFERENCES valuations(id)
    )`);
}

export async function createSyncQueue() {
  const db = await getDb();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT,
    entity_id TEXT,
    action TEXT,
    attempts INTEGER,
    last_attempt_at TEXT,
    status TEXT,
    error_message TEXT
  )`);
}

// ===== AUDIT LOGS =====

// Create audit_logs table
export async function createAuditLogsTable() {
  const db = await getDb();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    created_at TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  )`);
}

// Audit log entry type
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  synced: boolean;
}

// Insert an audit log entry
export async function insertAuditLog(
  userId: string,
  userName: string | null,
  userEmail: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>,
): Promise<string> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO audit_logs (id, user_id, user_name, user_email, action, entity_type, entity_id, details, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      userName ?? null,
      userEmail ?? null,
      action,
      entityType ?? null,
      entityId ?? null,
      details ? JSON.stringify(details) : null,
      now,
      0,
    ],
  );

  return id;
}

// Get all unsynced audit logs
export async function getUnsyncedAuditLogs(): Promise<AuditLogEntry[]> {
  const db = await getDb();
  const results = await db.getAllAsync<{
    id: string;
    user_id: string;
    user_name: string | null;
    user_email: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: string | null;
    created_at: string;
    synced: number;
  }>(`SELECT * FROM audit_logs WHERE synced = 0 ORDER BY created_at ASC`);

  return results.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: row.created_at,
    synced: row.synced === 1,
  }));
}

// Delete synced audit logs by IDs
export async function deleteAuditLogs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const db = await getDb();
  const placeholders = ids.map(() => "?").join(", ");
  await db.runAsync(
    `DELETE FROM audit_logs WHERE id IN (${placeholders})`,
    ids,
  );
}

// Mark audit logs as synced
export async function markAuditLogsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const db = await getDb();
  const placeholders = ids.map(() => "?").join(", ");
  await db.runAsync(
    `UPDATE audit_logs SET synced = 1 WHERE id IN (${placeholders})`,
    ids,
  );
}

// ===== PAYMENTS =====

// Create payments table
export async function createPaymentsTable() {
  const db = await getDb();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    valuation_id TEXT,
    pdf_uri TEXT,
    file_name TEXT,
    sync_status TEXT DEFAULT 'pending',
    remote_url TEXT,
    created_at TEXT,
    uploaded_at TEXT,
    FOREIGN KEY (valuation_id) REFERENCES valuations(id)
  )`);
}

// Payment row type
export interface PaymentRow {
  id: string;
  valuation_id: string;
  pdf_uri: string | null;
  file_name: string | null;
  sync_status: string;
  remote_url: string | null;
  created_at: string;
  uploaded_at: string | null;
}

// Insert a new payment
export async function insertPayment(
  valuationId: string,
  pdfUri: string,
  fileName: string,
): Promise<string> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO payments (id, valuation_id, pdf_uri, file_name, sync_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, valuationId, pdfUri, fileName, "pending", now],
  );

  return id;
}

// Get payments by valuation ID
export async function getPaymentsByValuationId(
  valuationId: string,
): Promise<PaymentRow[]> {
  const db = await getDb();
  const results = await db.getAllAsync<PaymentRow>(
    "SELECT * FROM payments WHERE valuation_id = ? ORDER BY created_at DESC",
    [valuationId],
  );
  return results;
}

// Get all pending sync payments
export async function getPendingSyncPayments(): Promise<PaymentRow[]> {
  const db = await getDb();
  const results = await db.getAllAsync<PaymentRow>(
    "SELECT * FROM payments WHERE sync_status = 'pending' ORDER BY created_at ASC",
  );
  return results;
}

// Update payment receipt (pdf_uri and file_name) for an existing payment
export async function updatePaymentReceipt(
  paymentId: string,
  pdfUri: string,
  fileName: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE payments SET pdf_uri = ?, file_name = ? WHERE id = ?",
    [pdfUri, fileName, paymentId],
  );
}

// Update payment sync status
export async function updatePaymentSyncStatus(
  id: string,
  status: "pending" | "syncing" | "synced" | "error",
  remoteUrl?: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  if (remoteUrl) {
    await db.runAsync(
      `UPDATE payments SET sync_status = ?, remote_url = ?, uploaded_at = ? WHERE id = ?`,
      [status, remoteUrl, now, id],
    );
  } else {
    await db.runAsync(`UPDATE payments SET sync_status = ? WHERE id = ?`, [
      status,
      id,
    ]);
  }
}

// Delete a payment
export async function deletePayment(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM payments WHERE id = ?", [id]);
}

// Delete payments by valuation ID
export async function deletePaymentsByValuationId(
  valuationId: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM payments WHERE valuation_id = ?", [
    valuationId,
  ]);
}
