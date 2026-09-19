# db

- `client.ts` — open DB + migrate
- `migrations.ts` — schema v1 (no balance≥0 CHECK; indexes on spend entry_id + expiry_at)
- `repository.ts` — CRUD + `recordSpend` (requires override when post-balance < 0)
