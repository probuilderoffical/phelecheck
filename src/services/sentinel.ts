import { analyzeLocally, RiskAnalysis } from "@/services/riskEngine";
import { supabase } from "@/lib/supabase";
import { redactSensitiveText } from "@/services/redaction";

let cachedEndpoint: string | null | undefined;
let cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 25_000;

export type SentinelInput = {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  inputType?: string;
};

async function getEndpoint() {
  const envEndpoint = process.env.EXPO_PUBLIC_SENTINEL_URL?.replace(/\/$/, "");
  if (envEndpoint) return envEndpoint;

  if (cachedEndpoint !== undefined && Date.now() - cachedAt < CACHE_MS) return cachedEndpoint;

  const { data } = await supabase
    .from("runtime_config")
    .select("value")
    .eq("key", "sentinel_endpoint")
    .maybeSingle();

  const raw = (data?.value as any)?.url;
  cachedEndpoint = typeof raw === "string" && raw.trim() ? raw.replace(/\/$/, "") : null;
  cachedAt = Date.now();
  return cachedEndpoint;
}

function unavailableVision(language: string): RiskAnalysis {
  return {
    model: "PheleCheck Sentinel-1",
    version: "1.3-client-fallback",
    riskLevel: "unknown",
    score: 0,
    confidence: 0,
    summary: "The image could not be analyzed right now. No risk conclusion was made.",
    signals: [{
      title: "Cloud image analysis unavailable",
      detail: "PheleCheck could not inspect this image, so it did not guess whether the content is safe or risky.",
      severity: "info"
    }],
    actions: [
      "Try the image check again with a clear screenshot or QR image.",
      "If money or account access is involved, verify independently through an official channel."
    ],
    language,
    source: "local-fallback"
  };
}

export async function analyzeWithSentinel(input: string | SentinelInput, language = "en"): Promise<RiskAnalysis> {
  const rawPayload: SentinelInput = typeof input === "string" ? { text: input } : input;
  const payload: SentinelInput = {
    ...rawPayload,
    text: rawPayload.text ? redactSensitiveText(rawPayload.text) : rawPayload.text
  };
  const endpoint = await getEndpoint();
  const fallbackText = payload.text?.trim() || "";

  if (!endpoint) {
    if (payload.imageBase64) return unavailableVision(language);
    return analyzeLocally(fallbackText, language);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, language }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Sentinel server returned ${response.status}`);
    return { ...(await response.json()), source: "sentinel" } as RiskAnalysis;
  } catch {
    if (payload.imageBase64) return unavailableVision(language);
    return analyzeLocally(fallbackText, language);
  } finally {
    clearTimeout(timeout);
  }
}
