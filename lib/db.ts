import * as SQLite from "expo-sqlite";

const DB_NAME = "evaluation_db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get the singleton SQLite database instance for the app.
 *
 * Initializes the database on first call and returns the same instance thereafter.
 *
 * @returns The initialized `SQLite.SQLiteDatabase` instance
 */
export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
}