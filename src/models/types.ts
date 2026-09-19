export type BalanceEntryType = 'gift_card' | 'store_credit' | 'voucher' | 'other';

export type BalanceEntry = {
  id: string;
  type: BalanceEntryType;
  merchant: string;
  acceptingStores: string[];
  /** Integer minor units; may be negative after an overridden spend. */
  balanceCents: number;
  /** ISO 4217 */
  currency: string;
  /** ISO date (YYYY-MM-DD) or null */
  expiryAt: string | null;
  codeNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SpendEvent = {
  id: string;
  entryId: string;
  amountCents: number;
  /** true when confirm dialog allowed post-balance < 0 */
  override: boolean;
  note: string | null;
  createdAt: string;
};

export type NewBalanceEntry = Omit<BalanceEntry, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type NewSpendEvent = {
  entryId: string;
  amountCents: number;
  override: boolean;
  note?: string | null;
};
