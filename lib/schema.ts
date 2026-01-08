import { getDb } from "./db";

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
