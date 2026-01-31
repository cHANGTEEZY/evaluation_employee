import * as SQLite from "expo-sqlite";
import {
  createValuationTable,
  createValuationImagesTable,
  createSyncQueue,
  createAuditLogsTable,
  createPaymentsTable,
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

// Migration to add new columns for existing databases
async function runMigrations() {
  const database = await getDb();

  // List of new columns to add to valuations table
  const newColumns = [
    { name: "bank_name", type: "TEXT" },
    { name: "bank_branch_name", type: "TEXT" },
    { name: "city", type: "TEXT" },
    { name: "tole_area", type: "TEXT" },
    { name: "employee_id", type: "TEXT" },
  ];

  for (const column of newColumns) {
    try {
      await database.execAsync(
        `ALTER TABLE valuations ADD COLUMN ${column.name} ${column.type}`,
      );
      console.log(`Added column ${column.name} to valuations table`);
    } catch (error: any) {
      // Column already exists - that's fine, ignore error
      if (!error.message?.includes("duplicate column name")) {
        console.log(
          `Column ${column.name} may already exist or migration skipped`,
        );
      }
    }
  }
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
    await createPaymentsTable();

    // Run migrations for existing tables
    await runMigrations();

    isInitialized = true;
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
