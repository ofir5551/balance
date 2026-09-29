# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bash scripts/restore-assets.sh` — regenerates placeholder icons in `assets/` (gitignored; run once after clone, before `expo start`)
- `npm install`, then `npm start` (`expo start`); `npm run android|ios|web`
- Typecheck: `npx tsc --noEmit`
- No test runner or linter is configured.
- Builds: `eas build --profile preview --platform android` (sideloadable APK); profiles in `eas.json`.

## Architecture

Offline-first Expo (managed) + TypeScript app tracking gift cards / store credit. Everything is local; no backend.

- `App.tsx` — native-stack navigation (Home → Detail → EditEntry), `KeyboardProvider`, and schedules the weekly expiry notification on mount. Route params are typed in `src/screens/types.ts`.
- `src/db/` — `expo-sqlite`. `client.ts` opens DB and runs `migrations.ts` (versioned via `PRAGMA user_version`; bump `SCHEMA_VERSION` and add an `if (current < N)` block for schema changes). All queries go through `repository.ts`.
- Money is stored as integer cents (`balance_cents`, `amount_cents`) with a `currency` column. Balances are intentionally allowed to go **negative**: `recordSpend` requires an explicit override when post-balance < 0, and the UI must not clamp negatives.
- `spend_events` are child rows of `balance_entries` (ON DELETE CASCADE, foreign keys enabled via PRAGMA).
- `src/i18n/` — `i18n-js` with device locale, EN and HE. Use `t('key')` for all user-facing strings.
- **RTL is handled manually**: `App.tsx` pins `I18nManager` to LTR (`allowRTL(false)`), and Hebrew layout flips (rows, chips, FAB side) are applied via `isRtl()`. Don't rely on native RTL or you'll double-flip.
- `src/notifications/weeklyExpiry.ts` — local weekly reminder (Sunday 18:00 device-local) for entries expiring within `SOON_EXPIRING_DAYS` (`src/constants.ts`).
- `src/components/` — shared helpers (`expiry.ts`, `expiryPresets.ts`, `format.ts`).

## Conventions

- Work is tracked by tickets (`ME-n`); commits use `fix(ME-n): ...` / `feat(ME-n): ...` and land via PRs to `main`.
