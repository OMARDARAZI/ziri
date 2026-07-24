# Zeere mobile

Zeere is the customer Flutter application for island stories, local news, events, safety information, providers, offerings, bookings, and participant QR links. Administrative and provider-scanner workflows remain in the existing web applications.

## Requirements and setup

Use Flutter 3.41.3 or later with Dart 3.11 or later. The Node/MySQL API must be running and reachable from the device. Copy an example configuration to a local JSON file, update its hosts, then run:

```powershell
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run --dart-define-from-file=config/development.json
```

The JSON example files are safe templates only. Do not commit environment-specific production values.

- Android emulator: use `http://10.0.2.2:3000`.
- iOS simulator: use `http://localhost:3000` (or a reachable Mac LAN address).
- Physical device: use the development computer's LAN address and an HTTPS API for production.

Run checks with:

```powershell
dart format .
flutter analyze
flutter test
flutter test integration_test
flutter build apk --debug --dart-define-from-file=config/development.json
```

Release examples:

```powershell
flutter build apk --release --dart-define-from-file=config/production.json
flutter build appbundle --release --dart-define-from-file=config/production.json
flutter build ios --release --dart-define-from-file=config/production.json
```

## User flows

Tokens are stored only in platform secure storage. App startup restores the session through `/auth/me`; a 401 uses the single-flight refresh flow and retries the original request once. Refresh failure clears private authentication state.

Bookings use backend-owned offering prices. A customer can include their account participant, add any number of named/phone-number guests, or book only for guests. Each booking participant receives its own backend-issued QR URL. The app renders, shares, and opens that URL; it never creates or validates QR tokens locally.

## Project structure

`lib/core` contains configuration, API, storage, theme, formatting, and shared widgets. `lib/features` holds each customer feature's data, domain, and presentation code. `lib/app_router.dart` owns GoRouter guards and shell navigation. `config/` contains non-secret dart-define templates.

`assets/brand/zeere_mark.svg` and the matching Android vector launcher mark are temporary, project-safe Zeere monograms that can be replaced with the official brand package later. The native iOS asset catalog retains a replaceable placeholder until official raster icon artwork is supplied.

## Troubleshooting

If Android cannot reach a local API, verify the API is running, use `10.0.2.2` rather than `localhost`, and run a debug build. Debug Android permits local cleartext HTTP; release builds do not. If login immediately expires, verify backend JWT secrets, server time, and MySQL refresh-token tables. iOS release builds require HTTPS and valid signing on a macOS host.
