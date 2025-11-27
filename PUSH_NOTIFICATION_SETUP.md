# Firebase Push Notification Setup Guide

To enable push notifications for the Android app, you need to set up a Firebase project and add the `google-services.json` file to your project.

## Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or "Create a project").
3. Enter a project name (e.g., "UppclProgressApp") and follow the setup steps.
4. You can disable Google Analytics for this project if you don't need it.

## Step 2: Add an Android App
1. In your Firebase project overview, click the **Android** icon to add an Android app.
2. **Android package name**: Enter `com.progress.com` (This MUST match the `applicationId` in your `android/app/build.gradle` file).
3. **App nickname** (Optional): Enter "Progress App".
4. Click **Register app**.

## Step 3: Download Configuration File
1. Download the `google-services.json` file.
2. Move this file to the `android/app/` directory in your project.
   - Path: `c:\Users\Dell\uppcl-progress-app\android\app\google-services.json`

## Step 4: Add Firebase SDK (Already Done)
The project is already configured to use the `google-services` plugin if the JSON file is present. You don't need to change any build files.

## Step 5: Rebuild the App
After adding the file, you need to rebuild the Android app:
1. Open a terminal in the project root.
2. Run: `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. Build and run the app on your device or emulator.

## Troubleshooting
- If the build fails, make sure the `google-services.json` file is in the correct location (`android/app/`).
- If notifications don't appear, check the console logs for "Push registration success" or error messages.
