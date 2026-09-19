# Balance

Personal **offline-first** gift-card & store-credit tracker.

**Stack:** Expo (managed) + TypeScript · `expo-sqlite` · `expo-notifications` (ME-6 weekly Sunday 18:00 local) · device locale (EN/HE from ME-1)

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
  screens/       # list / detail / forms (ME-3+)
  components/    # shared UI
  notifications/ # ME-6 weekly expiry reminder
App.tsx          # navigation + schedule weekly reminder on mount
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

## License

Private / team use unless otherwise noted.
