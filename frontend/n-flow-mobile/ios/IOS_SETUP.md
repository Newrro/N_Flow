# iOS Setup — what's done and what's left

This iOS project was generated with Capacitor 8, which uses **Swift Package
Manager** (no CocoaPods / `pod install` needed). The push-notifications plugin
is already linked. The crash-free remote-site loading works the same as Android.

## ✅ Already done for you in this folder
- The full iOS Xcode project (`ios/App/App.xcodeproj`).
- `@capacitor/push-notifications` plugin linked via SPM.
- `AppDelegate.swift` — APNs registration callbacks added (so the push token
  reaches the plugin).
- `Info.plist` — `remote-notification` background mode added.
- `App.entitlements` — `aps-environment` set (push capability).
- `capacitor.config.json` — same config as Android (loads your live site).

## 🔧 What YOU must do (all on a Mac with Xcode — iOS requires this)

You cannot build or distribute an iOS app without a Mac + Xcode + an Apple
Developer account ($99/year). There is no way around Apple's tooling.

### 1. Open the project
```
cd frontend/n-flow-mobile
npm install
npx cap sync ios
npx cap open ios      # opens Xcode
```

### 2. Set your signing team
Xcode → select the **App** target → **Signing & Capabilities** →
choose your **Team** (your Apple Developer account). Bundle ID stays
`com.newrro.nflow`.

### 3. Confirm the Push Notifications capability
On that same **Signing & Capabilities** screen you should see
**Push Notifications**. If it's missing, click **+ Capability** and add it
(this matches the `App.entitlements` already included). Also confirm
**Background Modes → Remote notifications** is ticked.

### 4. Add your Firebase iOS file
- In Firebase, add an **iOS app** with bundle ID `com.newrro.nflow`.
- Download **`GoogleService-Info.plist`**.
- In Xcode, drag it into the **App** target (tick "Copy items if needed").
  On disk it belongs at `ios/App/App/GoogleService-Info.plist` (a marker file
  is sitting there now).

### 5. Add the Firebase SDK so iOS uses FCM (to match Android)
Capacitor's push plugin gives you an **APNs** token by default. To use **Firebase
Cloud Messaging** on iOS the same way you do on Android, add the Firebase SDK:
- Xcode → **File → Add Package Dependencies…**
- URL: `https://github.com/firebase/firebase-ios-sdk`
- Add the **FirebaseMessaging** product to the App target.
- In `AppDelegate.swift`, inside `didFinishLaunchingWithOptions`, add:
  ```swift
  import FirebaseCore        // at top of file
  ...
  FirebaseApp.configure()    // first line inside didFinishLaunchingWithOptions
  ```
  (If you'd rather send directly via APNs instead of FCM, you can skip step 5
  entirely — the app still receives pushes, you just send to the APNs token.)

### 6. Create the APNs key (lets pushes actually deliver)
- Apple Developer account → **Certificates, Identifiers & Profiles → Keys** →
  create an **APNs Auth Key** (.p8). Download it once (you can't re-download).
- Upload that `.p8` into **Firebase → Project settings → Cloud Messaging →
  Apple app configuration** (with your Key ID and Team ID).

### 7. Run / distribute
- **Test on your iPhone:** plug it in, select it in Xcode, press Run.
  (Push does NOT work on the iOS Simulator — use a real device.)
- **Let others download it:** Xcode → **Product → Archive** → upload to
  App Store Connect → distribute via **TestFlight** (invite testers) or submit
  to the **App Store**. There is no raw-file/sideload download for normal users.

### Note for App Store / production builds
Before archiving for release, change `aps-environment` in `App.entitlements`
from `development` to `production` (or let Xcode manage it automatically when
you add the capability with automatic signing).
