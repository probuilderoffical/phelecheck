# PheleCheck

**Verify Before You Pay.**

PheleCheck is a mobile-first fraud-risk verification app built with React Native and Expo.

## Current build

- Modern light/dark UI
- Message check flow
- Screenshot picker
- Link check flow
- QR-image entry flow
- Payment and phone entry points
- Result/evidence layout
- 12-language-ready configuration
- No third-party AI API wired in yet

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
