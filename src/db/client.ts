import * as SQLite from 'expo-sqlite';
import { migrate } from './migrations';

const DB_NAME = 'balance.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (and caches) the local SQLite database, running migrations once.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function pingDatabase(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ ok: number }>('SELECT 1 AS ok');
  return row?.ok === 1;
}
