import type { SQLiteDatabase } from 'expo-sqlite';

/** Schema v1 — locked with Eng (no balance≥0 CHECK; indexes for history + expiry). */
export const SCHEMA_VERSION = 1;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS balance_entries (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('gift_card','store_credit','voucher','other')),
        merchant TEXT NOT NULL,
        accepting_stores_json TEXT NOT NULL DEFAULT '[]',
        balance_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        expiry_at TEXT,
        code_note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS spend_events (
        id TEXT PRIMARY KEY NOT NULL,
        entry_id TEXT NOT NULL REFERENCES balance_entries(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        override INTEGER NOT NULL DEFAULT 0 CHECK (override IN (0, 1)),
        note TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_spend_events_entry_id ON spend_events(entry_id);
      CREATE INDEX IF NOT EXISTS idx_balance_entries_expiry_at ON balance_entries(expiry_at);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}
