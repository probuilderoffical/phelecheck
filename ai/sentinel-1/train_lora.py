"""Sentinel-1 LoRA fine-tuning entry point.

This is intentionally offline training, not live learning from user traffic.
Input JSONL must already be de-identified, reviewed, deduplicated and approved.
"""
import os
from datasets import load_dataset
from transformers import AutoProcessor, AutoModelForImageTextToText, TrainingArguments
from peft import LoraConfig
from trl import SFTTrainer

MODEL_ID = os.getenv("SENTINEL_BASE_MODEL", "Qwen/Qwen3-VL-4B-Instruct")
DATASET = os.getenv("SENTINEL_TRAIN_JSONL", "approved_train.jsonl")
OUTPUT = os.getenv("SENTINEL_OUTPUT", "./sentinel-1-lora")

processor = AutoProcessor.from_pretrained(MODEL_ID, trust_remote_code=True)
model = AutoModelForImageTextToText.from_pretrained(
    MODEL_ID,
    torch_dtype="auto",
    device_map="auto",
    trust_remote_code=True,
)

dataset = load_dataset("json", data_files=DATASET, split="train")

lora = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
)

args = TrainingArguments(
    output_dir=OUTPUT,
    num_train_epochs=2,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=16,
    learning_rate=2e-5,
    logging_steps=10,
    save_steps=200,
    bf16=True,
    report_to="none",
)

def format_example(example):
    return example["text"]

trainer = SFTTrainer(
    model=model,
    args=args,
    train_dataset=dataset,
    peft_config=lora,
    processing_class=processor.tokenizer,
    formatting_func=format_example,
)
trainer.train()
trainer.save_model(OUTPUT)
