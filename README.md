# PheleCheck

**Verify Before You Pay.**

PheleCheck is a mobile-first fraud-risk verification app built with React Native and Expo.

## Current build

- Professional responsive light/dark UI
- Sentinel-1 cloud fraud-risk analysis with conservative local fallback
- Live URL Scanner evidence for detected website domains
- Screenshot vision analysis
- Native QR decoding plus Sentinel vision fallback
- Server-side abuse/rate limiting
- History, reports, account sync, password reset, privacy/help/risk guidance
- Automated app validation, gateway smoke tests, and Sentinel safety regression tests

PheleCheck provides risk guidance, not a guarantee of safety or fraud.

## Run on a phone

1. Install **Expo Go** on your phone.
2. Open this repository in a GitHub Codespace or any environment with Node.js 22.13+.
3. Run:

```bash
npm install
npx expo install --fix
npx expo start
```

4. Scan the QR code with Expo Go.

## App identifiers

- Android: `com.phelecheck.app`
- iOS: `com.phelecheck.app`

## Architecture direction

The client app will connect to PheleCheck's own backend and self-hosted AI stack. Sensitive secrets must never be committed to this repository.
