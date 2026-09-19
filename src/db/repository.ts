import * as Crypto from 'expo-crypto';
import type {
  BalanceEntry,
  BalanceEntryType,
  NewBalanceEntry,
  NewSpendEvent,
  SpendEvent,
} from '../models/types';
import { getDatabase } from './client';

type EntryRow = {
  id: string;
  type: string;
  merchant: string;
  accepting_stores_json: string;
  balance_cents: number;
  currency: string;
  expiry_at: string | null;
  code_note: string | null;
  created_at: string;
  updated_at: string;
};

type SpendRow = {
  id: string;
  entry_id: string;
  amount_cents: number;
  override: number;
  note: string | null;
  created_at: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

async function newId(): Promise<string> {
  return Crypto.randomUUID();
}

function mapEntry(row: EntryRow): BalanceEntry {
  let acceptingStores: string[] = [];
  try {
    const parsed = JSON.parse(row.accepting_stores_json);
    acceptingStores = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    acceptingStores = [];
  }
  return {
    id: row.id,
    type: row.type as BalanceEntryType,
    merchant: row.merchant,
    acceptingStores,
    balanceCents: row.balance_cents,
    currency: row.currency,
    expiryAt: row.expiry_at,
    codeNote: row.code_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSpend(row: SpendRow): SpendEvent {
  return {
    id: row.id,
    entryId: row.entry_id,
    amountCents: row.amount_cents,
    override: row.override === 1,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function listEntries(): Promise<BalanceEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT * FROM balance_entries ORDER BY updated_at DESC`,
  );
  return rows.map(mapEntry);
}

export async function getEntry(id: string): Promise<BalanceEntry | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EntryRow>(
    `SELECT * FROM balance_entries WHERE id = ?`,
    [id],
  );
  return row ? mapEntry(row) : null;
}

export async function createEntry(input: NewBalanceEntry): Promise<BalanceEntry> {
  const db = await getDatabase();
  const id = input.id ?? (await newId());
  const ts = nowIso();
  await db.runAsync(
    `INSERT INTO balance_entries (
      id, type, merchant, accepting_stores_json, balance_cents, currency,
      expiry_at, code_note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.type,
      input.merchant,
      JSON.stringify(input.acceptingStores ?? []),
      input.balanceCents,
      input.currency,
      input.expiryAt,
      input.codeNote,
      ts,
      ts,
    ],
  );
  const created = await getEntry(id);
  if (!created) throw new Error('Failed to create balance entry');
  return created;
}

export async function updateEntry(
  id: string,
  patch: Partial<Omit<BalanceEntry, 'id' | 'createdAt'>>,
): Promise<BalanceEntry> {
  const existing = await getEntry(id);
  if (!existing) throw new Error(`Entry not found: ${id}`);

  const next: BalanceEntry = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
  };

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE balance_entries SET
      type = ?, merchant = ?, accepting_stores_json = ?, balance_cents = ?,
      currency = ?, expiry_at = ?, code_note = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.type,
      next.merchant,
      JSON.stringify(next.acceptingStores ?? []),
      next.balanceCents,
      next.currency,
      next.expiryAt,
      next.codeNote,
      next.updatedAt,
      id,
    ],
  );
  return next;
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM balance_entries WHERE id = ?`, [id]);
}

export async function listSpendEvents(entryId: string): Promise<SpendEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SpendRow>(
    `SELECT * FROM spend_events WHERE entry_id = ? ORDER BY created_at DESC`,
    [entryId],
  );
  return rows.map(mapSpend);
}

/**
 * Records a partial spend. If post-balance would be < 0, `override` must be true (Q1).
 * Does not clamp UI/balance to zero — negatives are allowed after override.
 */
export async function recordSpend(input: NewSpendEvent): Promise<{
  entry: BalanceEntry;
  event: SpendEvent;
}> {
  if (input.amountCents <= 0) {
    throw new Error('amountCents must be > 0');
  }

  const db = await getDatabase();
  const entry = await getEntry(input.entryId);
  if (!entry) throw new Error(`Entry not found: ${input.entryId}`);

  const nextBalance = entry.balanceCents - input.amountCents;
  if (nextBalance < 0 && !input.override) {
    throw new Error('NEGATIVE_BALANCE_REQUIRES_OVERRIDE');
  }

  const eventId = await newId();
  const ts = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO spend_events (id, entry_id, amount_cents, override, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        input.entryId,
        input.amountCents,
        input.override ? 1 : 0,
        input.note ?? null,
        ts,
      ],
    );
    await db.runAsync(
      `UPDATE balance_entries SET balance_cents = ?, updated_at = ? WHERE id = ?`,
      [nextBalance, ts, input.entryId],
    );
  });

  const updated = await getEntry(input.entryId);
  if (!updated) throw new Error('Entry missing after spend');

  return {
    entry: updated,
    event: {
      id: eventId,
      entryId: input.entryId,
      amountCents: input.amountCents,
      override: input.override,
      note: input.note ?? null,
      createdAt: ts,
    },
  };
}

/** Entries with expiry_at on or before `isoDate` (inclusive), for ME-6 soon-expiring. */
export async function listExpiringOnOrBefore(isoDate: string): Promise<BalanceEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT * FROM balance_entries
     WHERE expiry_at IS NOT NULL AND expiry_at <= ?
     ORDER BY expiry_at ASC`,
    [isoDate],
  );
  return rows.map(mapEntry);
}
