# PheleCheck Release Readiness

## Automated gates

- App TypeScript validation and Expo Doctor must pass.
- Sentinel gateway health/text/vision smoke tests must pass.
- Sentinel safety regression suite must pass before a model/prompt change is promoted.
- Supabase security advisor must have no security lints.

## Technical release blockers

- [x] Professional responsive home/tools UI
- [x] Bottom safe-area protection
- [x] Cloud Sentinel-1 text analysis
- [x] Live URL Scanner evidence for detected domains
- [x] Screenshot vision path
- [x] Native QR decoding plus Sentinel vision fallback
- [x] Conservative false-positive calibration
- [x] Local fallback for text outages
- [x] Unknown result instead of guessed image result during vision outages
- [x] Server-side AI rate limiting
- [x] Rate-limited scam report endpoint
- [x] Training candidates de-identified from direct user/source linkage
- [x] Improve PheleCheck off by default for new users
- [x] Password reset flow
- [x] In-app privacy, terms, help, and risk-score explanations
- [x] Database RLS/security hardening
- [x] Regression evaluation workflow

## External/manual gates before public store launch

- [ ] Install the final APK/AAB on multiple real Android devices and test all flows.
- [ ] Run a closed beta with real testers and review false positives/false negatives.
- [ ] Complete Google Play developer-account and testing requirements.
- [ ] Provide a public privacy-policy URL in the store listing.
- [ ] Complete Google Play Data safety/App content declarations accurately.
- [ ] Prepare store icon, screenshots, feature graphic, description, support contact, and release notes.
- [ ] Review local legal/privacy obligations for target launch countries.
- [ ] Confirm production quotas/budget alerts for Cloudflare and Supabase.

## Post-launch candidates

Subscriptions/Plus, business/API plans, voice and video scam analysis, browser/share-sheet integrations, deeper reputation sources, community intelligence, improved multilingual UI, and custom-trained Sentinel checkpoints can be shipped after the core release is stable.
