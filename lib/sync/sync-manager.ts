import { getDb } from "../db";
import {
  getPendingSyncValuations,
  getFailedSyncValuations,
  resetFailedSyncValuations,
  updateValuationStatus,
  getUnsyncedAuditLogs,
  deleteAuditLogs,
  getPaymentsByValuationId,
  updatePaymentSyncStatus,
  updateSyncedImageHashes,
  updateValuationServerId,
  type ValuationRow,
  type AuditLogEntry,
} from "../schema";
import { useSyncStore, type SyncQueueItem } from "./sync-store";
import { BASE_API_URL, ADMIN_SESSION_COOKIE_NAME } from "../../constants";
import { File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { sha256Hex, parseSyncedImageHashes, imageHashesMatch, type SyncedImageHashes } from "../hash";

// Maximum retry attempts
const MAX_RETRY_ATTEMPTS = 3;

// Exponential backoff delays (in ms)
const BACKOFF_DELAYS = [1000, 5000, 15000];

//* Convert valuations to api
function valuationToPayload(valuation: ValuationRow): Record<string, unknown> {
  return {
    id: valuation.id,
    employee_id: valuation.employee_id ?? undefined,
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
    road_type_others: valuation.road_type_others ?? undefined,
    road_width: valuation.road_width,
    access_road_direction: valuation.access_road_direction,
    access_road_direction_others: valuation.access_road_direction_others ?? undefined,
    property_area_length: valuation.property_area_length,
    property_frontage_direction: valuation.property_frontage_direction,
    property_narrowest_length: valuation.property_narrowest_length,
    property_narrowest_direction: valuation.property_narrowest_direction,
    right_of_way: valuation.right_of_way === 1,
    right_of_way_width_ft: valuation.right_of_way_width_ft ?? undefined,
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
    landslide_prone_area_setback: valuation.landslide_prone_area_setback ?? undefined,
    river_side: valuation.river_side === 1,
    river_side_setback: valuation.river_side_setback ?? undefined,
    high_tension_area: valuation.high_tension_area === 1,
    high_tension_area_setback: valuation.high_tension_area_setback ?? undefined,
    canal_area: valuation.canal_area === 1,
    canal_area_setback: valuation.canal_area_setback ?? undefined,
    flood_prone_area: valuation.flood_prone_area === 1,
    flood_prone_area_setback: valuation.flood_prone_area_setback ?? undefined,
    heritage_memorial_site: valuation.heritage_memorial_site === 1,
    heritage_memorial_site_setback: valuation.heritage_memorial_site_setback ?? undefined,
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
    // Bank/Location for folder structure
    bank_name: valuation.bank_name,
    bank_branch_name: valuation.bank_branch_name,
    city: valuation.city,
    tole_area: valuation.tole_area,
    payment_cash: valuation.payment_cash ?? undefined,
    payment_online: valuation.payment_online ?? undefined,
    payment_online_mode: valuation.payment_online_mode ?? undefined,
    payment_pending_due: valuation.payment_pending_due ?? undefined,
    document_photos: valuation.document_photos
      ? JSON.parse(valuation.document_photos)
      : undefined,
    property_evaluation_data: valuation.property_evaluation_data
      ? JSON.parse(valuation.property_evaluation_data)
      : undefined,
  };
}

// Helper to read file as base64 (images and PDFs). Uses legacy API as fallback so PDFs from documentDirectory paths are read correctly.
async function fileToBase64(uri: string): Promise<string | null> {
  try {
    const file = new File(uri);
    if (file.exists) {
      const base64 = await file.base64();
      if (base64) return base64;
    }
  } catch (e) {
    console.warn(`File API read failed for ${uri}, trying legacy:`, e);
  }
  try {
    const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    });
    return base64 || null;
  } catch (error) {
    console.error(`Error reading file as base64 ${uri}:`, error);
    return null;
  }
}

// Sync single valuation to server with images
export async function syncValuation(
  valuation: ValuationRow,
  authToken?: string,
): Promise<{
  success: boolean;
  error?: string;
  serverId?: string;
  paymentIds?: string[];
}> {
  try {
    const payload = valuationToPayload(valuation);

    // Read all images and compute hashes for change detection
    let sitePlanImage: string | null = null;
    const propertyImages: string[] = [];
    const documentImages: string[] = [];

    if (valuation.site_plan_image) {
      sitePlanImage = await fileToBase64(valuation.site_plan_image);
    }
    if (valuation.property_images) {
      const imageUris = JSON.parse(valuation.property_images) as string[];
      for (const uri of imageUris) {
        const base64 = await fileToBase64(uri);
        if (base64) propertyImages.push(base64);
      }
    }
    if (valuation.document_photos) {
      const docUris = JSON.parse(valuation.document_photos) as string[];
      for (const uri of docUris) {
        const base64 = await fileToBase64(uri);
        if (base64) documentImages.push(base64);
      }
    }

    // Compute hashes (same order as payload) for comparison with last sync
    const currentHashes: SyncedImageHashes = {
      propertyImages: await Promise.all(propertyImages.map((b) => sha256Hex(b))),
      sitePlan: sitePlanImage ? await sha256Hex(sitePlanImage) : null,
      documentPhotos: await Promise.all(documentImages.map((b) => sha256Hex(b))),
    };
    const storedHashes = parseSyncedImageHashes(valuation.synced_image_hashes ?? null);
    const imagesUnchanged = imageHashesMatch(storedHashes, currentHashes);

    // When images unchanged, send empty image payloads to save bandwidth; backend will skip upload
    const bodySitePlanImage = imagesUnchanged ? null : sitePlanImage;
    const bodyPropertyImages = imagesUnchanged ? [] : propertyImages;
    const bodyDocumentImages = imagesUnchanged ? [] : documentImages;

    // Prepare payment receipts
    const paymentReceipts: { id: string; content: string; name: string }[] = [];
    const payments = await getPaymentsByValuationId(valuation.id);
    const paymentIds: string[] = [];

    for (const payment of payments) {
      if (payment.pdf_uri) {
        const base64 = await fileToBase64(payment.pdf_uri);
        if (base64) {
          paymentReceipts.push({
            id: payment.id,
            content: base64,
            name: payment.file_name || `receipt_${payment.id}.pdf`,
          });
          paymentIds.push(payment.id);
        }
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Cookie"] = `${ADMIN_SESSION_COOKIE_NAME}=${authToken}`;
      console.log("[SYNC] Auth token present, length:", authToken.length);
    } else {
      console.log("[SYNC] WARNING: No auth token provided!");
    }

    console.log(
      "[SYNC] Sending request to:",
      `${BASE_API_URL}/api/sync/valuation`,
      imagesUnchanged ? "(images unchanged, skipping upload)" : ""
    );

    const response = await fetch(`${BASE_API_URL}/api/sync/valuation`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        valuation: payload,
        sitePlanImage: bodySitePlanImage,
        propertyImages: bodyPropertyImages,
        documentImages: bodyDocumentImages,
        paymentReceipts,
        imagesUnchanged,
      }),
    });

    console.log("[SYNC] Response status:", response.status);

    if (response.status === 401) {
      const errorBody = await response.text();
      console.log("[SYNC] 401 Error body:", errorBody);
      return { success: false, error: "Session expired. Please log in again." };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("[SYNC] Error response:", JSON.stringify(errorData));
      return {
        success: false,
        error:
          errorData.error ||
          errorData.message ||
          `Server error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log("[SYNC] Success!");

    // Persist server metadata and image hashes after successful sync
    const serverId = data.evaluationFolderId ?? data.driveFolderId ?? null;
    if (serverId) {
      await updateValuationServerId(valuation.id, serverId);
    }
    if (!imagesUnchanged) {
      await updateSyncedImageHashes(valuation.id, currentHashes);
    }

    return { success: true, serverId, paymentIds };
  } catch (error: any) {
    console.log("[SYNC] Exception:", error);
    return {
      success: false,
      error:
        error?.message ||
        (error instanceof Error ? error.message : "Network error"),
    };
  }
}

//* Add item to scync queue
export async function addToSyncQueue(
  entityType: "valuation" | "image",
  entityId: string,
  action: "create" | "update" | "delete",
): Promise<string> {
  const db = await getDb();
  const id = `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, action, attempts, last_attempt_at, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, entityType, entityId, action, 0, now, "pending", null],
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
    `SELECT * FROM sync_queue WHERE status != 'completed' ORDER BY last_attempt_at ASC`,
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
    `SELECT * FROM sync_queue WHERE status = 'failed' ORDER BY last_attempt_at ASC`,
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
  errorMessage?: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  if (errorMessage !== undefined) {
    await db.runAsync(
      `UPDATE sync_queue SET status = ?, error_message = ?, last_attempt_at = ?, attempts = attempts + 1 WHERE id = ?`,
      [status, errorMessage, now, id],
    );
  } else {
    await db.runAsync(
      `UPDATE sync_queue SET status = ?, last_attempt_at = ? WHERE id = ?`,
      [status, now, id],
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
    [MAX_RETRY_ATTEMPTS],
  );
}

//* Process the entire sync queue (only current user's pending valuations when userId provided)
export async function processQueue(
  authToken?: string,
  userId?: string | null,
): Promise<{
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

  // Get pending valuations for the current user only
  const pendingValuations = await getPendingSyncValuations(userId ?? null);

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
      valuation.status as "pending" | "synced",
      "syncing",
    );

    // Attempt sync
    const result = await syncValuation(valuation, authToken);

    if (result.success) {
      // Mark as synced
      await updateValuationStatus(valuation.id, "synced", "synced");

      // Mark payments as synced
      if (result.paymentIds) {
        for (const paymentId of result.paymentIds) {
          await updatePaymentSyncStatus(paymentId, "synced");
        }
      }

      synced++;
    } else {
      // Mark as error
      await updateValuationStatus(
        valuation.id,
        valuation.status as "pending" | "synced",
        "error",
        result.error,
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

//* Retry all failed sync valuations (only current user's when userId provided)
export async function retryFailedSync(
  authToken?: string,
  userId?: string | null,
): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  // Reset only this user's failed valuations to pending
  await resetFailedSyncValuations(userId ?? null);
  // Also reset failed items in sync queue
  await resetFailedItems();
  // Process the queue
  return processQueue(authToken, userId);
}

// ===== AUDIT LOG SYNC =====

// Sync audit logs to Google Sheets and delete after sync
export async function syncAuditLogs(
  authToken?: string,
): Promise<{ synced: number; error?: string }> {
  try {
    // Get unsynced audit logs
    const auditLogs = await getUnsyncedAuditLogs();

    if (auditLogs.length === 0) {
      console.log("[AUDIT] No audit logs to sync");
      return { synced: 0 };
    }

    console.log(`[AUDIT] Syncing ${auditLogs.length} audit logs...`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Cookie"] = `${ADMIN_SESSION_COOKIE_NAME}=${authToken}`;
    }

    const response = await fetch(`${BASE_API_URL}/api/sync/audit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ auditLogs }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("[AUDIT] Sync failed:", errorData);
      return {
        synced: 0,
        error: errorData.error || `Server error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log(`[AUDIT] Synced ${data.syncedCount} audit logs`);

    // Delete synced audit logs from local database
    if (data.syncedIds && data.syncedIds.length > 0) {
      await deleteAuditLogs(data.syncedIds);
      console.log(
        `[AUDIT] Deleted ${data.syncedIds.length} synced logs from local DB`,
      );
    }

    return { synced: data.syncedCount };
  } catch (error: any) {
    console.error("[AUDIT] Sync error:", error);
    return {
      synced: 0,
      error: error?.message || "Failed to sync audit logs",
    };
  }
}
