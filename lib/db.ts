import * as SQLite from "expo-sqlite";

const DB_NAME = "evaluation_db";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
}
