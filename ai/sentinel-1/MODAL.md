# Modal deployment

PheleCheck Sentinel-1 deploys from GitHub Actions to Modal.

## One-time setup

Create a Modal API token, then add these two repository secrets to
`probuilderoffical/phelecheck`:

- `MODAL_TOKEN_ID`
- `MODAL_TOKEN_SECRET`

Never commit these credentials or paste them into chat.

After both secrets exist, run the GitHub Actions workflow:

`Deploy Sentinel-1 to Modal`

The deployment exposes:

- `GET /health`
- `POST /v1/analyze`

After first deployment, copy the Modal web base URL into Supabase
`runtime_config` -> `sentinel_endpoint`.

The mobile app reads that endpoint dynamically, so changing hosting later does
not require rebuilding the APK.
