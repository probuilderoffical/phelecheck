const MODEL_ID = "@cf/qwen/qwen3.8-27b";

type WebEvidence = {
  provider: "Cloudflare URL Scanner";
  domain: string;
  status: "checked" | "no-records" | "unavailable";
  scansFound: number;
  maliciousMatches: number;
  latestScanAt?: string;
  summary: string;
};

const SYSTEM_PROMPT = `You are PheleCheck Sentinel-1, a fraud-risk analysis model.

Assess evidence conservatively. Never label normal content as a scam just because it contains a URL, payment amount, bank name, phone number, offer, delivery update, invoice, receipt, or account-related wording.

Rules:
1. Never claim something is definitely fraudulent or definitely safe.
2. A URL, phone number, payment amount, invoice, receipt, delivery update, or bank name alone is NOT a scam signal.
3. HIGH requires at least two independent strong fraud indicators, except an explicit request for OTP/PIN/password/CVV/seed phrase/private key can be high by itself.
4. CAUTION means suspicious signs exist but evidence is incomplete.
5. LOW means no meaningful fraud indicators were found; it is not a guarantee of safety.
6. UNKNOWN means evidence is too limited or unreadable.
7. Never invent domain reputation, ownership, blacklist status, QR destination, company identity, or facts not supplied in the input/web evidence.
8. Treat live web evidence as supporting evidence only. "No records" or "no malicious verdict" never proves safety.
9. For screenshots, only cite text/details you can actually read.
10. For QR images, report the encoded destination/value only if you can reliably read it; otherwise say it was unreadable.
11. Tie every risk signal to concrete evidence.

Strong patterns include credential theft, advance fees, guaranteed profits, prize/job bait plus payment, impersonation plus pressure, secrecy, threats, moving off-platform, gift cards/crypto/wire demands, and urgent payment combined with another red flag.

Scoring:
0-24 low
25-59 caution
60-100 high
When uncertain between two levels, choose the less severe one.

Return ONLY valid JSON:
{
  "riskLevel":"low|caution|high|unknown",
  "score":0-100,
  "confidence":0-100,
  "summary":"concise evidence-based explanation",
  "signals":[{"title":"...","detail":"...","severity":"info|warning|danger"}],
  "actions":["..."],
  "language":"requested language code"
}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function consumeQuota(req: Request, limit = 40) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return { allowed: false, remaining: 0, error: true };

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const ua = (req.headers.get("user-agent") || "unknown").slice(0, 120);
  const subject = await sha256(`sentinel|${ip}|${ua}`);

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_sentinel_quota`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_subject_hash: subject, p_limit: limit }),
  });

  if (!response.ok) return { allowed: false, remaining: 0, error: true };
  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  return {
    allowed: row?.allowed !== false,
    remaining: Number(row?.remaining ?? 0),
  };
}

function extractText(result: any): string {
  if (typeof result === "string") return result;
  if (typeof result?.response === "string") return result.response;
  const choice = result?.choices?.[0]?.message?.content ?? result?.result?.choices?.[0]?.message?.content;
  if (typeof choice === "string") return choice;
  return JSON.stringify(result ?? {});
}

function parseModelJson(text: string) {
  const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Model did not return valid JSON");
  }
}

function isPublicLookingDomain(host: string) {
  if (!host || host.length > 253 || host === "localhost" || host.endsWith(".local")) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  return /^[a-z0-9.-]+\.[a-z]{2,24}$/i.test(host);
}

function domainsFromText(text: string): string[] {
  const found = new Set<string>();
  for (const raw of text.match(/https?:\/\/[^\s<>"')\]}]+/gi) ?? []) {
    try {
      const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
      if (isPublicLookingDomain(host)) found.add(host);
    } catch {}
  }
  for (const raw of text.match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi) ?? []) {
    const host = raw.toLowerCase().replace(/^www\./, "");
    if (isPublicLookingDomain(host)) found.add(host);
  }
  return [...found].slice(0, 2);
}

async function searchUrlScanner(accountId: string, apiToken: string, domain: string): Promise<WebEvidence> {
  try {
    const q = `page.domain:"${domain}"`;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/search?q=${encodeURIComponent(q)}&size=5`,
      { headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" } },
    );
    if (!response.ok) throw new Error("scanner unavailable");
    const body = await response.json();
    const results = Array.isArray(body?.result?.results) ? body.result.results : Array.isArray(body?.results) ? body.results : [];
    if (!results.length) return {
      provider: "Cloudflare URL Scanner", domain, status: "no-records", scansFound: 0, maliciousMatches: 0,
      summary: "No recent public URL Scanner record was found. This is not proof that the site is safe.",
    };
    const maliciousMatches = results.filter((item: any) => item?.verdicts?.malicious === true).length;
    const latestScanAt = results.map((item: any) => item?.task?.time).filter(Boolean).sort().reverse()[0];
    return {
      provider: "Cloudflare URL Scanner", domain, status: "checked", scansFound: results.length, maliciousMatches, latestScanAt,
      summary: maliciousMatches > 0
        ? `Cloudflare URL Scanner returned ${maliciousMatches} malicious verdict(s) among ${results.length} recent scan record(s).`
        : `Cloudflare URL Scanner returned ${results.length} recent scan record(s) with no malicious verdict in this sample. This is not a safety guarantee.`,
    };
  } catch {
    return {
      provider: "Cloudflare URL Scanner", domain, status: "unavailable", scansFound: 0, maliciousMatches: 0,
      summary: "Live URL Scanner evidence was unavailable for this check.",
    };
  }
}

function normalize(data: any, language: string, webEvidence: WebEvidence[]) {
  const allowedRisk = new Set(["low", "caution", "high", "unknown"]);
  const riskLevel = allowedRisk.has(data?.riskLevel) ? data.riskLevel : "unknown";
  const score = Number(data?.score);
  const confidence = Number(data?.confidence);
  return {
    model: "PheleCheck Sentinel-1",
    version: "1.3-vision-web-guarded",
    riskLevel,
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence))) : 20,
    summary: String(data?.summary ?? "Verify independently before paying.").slice(0, 1500),
    signals: Array.isArray(data?.signals) ? data.signals.slice(0, 8).map((s:any)=>({
      title:String(s?.title??"Signal").slice(0,160),
      detail:String(s?.detail??"").slice(0,800),
      severity:["info","warning","danger"].includes(s?.severity)?s.severity:"info"
    })) : [],
    actions: Array.isArray(data?.actions) ? data.actions.map(String).slice(0, 8) : [],
    language: String(data?.language ?? language).slice(0, 12),
    source: "sentinel",
    webEvidence,
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
      vision: true,
      webEvidence: "Cloudflare URL Scanner",
      rateLimited: true,
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!accountId || !apiToken) return json({ error: "Sentinel gateway is not configured" }, 503);

  const quota = await consumeQuota(req, 40);
  if ((quota as any).error) {
    return json({ error: "Safety gateway is temporarily unavailable. Please try again shortly." }, 503);
  }
  if (!quota.allowed) {
    return json({ error: "Too many checks. Please try again later." }, 429, { "Retry-After": "3600" });
  }

  try {
    const body = await req.json();
    const text = String(body?.text ?? "").trim().slice(0, 12000);
    const language = String(body?.language ?? "en").trim().slice(0, 12) || "en";
    const inputType = String(body?.inputType ?? "message").slice(0, 24);
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64.trim() : "";
    const mimeType = ["image/jpeg","image/png","image/webp"].includes(body?.mimeType) ? body.mimeType : "image/jpeg";

    if (!text && !imageBase64) return json({ error: "text or image is required" }, 400);
    if (imageBase64.length > 7_000_000) return json({ error: "Image is too large. Choose a smaller image." }, 413);

    const domains = domainsFromText(text);
    const webEvidence = await Promise.all(domains.map((domain) => searchUrlScanner(accountId, apiToken, domain)));
    const evidenceText = webEvidence.length
      ? webEvidence.map((item) => JSON.stringify(item)).join("\n")
      : "No URL/domain was found in the text supplied to the live scanner.";

    const userInstruction = `Requested language: ${language}
Input type: ${inputType}

Content/context:
${text || "(image only)"}

LIVE WEB THREAT EVIDENCE:
${evidenceText}

Treat no-record/no-malicious results as non-conclusive. Return strict JSON only.`;

    const userContent: any = imageBase64
      ? [
          { type: "text", text: userInstruction },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ]
      : userInstruction;

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          max_completion_tokens: 900,
          temperature: 0.05,
        }),
      },
    );

    const cloudflare = await cfResponse.json();
    if (!cfResponse.ok || cloudflare?.success === false) {
      const message = cloudflare?.errors?.[0]?.message ?? cloudflare?.error?.message ?? cloudflare?.error ?? `Cloudflare returned HTTP ${cfResponse.status}`;
      return json({ error: String(message).slice(0, 500) }, 502);
    }

    const parsed = parseModelJson(extractText(cloudflare));
    return json(normalize(parsed, language, webEvidence), 200, { "X-RateLimit-Remaining": String(quota.remaining) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message.slice(0, 500) : "Unknown Sentinel error" }, 500);
  }
});
