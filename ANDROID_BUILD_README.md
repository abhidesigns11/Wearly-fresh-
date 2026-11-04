# Wearly Android APK build

This repository includes a Capacitor configuration and a GitHub Actions workflow that builds an installable Android **debug APK**.

## Build with GitHub Actions

1. Upload/push this project to a GitHub repository.
2. Ensure the default branch is named `main` (or edit `.github/workflows/build-apk.yml`).
3. Open the repository's **Actions** tab.
4. Select **Build Wearly Android APK**.
5. Click **Run workflow** (or push a commit to `main`).
6. When the run succeeds, open the run and download the `Wearly-Android-APK` artifact.
7. Extract the downloaded artifact ZIP; install `app-debug.apk` on your Android phone.

## App identity

- App name: Wearly
- Android application ID: `com.wearly.app`
- Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Notes

- The workflow generates the native `android/` project during CI with `npx cap add android`, then synchronizes the Vite `dist/` output.
- This is a **debug APK**, suitable for direct installation/testing. It is not a Play Store release and is not a signed production release.
- The first GitHub Actions run may take several minutes while Gradle downloads the Android build tools and dependencies.
- Google OAuth must have the correct Supabase callback URL and allowed redirect URLs. For a native app, test the OAuth return flow on-device; a browser-based callback may need a configured deep link/app URL strategy before Google sign-in can complete inside the installed APK.
- Supabase publishable keys are intended for client applications when Row Level Security is correctly configured. Never put a Supabase `service_role` key or Google OAuth client secret in the app source.
- The project source has not been fully built or device-tested in this environment. GitHub Actions will reveal any dependency/build errors in its run logs.
