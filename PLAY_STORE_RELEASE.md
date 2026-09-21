# Google Play Release Draft

## Public policy URLs

Privacy policy:
https://duqmwlgstztbjjzvejpk.supabase.co/functions/v1/privacy-policy

Account deletion:
https://duqmwlgstztbjjzvejpk.supabase.co/functions/v1/account-deletion-request

## Suggested store title

PheleCheck: Scam & Fraud Check

## Short description

Check suspicious messages, links, screenshots, QR codes and payment requests before you trust or pay.

## Full description draft

PheleCheck helps you examine suspicious messages, links, screenshots, QR codes, phone/payment context and online offers before you act.

Sentinel-1 looks for fraud signals such as payment pressure, credential requests, impersonation, secrecy, prize/job bait, guaranteed-profit claims and phishing patterns. When a link is present, PheleCheck can also use live URL-scanner evidence as supporting context.

Results are shown as Low Risk, Caution, High Risk or Unable to Verify, with the evidence and practical next steps.

PheleCheck does not promise that something is completely safe or definitely fraudulent. Important payments and identities should always be verified independently through official channels.

Never submit passwords, OTPs, PINs, CVV codes, full card numbers, private keys or seed phrases.

## Data Safety working notes

These are preparation notes, not a substitute for completing the live Play Console form accurately.

Likely data categories handled by the current product include:
- Email address: account creation/sign-in and account management.
- User-provided text/content: fraud-risk analysis.
- Photos/screenshots selected by the user: transient fraud-risk analysis; PheleCheck does not store raw uploaded image files in its database.
- App activity/check results: optional history/sync when enabled.
- User-submitted scam reports: stored for manual review.
- Preferences: language, appearance, history/memory and model-improvement settings.

Third-party/service processing currently includes Supabase for backend/account data and Cloudflare-hosted AI / URL Scanner for requested analysis.

The final Play Console answers must match the exact production behavior and Google Play's definitions of collection, sharing, optional collection, encryption, deletion and purpose.

## Reviewer notes

The app can be used without creating an account. Account creation is optional and enables synchronization. If a reviewer creates an account, deletion is available at Settings → Account → Delete account permanently.

## Assets still requiring final human review

- Production app icon
- Phone screenshots covering Home, result evidence, screenshot check, link evidence, and Settings/privacy
- Feature graphic
- Public support/developer email
- Final release notes

## Release notes draft

PheleCheck 1.2
- Redesigned responsive verification dashboard
- Sentinel-1 fraud-risk analysis
- Live URL Scanner evidence for links
- Screenshot and QR analysis
- Improved false-positive calibration
- Safer cloud-outage fallback behavior
- Account export and deletion controls
- Privacy, safety and risk-score explanations


## Google Play personal-account launch requirement

For personal developer accounts created after November 13, 2023, Google Play currently requires a closed test with at least 12 testers continuously opted in for at least 14 days before applying for production access.

New personal accounts may also need to verify access to a real Android device using the Play Console mobile app.

Treat the Play Console itself as the source of truth for the account-specific tasks shown on the dashboard.
