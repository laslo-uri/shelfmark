# Shelfmark — mobile (Capacitor) and PWA

**Shelfmark** ships as:

- **Web / PWA** — Vercel or any HTTPS host (`npm run build`, `base: /`)
- **Android / iOS** — Capacitor shell (`npm run build:mobile`, `base: ./`)
- **Windows / Mac / Linux desktop** — Tauri NSIS / dmg / deb (`npm run tauri:build`)
## Prerequisites

| Tool | Purpose |
|------|---------|
| Node.js 22+ | Build |
| **Android Studio** (or SDK + JDK 17) | Android APK |
| **macOS + Xcode** | iOS builds and device install |

## Install dependencies

```bash
npm install
```

## Web / PWA

```bash
npm run build
```

Deploy `dist/` to HTTPS (e.g. Vercel). Install via browser **Install app** / **Add to Home Screen**.

## Capacitor — first-time setup

```bash
npm run build:mobile
npx cap sync
```

Native projects: `android/`, `ios/`.

## Daily dev loop

```bash
npm run dev              # browser at http://localhost:5173
npm run cap:sync         # rebuild mobile bundle + copy to native projects
npm run cap:android      # open Android Studio
npm run cap:ios          # open Xcode (macOS only)
```

## Android — debug APK

```bash
npm run cap:sync
cd android
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## iOS — device install

On a Mac with Xcode:

```bash
npm run prepare:ios
npm run cap:ios
```

Then sign with your Apple ID and run on a connected iPhone.

## App icons

```bash
npm run prepare:ios-icon
npm run assets:generate
npx cap sync
```

## Camera (barcode scan)

Android and iOS native projects include camera permission for `getUserMedia` in the WebView. On device, use **Scan barcode** → allow camera when prompted.

## Huawei

- **PWA:** Deploy to HTTPS; open in Huawei Browser → **Add to shortcut** / **Add to Home screen**.
- **APK sideload:** Build the Android debug/release APK and install on EMUI / HarmonyOS (Android-compatible devices).
- **HarmonyOS NEXT:** Use the PWA in the browser; native HarmonyOS app not included in this repo.

## Desktop shortcut (Windows)

```powershell
npm run desktop:shortcut
```

Creates **Shelfmark.lnk** on your Desktop (native `.exe` if built, else browser app window).
