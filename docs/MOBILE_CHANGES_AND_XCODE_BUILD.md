# Mobile app changes (this project) vs PDF / Xcode build

## What we changed in the mobile app

None of our changes touched PDF or asset catalogs.

We only added/changed:

1. **Banks**
   - `lib/banks-api.ts` – fetch banks from API
   - `hooks/useBanks.ts` – React Query hook for banks
   - `components/evaluation-form/Step1.tsx` – Bank and Branch **dropdowns** instead of text inputs (still uses `expo-print` only for existing payment receipt PDF)

2. **Existing PDF (unchanged)**
   - `lib/pdf-generator.ts` – **unchanged**. Still used only for **payment receipt** PDF (expo-print). The “downloadable PDF for valuation data” from the plan was implemented in the **admin panel** (web), not in the mobile app.

So: **no new PDF code and no asset catalog changes** were made in the mobile app. The Xcode “asset catalog thinning” error is coming from Xcode’s build cache, not from these edits.

---

## Fix: Xcode failing on asset catalog generation/thinning

Do this when Xcode fails while generating/thinning asset catalogs:

### 1. Clean and remove DerivedData (recommended)

1. **Quit Xcode** (Cmd+Q).
2. In Terminal, from anywhere, run:

```bash
# Remove this project’s DerivedData (replace with your app name if different)
rm -rf ~/Library/Developer/Xcode/DerivedData/MrValuator-*

# If that’s not enough, remove all DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData
```

3. Reopen the project in Xcode and build again (Cmd+B).

### 2. Clean build folder in Xcode

1. In Xcode: **Product → Clean Build Folder** (Cmd+Shift+K).
2. Quit Xcode, then run the `rm -rf` command above for `MrValuator-*` (or all DerivedData).
3. Open the project again and build.

### 3. Reinstall pods (if you use CocoaPods)

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

Then in Xcode: Clean Build Folder, then build.

### 4. Check asset catalogs (step-by-step)

Do this if cleaning DerivedData and pods didn’t fix the asset catalog error.

1. **Open the project in Xcode**  
   Open the `.xcworkspace` (e.g. `ios/MrValuator.xcworkspace`), not the `.xcodeproj`.

2. **Open the Project Navigator**  
   Press **Cmd+1** or click the folder icon in the left sidebar.

3. **Find asset catalogs**  
   In the left tree, look for yellow folder icons named something like:
   - `Images.xcassets`
   - `Assets.xcassets`
   - `AppIcon.appiconset` (inside an xcassets folder)  
   They are usually under your app target (e.g. `MrValuator` or `Evaluation_Mobile_App`) or under an `ios` group.

4. **Click an `.xcassets` folder**  
   The main editor area will show the catalog (grid of images, app icons, etc.).

5. **Check for problems**
   - **Red names or missing files** – Any asset or image name in red, or a “missing”/broken image icon, means the file is missing or the path is wrong. Remove that asset from the catalog or fix the path.
   - **Bad names** – Avoid spaces, slashes, or odd characters in asset names. Prefer names like `icon_settings` or `splash`.
   - **App Icons** – If you see an `AppIcon` set, make sure required sizes aren’t empty (no red or “empty” slots if your scheme needs them).

6. **If you find a bad asset**
   - Select the asset in the catalog.
   - Delete it (Delete key or right‑click → Delete).
   - In Xcode: **Product → Clean Build Folder** (Cmd+Shift+K).
   - Quit Xcode, run:  
     `rm -rf ~/Library/Developer/Xcode/DerivedData/MrValuator-*`  
     (or delete all `DerivedData` if needed).
   - Reopen Xcode and build again. If you need that image, add it again with a simple name and no special characters.

7. **If everything looks fine**  
   Sometimes the catalog is fine and the error is only from cache. In that case, step 1 (delete DerivedData) and step 3 (pod install) are usually enough; you can skip step 4.

---

### Fix: SplashScreenLegacy 1x slot empty

If you see **SplashScreenLegacy** in `Images` → `SplashScreen` with an **empty 1x** slot (placeholder only), that can cause asset catalog thinning to fail.

**Option A – Assign an image to 1x**

1. In the middle pane, select **SplashScreenLegacy**.
2. In the right pane, under the **1x** slot, click the image well (the placeholder).
3. Drag in a splash image (e.g. same as **SplashScreenBackground** or a solid-color image), or use the dropdown to choose an existing image from the project.
4. Save (Cmd+S), then **Product → Clean Build Folder** (Cmd+Shift+K) and build again.

**Option B – Remove SplashScreenLegacy if you don’t need it**

1. In the middle pane, select **SplashScreenLegacy**.
2. Press **Delete** (or right‑click → Delete).
3. Confirm. Expo often drives splash via `expo-splash-screen` and app.json; if you’re not using this legacy set, removing it is safe.
4. **Product → Clean Build Folder**, quit Xcode, run `rm -rf ~/Library/Developer/Xcode/DerivedData/MrValuator-*`, reopen and build.

After cleaning DerivedData (and pods if needed), the first build may be slower; the asset catalog error should go away if the project and assets are valid.
