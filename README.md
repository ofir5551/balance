# Balance

Personal **offline-first** gift-card & store-credit tracker.

**Stack:** Expo (managed) + TypeScript · `expo-sqlite` · `expo-notifications` (ME-6 weekly Sunday 18:00 local) · on-device Settings (ME-12: language EN/HE, appearance Light/Dark via AsyncStorage)

## Prerequisites

- Node.js 20.19.4+ (or 22+)
- npm
- [Expo Go](https://expo.dev/go) on a phone **or** EAS Build for a native binary
- [EAS CLI](https://docs.expo.dev/eas/): `npm i -g eas-cli` and `eas login`

## Local run

```bash
bash scripts/restore-assets.sh   # placeholder icons
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

Scripts: `npm run android` · `npm run ios` · `npm run web`

## Settings (ME-12)

Home header **gear** opens Settings. Preferences apply on tap and persist locally (`@react-native-async-storage/async-storage`) — no balance DB schema change.

| Setting | Options |
|---------|---------|
| Language | EN · HE |
| Appearance | Light · Dark |

### Language / RTL

- Choosing **HE** switches strings immediately and flips layout via `isRtl()` (rows, chips, FAB, trailing gear side).
- Yoga stays LTR (`I18nManager.allowRTL(false)`) so those manual flips are not double-applied.
- **Expo Go note:** `I18nManager.forceRTL` / native layout direction often needs a full reload. We do **not** rely on forceRTL for v1; UI updates immediately through `isRtl()` + themed screens.

## Android — preview APK (sideload)

1. `eas build --profile preview --platform android`
2. Download the APK from the EAS build page
3. Sideload: transfer to the device and open, or  
   `adb install path/to/balance.apk`

`preview` in `eas.json` sets `"buildType": "apk"` for sideload-friendly artifacts.

## iOS — real device

**Option A — Expo Go (fastest for ME-1):**  
`npx expo start` and open the project in Expo Go on a physical iPhone.

**Option B — development / preview build (closer to production):**

1. Configure the Apple team in `eas.json` / Expo dashboard (`eas build:configure` if needed)
2. Development client: `eas build --profile development --platform ios`  
   or internal preview: `eas build --profile preview --platform ios`
3. Install via the EAS install link / QR on the device (Ad Hoc / internal distribution)

A Mac is required only if you build with Xcode locally; EAS cloud builds do not need a local Mac.

## Project layout

```
src/
  db/            # SQLite client (schema/migrations in ME-2)
  models/        # BalanceEntry, SpendEvent (ME-2)
  screens/       # list / detail / forms / Settings (ME-12)
  components/    # shared UI
  settings/      # prefs + SettingsContext (AsyncStorage)
  theme/         # light/dark color tokens
  notifications/ # ME-6 weekly expiry reminder
  i18n/          # EN + HE strings
App.tsx          # navigation + SettingsProvider + weekly reminder
eas.json         # EAS development + preview + production
```

## Ticket map

| Ticket | Scope |
|--------|--------|
| ME-1 | Scaffold + SQLite ping + README (this) |
| ME-2 | Models / migrations / repository |
| ME-3 | Home list + detail + history |
| ME-4 | Create / edit / delete |
| ME-5 | Partial spend |
| ME-6 | Weekly local notification (wired — Sunday 18:00 device-local, `SOON_EXPIRING_DAYS`) |
| ME-12 | Settings: language EN/HE, appearance Light/Dark, gear entry |

## License

Private / team use unless otherwise noted.
