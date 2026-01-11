import { getDb } from "./db";

/**
 * Ensures the `valuations` table exists in the database.
 *
 * Creates the table with columns: `id` (primary key), `serverid`, `organization_name`, `organization_address`, `organization_contact`, `branch_name`, `employee_name`, `employee_contact`, `employee_role`, `employee_branch`, `property_data`, `status`, `sync_status`, `created_at`, `updated_at`, `submitted_at`, `synced_at`, and `error_message`.
 */
export async function createValuationTable() {
  const db = await getDb();

  await db.execAsync(`CREATE TABLE IF NOT EXISTS valuations (
    id TEXT PRIMARY KEY,
    serverid TEXT,
    organization_name TEXT,
    organization_address TEXT,
    organization_contact TEXT,
    branch_name TEXT,
    employee_name TEXT,
    employee_contact TEXT,
    employee_role TEXT,
    employee_branch TEXT,
    property_data TEXT,
    status TEXT,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    submitted_at TEXT,
    synced_at TEXT,
    error_message TEXT
  )`);
}

/**
 * Ensures the `valuation_images` table exists in the database.
 *
 * Creates a table with columns: `id`, `valuation_id`, `local_uri`, `remote_url`,
 * `upload_status`, `captured_at`, `latitude`, and `longitude`, and a foreign key
 * constraint on `valuation_id` referencing `valuations(id)`.
 */
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

/**
 * Ensures the database contains a `sync_queue` table with the expected schema.
 *
 * Creates the `sync_queue` table if it does not exist with columns: `id` (primary key), `entity_type`, `entity_id`, `action`, `attempts`, `last_attempt_at`, `status`, and `error_message`.
 */
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