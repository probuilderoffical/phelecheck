const MODEL_ID = "@cf/qwen/qwen3.8-27b";

const SYSTEM_PROMPT = `You are PheleCheck Sentinel-1, a fraud-risk analysis model.
Analyze only the evidence supplied by the user. Never claim that a person is definitely
a criminal and never claim that something is 100% safe.

Look for payment and advance-fee scams, phishing, credential theft, urgency, pressure,
secrecy, manipulation, impersonation, investment/profit claims, suspicious jobs,
marketplace or delivery scams, refunds, account-verification requests, missing
independent verification, and suspicious links or contact details.

Never request OTPs, PINs, passwords, full card numbers, private keys or seed phrases.

Return ONLY valid JSON with:
riskLevel: "low" | "caution" | "high" | "unknown"
score: integer 0-100
confidence: integer 0-100
summary: concise explanation
signals: array of {title, detail, severity} where severity is "info" | "warning" | "danger"
actions: array of practical verification/safety steps
language: requested language code

If evidence is insufficient, use "unknown" or "caution" rather than guessing.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractText(result: any): string {
  if (typeof result === "string") return result;
  if (typeof result?.response === "string") return result.response;
  if (typeof result?.result?.response === "string") return result.result.response;
  const choice = result?.choices?.[0]?.message?.content ?? result?.result?.choices?.[0]?.message?.content;
  if (typeof choice === "string") return choice;
  return JSON.stringify(result ?? {});
}

function parseModelJson(text: string) {
  let cleaned = text.trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

function normalize(data: any, language: string) {
  const allowedRisk = new Set(["low", "caution", "high", "unknown"]);
  const riskLevel = allowedRisk.has(data?.riskLevel) ? data.riskLevel : "unknown";

  const rawScore = Number(data?.score ?? 50);
  const rawConfidence = Number(data?.confidence ?? 20);

  return {
    model: "PheleCheck Sentinel-1",
    version: "1.1-cloudflare-via-supabase",
    riskLevel,
    score: Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 50,
    confidence: Number.isFinite(rawConfidence)
      ? Math.max(0, Math.min(100, Math.round(rawConfidence)))
      : 20,
    summary: String(data?.summary ?? "Verify independently before paying.").slice(0, 1500),
    signals: Array.isArray(data?.signals) ? data.signals.slice(0, 8) : [],
    actions: Array.isArray(data?.actions) ? data.actions.map(String).slice(0, 8) : [],
    language: String(data?.language ?? language).slice(0, 12),
    source: "sentinel",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");

  if (req.method === "GET") {
    return json({
      ok: Boolean(accountId && apiToken),
      service: "PheleCheck Sentinel-1 Gateway",
      model: MODEL_ID,
      configured: Boolean(accountId && apiToken),
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!accountId || !apiToken) {
    return json({ error: "Sentinel gateway is not configured" }, 503);
  }

  try {
    const body = await req.json();
    const text = String(body?.text ?? "").trim().slice(0, 12000);
    const language = String(body?.language ?? "en").trim().slice(0, 12) || "en";

    if (!text) return json({ error: "text is required" }, 400);

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Requested language: ${language}\n\nContent to assess:\n${text}\n\nReturn strict JSON only.`,
            },
          ],
          max_completion_tokens: 800,
          temperature: 0.1,
        }),
      },
    );

    const cloudflare = await cfResponse.json();

    if (!cfResponse.ok || cloudflare?.success === false) {
      const message =
        cloudflare?.errors?.[0]?.message ??
        cloudflare?.error ??
        `Cloudflare returned HTTP ${cfResponse.status}`;
      return json({ error: String(message).slice(0, 500) }, 502);
    }

    const raw = extractText(cloudflare?.result ?? cloudflare);
    const parsed = parseModelJson(raw);

    return json(normalize(parsed, language));
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message.slice(0, 500) : "Unknown Sentinel error",
      },
      500,
    );
  }
});
