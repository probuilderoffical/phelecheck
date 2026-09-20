import os
from typing import Literal
from fastapi import FastAPI
from pydantic import BaseModel, Field
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText

MODEL_ID = os.getenv("SENTINEL_BASE_MODEL", "Qwen/Qwen3-VL-4B-Instruct")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

app = FastAPI(title="PheleCheck Sentinel-1", version="1.0")

processor = None
model = None

SYSTEM = """You are PheleCheck Sentinel-1, a fraud-risk analysis model.
Analyze only evidence present in the input. Never claim certainty or declare a person criminal.
Identify scam/fraud indicators, missing verification, payment risk, urgency/manipulation,
impersonation risk, suspicious links, credential theft requests, and recommended verification steps.
Return concise JSON-compatible fields in the user's language when possible.
Risk labels: low, caution, high, unknown.
Do not ever request OTPs, PINs, passwords, full card numbers, or private keys."""

class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    language: str = "en"

class Signal(BaseModel):
    title: str
    detail: str
    severity: Literal["info", "warning", "danger"]

class AnalyzeResponse(BaseModel):
    model: str = "PheleCheck Sentinel-1"
    version: str = "1.0"
    riskLevel: Literal["low", "caution", "high", "unknown"]
    score: int
    confidence: int
    summary: str
    signals: list[Signal]
    actions: list[str]
    language: str
    source: str = "sentinel"

def load_model():
    global processor, model
    if model is not None:
        return
    processor = AutoProcessor.from_pretrained(MODEL_ID, trust_remote_code=True)
    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID,
        torch_dtype="auto",
        device_map="auto" if DEVICE == "cuda" else None,
        trust_remote_code=True
    )
    if DEVICE == "cpu":
        model.to("cpu")

@app.get("/health")
def health():
    return {"ok": True, "model": "PheleCheck Sentinel-1", "base": MODEL_ID, "device": DEVICE}

@app.post("/v1/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest):
    load_model()
    messages = [
        {"role": "system", "content": [{"type": "text", "text": SYSTEM}]},
        {"role": "user", "content": [{"type": "text", "text": f"Language: {body.language}\nContent to assess:\n{body.text}\nReturn JSON only with: riskLevel, score 0-100, confidence 0-100, summary, signals, actions, language."}]}
    ]
    prompt = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = processor(text=[prompt], return_tensors="pt").to(model.device)
    with torch.inference_mode():
        ids = model.generate(**inputs, max_new_tokens=700, do_sample=False)
    generated = ids[:, inputs.input_ids.shape[1]:]
    text = processor.batch_decode(generated, skip_special_tokens=True)[0]

    # Production will use strict structured decoding + validation.
    # Until then, fail closed if model output is not valid JSON.
    import json
    try:
        data = json.loads(text)
        return AnalyzeResponse(**data, model="PheleCheck Sentinel-1", version="1.0", language=data.get("language", body.language))
    except Exception:
        return AnalyzeResponse(
            riskLevel="unknown",
            score=50,
            confidence=20,
            summary="Sentinel could not produce a validated result. Verify independently before paying.",
            signals=[Signal(title="Analysis validation failed", detail="The model output did not pass strict validation.", severity="warning")],
            actions=["Do not send money until the request is independently verified."],
            language=body.language
        )
