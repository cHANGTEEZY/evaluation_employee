import * as SQLite from "expo-sqlite";
import {
  createValuationTable,
  createValuationImagesTable,
  createSyncQueue,
  createAuditLogsTable,
} from "./schema";

const DB_NAME = "evaluation_db";

let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
}

export async function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  try {
    console.log("Initializing database...");

    // Ensure database is opened
    await getDb();

    // Create all tables
    await createValuationTable();
    await createValuationImagesTable();
    await createSyncQueue();
    await createAuditLogsTable();

    isInitialized = true;
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
