import { analyzeLocally, RiskAnalysis } from "@/services/riskEngine";

const endpoint = process.env.EXPO_PUBLIC_SENTINEL_URL?.replace(/\/$/, "");

export async function analyzeWithSentinel(text: string, language = "en"): Promise<RiskAnalysis> {
  if (!endpoint) return analyzeLocally(text, language);

  try {
    const response = await fetch(`${endpoint}/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language })
    });

    if (!response.ok) throw new Error(`Sentinel server returned ${response.status}`);
    return { ...(await response.json()), source: "sentinel" } as RiskAnalysis;
  } catch {
    return analyzeLocally(text, language);
  }
}
