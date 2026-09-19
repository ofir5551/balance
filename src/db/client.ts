import * as SQLite from 'expo-sqlite';

const DB_NAME = 'balance.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (and caches) the local SQLite database.
 * Full schema/migrations land in ME-2 — ME-1 only proves the DB opens.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function pingDatabase(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ ok: number }>('SELECT 1 AS ok');
  return row?.ok === 1;
}
