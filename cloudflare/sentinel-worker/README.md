# PheleCheck Sentinel-1 on Cloudflare Workers AI

This Worker exposes:

- GET /health
- POST /v1/analyze

Model:
- @cf/qwen/qwen3.8-27b

Deployment is automated through GitHub Actions.

Required repository secrets:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

Create the API token using Cloudflare's **Edit Cloudflare Workers** template and
scope it to the PheleCheck Cloudflare account.

After the first successful deployment, copy the workers.dev base URL into
Supabase runtime_config -> sentinel_endpoint. PheleCheck reads that URL dynamically.
