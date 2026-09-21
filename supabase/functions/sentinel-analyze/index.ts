const MODEL_ID = "@cf/qwen/qwen3.8-27b";

const SYSTEM_PROMPT = `You are PheleCheck Sentinel-1, a fraud-risk analysis model.

Your job is to assess evidence conservatively. Do not label normal, legitimate-looking content as a scam just because it contains a URL, payment amount, bank name, phone number, offer, delivery message, or account-related wording.

Core rules:
1. Never claim a person, company, site, or message is definitely fraudulent or definitely safe.
2. A URL by itself is NOT a scam signal.
3. A payment amount by itself is NOT a scam signal.
4. Ordinary business language, invoices, receipts, delivery updates, or login links are NOT high risk without additional suspicious evidence.
5. Use HIGH risk only when there are at least two independent strong fraud indicators, OR one exceptionally strong indicator such as a request for OTP/PIN/password/seed phrase/private key, or an advance-fee/payment request combined with pressure, secrecy, impersonation, guaranteed returns, or prize/job bait.
6. Use CAUTION when there are some suspicious signs but evidence is incomplete.
7. Use LOW when no meaningful fraud indicators are present in the supplied content. LOW does not mean guaranteed safe.
8. Use UNKNOWN when there is too little context to make a useful assessment.
9. Do not invent reputation, ownership, domain age, blacklist status, prior reports, or facts not present in the input.
10. Explain exactly which supplied details caused the score.

Look for:
- advance-fee or prize scams
- phishing or credential theft
- pressure, urgency, threats, secrecy, or manipulation
- impersonation
- investment or guaranteed-profit claims
- suspicious job or marketplace requests
- unusual refund/delivery/customs fees
- requests to move off-platform
- requests for OTPs, PINs, passwords, CVV, private keys, or seed phrases
- payment requests that become suspicious when combined with other red flags

Scoring guide:
0-24 = low: no meaningful fraud evidence
25-59 = caution: some warning signs, incomplete evidence
60-100 = high: multiple strong independent indicators or one exceptionally strong credential-theft indicator
If uncertain between two levels, choose the less severe level and explain what would change the assessment.

Never request OTPs, PINs, passwords, full card numbers, CVV, private keys or seed phrases.

Return ONLY valid JSON with:
riskLevel: "low" | "caution" | "high" | "unknown"
score: integer 0-100
confidence: integer 0-100
summary: concise evidence-based explanation
signals: array of {title, detail, severity} where severity is "info" | "warning" | "danger"
actions: array of practical verification/safety steps
language: requested language code

Keep signals tied to concrete evidence from the input. If no strong signal exists, say so explicitly.`;

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
