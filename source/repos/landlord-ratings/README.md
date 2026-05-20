# RentScore (Landlord & Property Ratings)

Mobile app for renters to rate landlords and rental properties — combining a **map-first discovery** experience with **Rate My Professor-style** multi-category reviews.

## Stack

- **Expo SDK 54** + **React Native** + **Expo Router**
- **Firebase** (Auth, Firestore, Storage, Cloud Functions)
- **react-native-maps** + **expo-location**
- **Google Places API** (address autocomplete)

## Quick start

```bash
cd landlord-ratings
cp .env.example .env
# Fill in Firebase + Google API keys (optional for demo mode)
npm install
npm start          # uses Expo Go (--go)
```

### Run on your phone (Expo Go)

1. Start the dev server: `npm start`
2. Open the **Expo Go** app on your phone (not the iPhone Camera app).
3. Tap **Scan QR code** inside Expo Go and scan the terminal QR code.
4. Phone and Mac must be on the same Wi‑Fi. If it fails, press `s` in the terminal and switch to **Tunnel** mode, then scan again.

> This project uses **Expo Go** for local development. If you see an error about `com.rentscore.app` / development build, you may still have an old server running — stop it and run `npm start` again after `npm install`.

### Demo mode

Without Firebase keys, the app runs with **in-memory mock data** (Chicago sample properties). Sign in uses “Continue in demo mode” on the login screen.

If you added `.env` but still see demo mode, **stop Expo and restart with a clean cache** (env vars are baked in at startup):

```bash
npx expo start -c
```

On the Account tab you should see `Connected to Firebase project: your-project-id` when config loaded correctly.

Ensure `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false` unless you are running `firebase emulators:start`.

### Firebase setup

1. Create a Firebase project and enable **Email/Password** auth.
2. Create a Firestore database and deploy rules/indexes:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

3. Deploy Cloud Functions (review moderation + aggregate scores):

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```

4. Copy web app config into `.env` (see `.env.example`).

### Emulators

```bash
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true firebase emulators:start
```

## Project structure

```
app/           # Expo Router screens (tabs, auth, property, review)
src/
  components/  # Map, bottom sheet, stars, review cards
  services/    # Firestore, Places, mock data
  types/       # Shared TypeScript models
functions/     # onReviewWrite trigger (moderation + aggregates)
```

## iOS Simulator troubleshooting

If you see `No iOS devices available in Simulator.app`:

1. Install **Xcode** from the Mac App Store and open it once (accept the license).
2. Install an iOS runtime: **Xcode → Settings → Platforms → iOS** → download a simulator.
3. Create a device: **Xcode → Window → Devices and Simulators → Simulators → +**.
4. Boot the Simulator app: `open -a Simulator`
5. From the project folder: `npm run ios` (or press `i` in the Expo terminal).

Use **Expo Go** on a physical iPhone: run `npm start`, then scan the QR code from **inside the Expo Go app** (Projects → Scan QR code). Do not use the iPhone Camera app — it will show “no usable data”.

To open on the iOS Simulator with Expo Go: run `npm run ios` while the dev server is running (or press `i` in the Expo terminal). Install **Expo Go** on the simulator from the App Store in Simulator if prompted.

## EAS builds

```bash
npx eas-cli login
npx eas build --profile development --platform ios
```

Configure `EAS_PROJECT_ID` in `.env` after `eas init`.

## Legal

See in-app **Terms of Service** and **Privacy Policy** under Account. Reviews are user opinions; fair-housing rules prohibit discriminatory tags.
