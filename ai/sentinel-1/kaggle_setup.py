# PheleCheck Sentinel-1 — Kaggle temporary GPU server
#
# Kaggle notebook setup:
# 1. Accelerator: GPU T4 x2
# 2. Internet: ON
# 3. Run this file's cells/commands in order.
#
# This is temporary development hosting only. The public URL changes when the
# Kaggle session restarts.

# CELL 1 — install
# !pip install -q -U fastapi "uvicorn[standard]" transformers accelerate qwen-vl-utils pillow pydantic bitsandbytes
# !wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /kaggle/working/cloudflared
# !chmod +x /kaggle/working/cloudflared

# CELL 2 — write server
SERVER_CODE = r'''
import json
import os
from typing import Literal

import torch
from fastapi import FastAPI
from pydantic import BaseModel, Field
from transformers import AutoProcessor, Qwen3VLForConditionalGeneration, BitsAndBytesConfig

MODEL_ID = "Qwen/Qwen3-VL-4B-Instruct"

app = FastAPI(title="PheleCheck Sentinel-1", version="1.0")

quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)

processor = AutoProcessor.from_pretrained(MODEL_ID)
model = Qwen3VLForConditionalGeneration.from_pretrained(
    MODEL_ID,
    device_map="auto",
    quantization_config=quant,
    torch_dtype="auto",
)

SYSTEM = """You are PheleCheck Sentinel-1, a fraud-risk analysis model.
Analyze only evidence present in the input.
Never claim certainty or declare a person criminal.
Identify scam/fraud indicators, missing verification, payment risk,
urgency/manipulation, impersonation risk, suspicious links, and credential theft.
Never request OTPs, PINs, passwords, full card numbers, private keys, or seed phrases.
Return JSON only.
Allowed riskLevel values: low, caution, high, unknown.
"""

class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    language: str = "en"

class Signal(BaseModel):
    title: str
    detail: str
    severity: Literal["info", "warning", "danger"]

class AnalyzeResponse(BaseModel):
    model: str = "PheleCheck Sentinel-1"
    version: str = "1.0-kaggle"
    riskLevel: Literal["low", "caution", "high", "unknown"]
    score: int
    confidence: int
    summary: str
    signals: list[Signal]
    actions: list[str]
    language: str
    source: str = "sentinel"

@app.get("/health")
def health():
    return {"ok": True, "model": "PheleCheck Sentinel-1", "base": MODEL_ID}

@app.post("/v1/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest):
    prompt = f"""Language: {body.language}
Content to assess:
{body.text}

Return strict JSON with these fields:
riskLevel, score (0-100), confidence (0-100), summary,
signals (array of title/detail/severity), actions (array), language.
"""

    messages = [
        {"role": "system", "content": [{"type": "text", "text": SYSTEM}]},
        {"role": "user", "content": [{"type": "text", "text": prompt}]},
    ]

    text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = processor(text=[text], return_tensors="pt").to(model.device)

    with torch.inference_mode():
        output_ids = model.generate(**inputs, max_new_tokens=700, do_sample=False)

    generated = output_ids[:, inputs.input_ids.shape[1]:]
    raw = processor.batch_decode(generated, skip_special_tokens=True)[0].strip()

    try:
        data = json.loads(raw)
        data["model"] = "PheleCheck Sentinel-1"
        data["version"] = "1.0-kaggle"
        data["source"] = "sentinel"
        return AnalyzeResponse(**data)
    except Exception:
        return AnalyzeResponse(
            riskLevel="unknown",
            score=50,
            confidence=20,
            summary="Sentinel could not validate its output. Verify independently before paying.",
            signals=[{
                "title": "Analysis validation failed",
                "detail": "The AI response did not pass strict output validation.",
                "severity": "warning"
            }],
            actions=["Do not send money until the request is independently verified."],
            language=body.language
        )
'''

with open("/kaggle/working/sentinel_server.py", "w") as f:
    f.write(SERVER_CODE)

print("Server file created.")

# CELL 3 — start API
# import subprocess, time
# api = subprocess.Popen(
#     ["python", "-m", "uvicorn", "sentinel_server:app", "--host", "0.0.0.0", "--port", "8000"],
#     cwd="/kaggle/working"
# )
# time.sleep(20)
# print("API started", api.pid)

# CELL 4 — open temporary HTTPS tunnel
# tunnel = subprocess.Popen(
#     ["/kaggle/working/cloudflared", "tunnel", "--url", "http://127.0.0.1:8000", "--no-autoupdate"],
#     stdout=subprocess.PIPE,
#     stderr=subprocess.STDOUT,
#     text=True
# )
#
# import re
# public_url = None
# while True:
#     line = tunnel.stdout.readline()
#     print(line, end="")
#     m = re.search(r"https://[-a-z0-9]+\.trycloudflare\.com", line)
#     if m:
#         public_url = m.group(0)
#         break
#
# print("\nSENTINEL URL:", public_url)
# print("Health:", public_url + "/health")
#
# IMPORTANT:
# Copy the SENTINEL URL. Update Supabase runtime_config -> sentinel_endpoint.
