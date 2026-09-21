# PheleCheck Release Readiness

## Automated gates

- [x] App TypeScript validation passes.
- [x] Expo Doctor passes.
- [x] Local fraud-risk regression passes on every relevant app change.
- [x] Sentinel gateway health smoke passes without spending inference quota.
- [x] Sentinel text/vision live smoke has passed; re-run manually after provider quota resets or before release.
- [x] Supabase security advisor has no security lints.
- [x] Public privacy and external account-deletion pages pass backend smoke tests.

## Technical release blockers completed

- [x] Professional responsive home/tools UI
- [x] Bottom safe-area protection
- [x] Cloud Sentinel-1 text analysis
- [x] Live URL Scanner evidence for detected domains
- [x] Screenshot vision path
- [x] Native QR decoding plus Sentinel vision fallback
- [x] Conservative false-positive calibration
- [x] Strong deterministic fallback for obvious scams
- [x] Local fallback for text outages
- [x] Unknown result instead of guessed image result during vision/provider outages
- [x] Server-side AI rate limiting
- [x] Rate-limited scam report endpoint
- [x] Training candidates de-identified from direct user/source linkage
- [x] Improve PheleCheck off by default for new users
- [x] Password reset flow
- [x] Account-data export
- [x] In-app permanent account deletion
- [x] External account-deletion request page
- [x] Public privacy-policy page
- [x] In-app privacy, terms, help, and risk-score explanations
- [x] Database RLS/security hardening
- [x] Regression evaluation workflows

## Public URLs

- Privacy policy: https://duqmwlgstztbjjzvejpk.supabase.co/functions/v1/privacy-policy
- Account deletion requests: https://duqmwlgstztbjjzvejpk.supabase.co/functions/v1/account-deletion-request

## External/manual gates before public Google Play launch

- [ ] Cloud AI production capacity: free Cloudflare Workers AI allocation is currently insufficient for unrestricted public traffic. Upgrade capacity or add a second production inference provider before public launch.
- [ ] Install the final APK/AAB on multiple real Android devices and test every core flow.
- [ ] Run a closed beta with real testers and review false positives/false negatives.
- [ ] Re-run the manual live Sentinel safety regression when inference quota is available.
- [ ] Complete Google Play developer-account and required testing steps.
- [x] Public privacy-policy URL exists.
- [x] In-app and external account deletion paths exist.
- [ ] Complete Google Play Data safety/App content declarations accurately.
- [ ] Provide a public developer/support email in the store listing and privacy policy.
- [ ] Prepare/finalize store icon, screenshots, feature graphic, description, and release notes.
- [ ] Review legal/privacy obligations for the initial launch countries.
- [ ] Confirm production quotas/budget alerts for Cloudflare and Supabase.

## Post-launch candidates

Subscriptions/Plus, business/API plans, voice and video scam analysis, browser/share-sheet integrations, deeper reputation sources, community intelligence, improved multilingual UI, and custom-trained Sentinel checkpoints can ship after the core release is stable.
