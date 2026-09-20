import json
import re
import modal

APP_NAME = "phelecheck-sentinel-1"
MODEL_ID = "Qwen/Qwen3-VL-4B-Instruct"
HF_CACHE = "/root/.cache/huggingface"

app = modal.App(APP_NAME)
model_cache = modal.Volume.from_name("phelecheck-sentinel-cache", create_if_missing=True)

gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install(
        "torch==2.8.0",
        "transformers>=4.57.0,<5",
        "accelerate>=1.10.0",
        "pillow>=11.0.0",
        "qwen-vl-utils>=0.0.14",
    )
    .env({"HF_HOME": HF_CACHE})
)

web_image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    "fastapi>=0.115.0",
    "pydantic>=2.9.0",
)

SYSTEM_PROMPT = """You are PheleCheck Sentinel-1, a fraud-risk analysis model.
Analyze only evidence supplied by the user. Never claim that a person is definitely
a criminal or that something is 100% safe.

Look for payment/advance-fee scams, phishing, credential theft, urgency, pressure,
secrecy, manipulation, impersonation, investment/profit claims, suspicious jobs,
marketplaces, deliveries, refunds, account-verification requests, missing independent
verification, and suspicious links or contact details.

Never ask for OTPs, PINs, passwords, full card numbers, private keys or seed phrases.

Return ONLY valid JSON with:
riskLevel: low | caution | high | unknown
score: integer 0-100
confidence: integer 0-100
summary: concise explanation
signals: array of {title, detail, severity} where severity is info | warning | danger
actions: array of practical verification/safety steps
language: requested language code

If evidence is insufficient, use unknown or caution rather than guessing.
"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("\`\`\`"):
        text = re.sub(r"^\`\`\`(?:json)?\\s*", "", text)
        text = re.sub(r"\\s*\`\`\`$", "", text)
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\\{[\\s\\S]*\\}", text)
        if not match:
            raise
        return json.loads(match.group(0))


@app.cls(
    image=gpu_image,
    gpu="T4",
    volumes={HF_CACHE: model_cache},
    timeout=900,
    scaledown_window=300,
    max_containers=1,
)
class SentinelModel:
    @modal.enter()
    def load(self):
        import torch
        from transformers import AutoModelForMultimodalLM, AutoProcessor

        self.torch = torch
        self.processor = AutoProcessor.from_pretrained(MODEL_ID)
        self.model = AutoModelForMultimodalLM.from_pretrained(
            MODEL_ID,
            dtype=torch.float16,
            device_map="cuda",
            attn_implementation="sdpa",
        )
        self.model.eval()

    @modal.method()
    def analyze(self, payload: dict) -> dict:
        text = str(payload.get("text", "")).strip()[:12000]
        language = str(payload.get("language", "en")).strip()[:12] or "en"

        if not text:
            return {
                "model": "PheleCheck Sentinel-1",
                "version": "1.0-modal",
                "riskLevel": "unknown",
                "score": 50,
                "confidence": 10,
                "summary": "No analyzable content was provided.",
                "signals": [{
                    "title": "No content",
                    "detail": "PheleCheck needs content to evaluate risk signals.",
                    "severity": "info",
                }],
                "actions": ["Provide only non-sensitive content that needs checking."],
                "language": language,
                "source": "sentinel",
            }

        user_prompt = f"""Requested language: {language}

Content to assess:
{text}

Return strict JSON only."""

        messages = [
            {"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]},
            {"role": "user", "content": [{"type": "text", "text": user_prompt}]},
        ]

        inputs = self.processor.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt",
        ).to(self.model.device)

        with self.torch.inference_mode():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=700,
                do_sample=False,
            )

        generated = output_ids[:, inputs["input_ids"].shape[-1]:]
        raw = self.processor.batch_decode(generated, skip_special_tokens=True)[0]

        try:
            data = _extract_json(raw)
            risk = data.get("riskLevel", "unknown")
            if risk not in {"low", "caution", "high", "unknown"}:
                risk = "unknown"
            score = max(0, min(100, int(data.get("score", 50))))
            confidence = max(0, min(100, int(data.get("confidence", 20))))
            signals = data.get("signals") if isinstance(data.get("signals"), list) else []
            actions = data.get("actions") if isinstance(data.get("actions"), list) else []

            return {
                "model": "PheleCheck Sentinel-1",
                "version": "1.0-modal",
                "riskLevel": risk,
                "score": score,
                "confidence": confidence,
                "summary": str(data.get("summary", "Verify independently before paying."))[:1500],
                "signals": signals[:8],
                "actions": [str(x)[:500] for x in actions[:8]],
                "language": str(data.get("language", language))[:12],
                "source": "sentinel",
            }
        except Exception:
            return {
                "model": "PheleCheck Sentinel-1",
                "version": "1.0-modal",
                "riskLevel": "unknown",
                "score": 50,
                "confidence": 20,
                "summary": "Sentinel could not validate its generated analysis. Verify independently before paying.",
                "signals": [{
                    "title": "Analysis validation failed",
                    "detail": "The model response did not pass PheleCheck output validation.",
                    "severity": "warning",
                }],
                "actions": [
                    "Do not send money until the request is independently verified.",
                    "Never share OTPs, PINs, passwords or private keys.",
                ],
                "language": language,
                "source": "sentinel",
            }


@app.function(image=web_image)
@modal.asgi_app()
def web():
    from fastapi import FastAPI
    from pydantic import BaseModel, Field

    api = FastAPI(title="PheleCheck Sentinel-1", version="1.0")

    class AnalyzeRequest(BaseModel):
        text: str = Field(min_length=1, max_length=12000)
        language: str = "en"

    @api.get("/")
    def root():
        return {"ok": True, "service": "PheleCheck Sentinel-1", "version": "1.0-modal"}

    @api.get("/health")
    def health():
        return {"ok": True, "model": "PheleCheck Sentinel-1", "base_model": MODEL_ID}

    @api.post("/v1/analyze")
    def analyze(body: AnalyzeRequest):
        return SentinelModel().analyze.remote(body.model_dump())

    return api
