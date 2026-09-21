import { analyzeLocally, RiskAnalysis } from "@/services/riskEngine";
import { supabase } from "@/lib/supabase";

let cachedEndpoint: string | null | undefined;
let cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000;

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

export async function analyzeWithSentinel(input: string | SentinelInput, language = "en"): Promise<RiskAnalysis> {
  const payload: SentinelInput = typeof input === "string" ? { text: input } : input;
  const endpoint = await getEndpoint();
  const fallbackText = payload.text?.trim() || "Image content could not be analyzed by the cloud model.";

  if (!endpoint) return analyzeLocally(fallbackText, language);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, language })
    });

    if (!response.ok) throw new Error(`Sentinel server returned ${response.status}`);
    return { ...(await response.json()), source: "sentinel" } as RiskAnalysis;
  } catch {
    return analyzeLocally(fallbackText, language);
  }
}
