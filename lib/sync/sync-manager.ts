import { getDb } from "../db";
import {
  getPendingSyncValuations,
  updateValuationStatus,
  type ValuationRow,
} from "../schema";
import { useSyncStore, type SyncQueueItem } from "./sync-store";

// API base URL from auth-client
const API_BASE_URL = "https://evaluationbackend-production.up.railway.app";

// Maximum retry attempts
const MAX_RETRY_ATTEMPTS = 3;

// Exponential backoff delays (in ms)
const BACKOFF_DELAYS = [1000, 5000, 15000];

/**
 * Convert valuation row to API payload
 */
function valuationToPayload(valuation: ValuationRow): Record<string, unknown> {
  return {
    id: valuation.id,
    ref_no: valuation.ref_no,
    valuation_date: valuation.valuation_date,
    branch: valuation.branch,
    client_name: valuation.client_name,
    contact_number: valuation.contact_number,
    client_address_nagrita: valuation.client_address_nagrita,
    owner_of_property: valuation.owner_of_property,
    property_address_deed: valuation.property_address_deed,
    plot_no: valuation.plot_no,
    present_property_address: valuation.present_property_address,
    district: valuation.district,
    valuation_for: valuation.valuation_for,
    road_type: valuation.road_type,
    road_width: valuation.road_width,
    access_road_direction: valuation.access_road_direction,
    property_area_length: valuation.property_area_length,
    property_frontage_direction: valuation.property_frontage_direction,
    property_narrowest_length: valuation.property_narrowest_length,
    property_narrowest_direction: valuation.property_narrowest_direction,
    right_of_way: valuation.right_of_way === 1,
    motorable_access: valuation.motorable_access === 1,
    electricity_available: valuation.electricity_available === 1,
    drainage_near_property: valuation.drainage_near_property === 1,
    property_type: valuation.property_type,
    property_ownership_type: valuation.property_ownership_type,
    ownership_transferred_through: valuation.ownership_transferred_through,
    hold_type: valuation.hold_type,
    commercial_rate_per_anna: valuation.commercial_rate_per_anna,
    government_rate_per_anna: valuation.government_rate_per_anna,
    building_type: valuation.building_type,
    building_purpose: valuation.building_purpose,
    number_of_storeys: valuation.number_of_storeys,
    storey_height: valuation.storey_height,
    building_age_years: valuation.building_age_years,
    completion_date: valuation.completion_date,
    landslide_prone_area: valuation.landslide_prone_area === 1,
    river_side: valuation.river_side === 1,
    high_tension_area: valuation.high_tension_area === 1,
    canal_area: valuation.canal_area === 1,
    site_charge: valuation.site_charge,
    high_land_ft: valuation.high_land_ft,
    low_land_ft: valuation.low_land_ft,
    latitude: valuation.latitude,
    longitude: valuation.longitude,
    slope_degree: valuation.slope_degree,
    documents: valuation.documents ? JSON.parse(valuation.documents) : null,
    site_plan_note: valuation.site_plan_note,
    status: valuation.status,
    created_at: valuation.created_at,
    updated_at: valuation.updated_at,
    submitted_at: valuation.submitted_at,
  };
}

/**
 * Sync a single valuation to the server
 */
export async function syncValuation(
  valuation: ValuationRow,
  authToken?: string
): Promise<{ success: boolean; error?: string; serverId?: string }> {
  try {
    const payload = valuationToPayload(valuation);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/valuations`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      return { success: false, error: "Session expired. Please log in again." };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Server error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, serverId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Add an item to the sync queue
 */
export async function addToSyncQueue(
  entityType: "valuation" | "image",
  entityId: string,
  action: "create" | "update" | "delete"
): Promise<string> {
  const db = await getDb();
  const id = `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, action, attempts, last_attempt_at, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, entityType, entityId, action, 0, now, "pending", null]
  );

  return id;
}

//!* Get all pending sync queue items
export async function getSyncQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  const results = await db.getAllAsync<{
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    attempts: number;
    last_attempt_at: string | null;
    status: string;
    error_message: string | null;
  }>(
    `SELECT * FROM sync_queue WHERE status != 'completed' ORDER BY last_attempt_at ASC`
  );

  return results.map((row) => ({
    id: row.id,
    entityType: row.entity_type as "valuation" | "image",
    entityId: row.entity_id,
    action: row.action as "create" | "update" | "delete",
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    status: row.status as "pending" | "in_progress" | "completed" | "failed",
    errorMessage: row.error_message,
  }));
}

//!* Get failed sync queue items
export async function getFailedSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  const results = await db.getAllAsync<{
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    attempts: number;
    last_attempt_at: string | null;
    status: string;
    error_message: string | null;
  }>(
    `SELECT * FROM sync_queue WHERE status = 'failed' ORDER BY last_attempt_at ASC`
  );

  return results.map((row) => ({
    id: row.id,
    entityType: row.entity_type as "valuation" | "image",
    entityId: row.entity_id,
    action: row.action as "create" | "update" | "delete",
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    status: row.status as "pending" | "in_progress" | "completed" | "failed",
    errorMessage: row.error_message,
  }));
}

//!* Update sync queue item status
export async function updateSyncQueueItem(
  id: string,
  status: "pending" | "in_progress" | "completed" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  if (errorMessage !== undefined) {
    await db.runAsync(
      `UPDATE sync_queue SET status = ?, error_message = ?, last_attempt_at = ?, attempts = attempts + 1 WHERE id = ?`,
      [status, errorMessage, now, id]
    );
  } else {
    await db.runAsync(
      `UPDATE sync_queue SET status = ?, last_attempt_at = ? WHERE id = ?`,
      [status, now, id]
    );
  }
}

//!* Remove completed sync queue item
export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}

//!* Reset failed items to pending for retry
export async function resetFailedItems(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE sync_queue SET status = 'pending', error_message = NULL WHERE status = 'failed' AND attempts < ?`,
    [MAX_RETRY_ATTEMPTS]
  );
}

/**
 * Process the entire sync queue
 */
export async function processQueue(authToken?: string): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const store = useSyncStore.getState();

  if (store.isSyncing) {
    return { synced: 0, failed: 0, errors: ["Sync already in progress"] };
  }

  if (!store.isOnline) {
    return { synced: 0, failed: 0, errors: ["No network connection"] };
  }

  // Get pending valuations
  const pendingValuations = await getPendingSyncValuations();

  if (pendingValuations.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  store.startSync();
  store.updateProgress(0, pendingValuations.length);

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < pendingValuations.length; i++) {
    const valuation = pendingValuations[i];

    // Update progress
    store.updateProgress(i + 1, pendingValuations.length);

    // Mark as syncing
    await updateValuationStatus(
      valuation.id,
      valuation.status as "draft" | "submitted" | "synced",
      "syncing"
    );

    // Attempt sync
    const result = await syncValuation(valuation, authToken);

    if (result.success) {
      // Mark as synced
      await updateValuationStatus(valuation.id, "synced", "synced");
      synced++;
    } else {
      // Mark as error
      await updateValuationStatus(
        valuation.id,
        valuation.status as "draft" | "submitted" | "synced",
        "error",
        result.error
      );
      failed++;
      errors.push(`${valuation.client_name || "Unknown"}: ${result.error}`);
    }
  }

  store.stopSync();
  store.setLastSyncedAt(new Date().toISOString());

  // Refresh pending/failed items in store
  const queueItems = await getSyncQueueItems();
  store.setPendingItems(queueItems.filter((item) => item.status === "pending"));
  store.setFailedItems(queueItems.filter((item) => item.status === "failed"));

  return { synced, failed, errors };
}

/**
 * Retry all failed sync items
 */
export async function retryFailedSync(authToken?: string): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  await resetFailedItems();
  return processQueue(authToken);
}
