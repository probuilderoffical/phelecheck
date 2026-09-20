# PheleCheck Sentinel-1

Sentinel-1 is PheleCheck's first self-hosted fraud-risk model stack.

## Base model

- **Qwen3-VL-4B-Instruct**
- Vision + text input
- Multilingual reasoning/OCR capability
- Self-hosted; no third-party AI inference API is required by the app

## Sentinel-1 layers

1. Input normalization and language detection
2. Sensitive-data redaction
3. Qwen3-VL fraud-risk reasoning
4. Deterministic risk-signal engine
5. Reputation signals from PheleCheck data
6. Risk fusion and confidence calibration
7. User-language explanation

The mobile app has a local fallback risk engine so basic checks still work when the GPU inference server is unavailable.

## Improvement policy

The model never trains live on raw user requests.

Only data from users with **Improve PheleCheck** enabled may enter the improvement pipeline. Before training it must be de-identified, deduplicated, abuse-checked, quality-reviewed, and split into train/evaluation sets. New checkpoints must beat the current model on held-out safety and fraud-detection evaluations before deployment.

## Versioning

- App-visible name: **PheleCheck Sentinel-1**
- Initial local rules version: **0.1-local**
- First GPU checkpoint target: **1.0**
