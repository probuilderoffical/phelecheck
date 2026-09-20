export interface Env {
  AI: Ai;
}

const MODEL = "@cf/qwen/qwen3.8-27b";

const SYSTEM = `You are PheleCheck Sentinel-1, a fraud-risk analysis model.

Analyze only evidence supplied in the user's content. Never claim certainty, never
declare a person criminal, and never say something is 100% safe.

Look for:
- payment and advance-fee scam patterns
- phishing and credential theft
- urgency, pressure, secrecy, manipulation and impersonation
- guaranteed-return or unrealistic profit claims
- suspicious job, marketplace, delivery, refund and account-verification requests
- missing independent verification
- suspicious links and contact details when provided

Never request OTPs, PINs, passwords, full card numbers, private keys or seed phrases.

Return ONLY valid JSON with:
riskLevel: "low" | "caution" | "high" | "unknown"
score: integer 0-100
confidence: integer 0-100
summary: string
signals: array of { title, detail, severity }, severity = info | warning | danger
actions: array of strings
language: requested language code

If evidence is insufficient, use unknown or caution instead of guessing.`;

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}

function extractText(result: any): string {
  if (typeof result === "string") return result;
  if (typeof result?.response === "string") return result.response;
  const choice = result?.choices?.[0]?.message?.content;
  if (typeof choice === "string") return choice;
  return JSON.stringify(result ?? {});
}

function parseJson(text: string) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("No valid JSON returned");
  }
}

function normalized(data: any, language: string) {
  const risk = ["low", "caution", "high", "unknown"].includes(data?.riskLevel)
    ? data.riskLevel
    : "unknown";

  const score = Math.max(0, Math.min(100, Number(data?.score ?? 50)));
  const confidence = Math.max(0, Math.min(100, Number(data?.confidence ?? 20)));

  return {
    model: "PheleCheck Sentinel-1",
    version: "1.0-cloudflare",
    riskLevel: risk,
    score: Number.isFinite(score) ? Math.round(score) : 50,
    confidence: Number.isFinite(confidence) ? Math.round(confidence) : 20,
    summary: String(data?.summary ?? "Verify independently before paying.").slice(0, 1500),
    signals: Array.isArray(data?.signals) ? data.signals.slice(0, 8) : [],
    actions: Array.isArray(data?.actions) ? data.actions.map(String).slice(0, 8) : [],
    language: String(data?.language ?? language).slice(0, 12),
    source: "sentinel",
  };
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors() });

    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: "PheleCheck Sentinel-1",
        version: "1.0-cloudflare",
        base_model: MODEL,
      });
    }

    if (request.method !== "POST" || url.pathname !== "/v1/analyze") {
      return json({ error: "Not found" }, 404);
    }

    try {
      const body = await request.json<any>();
      const text = String(body?.text ?? "").trim().slice(0, 12000);
      const language = String(body?.language ?? "en").trim().slice(0, 12) || "en";

      if (!text) return json({ error: "text is required" }, 400);

      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Requested language: ${language}\n\nContent to assess:\n${text}\n\nReturn strict JSON only.`,
          },
        ],
        max_completion_tokens: 900,
        temperature: 0.1,
        chat_template_kwargs: { enable_thinking: false },
      } as any);

      const raw = extractText(result);
      const data = parseJson(raw);
      return json(normalized(data, language));
    } catch (error: any) {
      return json({
        model: "PheleCheck Sentinel-1",
        version: "1.0-cloudflare",
        riskLevel: "unknown",
        score: 50,
        confidence: 20,
        summary: "Sentinel could not produce a validated result. Verify independently before paying.",
        signals: [{
          title: "Analysis validation failed",
          detail: "The AI response did not pass PheleCheck validation.",
          severity: "warning",
        }],
        actions: [
          "Do not send money until the request is independently verified.",
          "Never share OTPs, PINs, passwords, private keys or seed phrases.",
        ],
        language: "en",
        source: "sentinel",
        error: String(error?.message ?? "unknown error").slice(0, 300),
      }, 200);
    }
  },
} satisfies ExportedHandler<Env>;
