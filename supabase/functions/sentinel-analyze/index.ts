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

Core rules:
1. Never claim a person, company, site, or message is definitely fraudulent or definitely safe.
2. A URL by itself is NOT a scam signal.
3. A payment amount by itself is NOT a scam signal.
4. Ordinary business language, invoices, receipts, delivery updates, or login links are NOT high risk without additional suspicious evidence.
5. Use HIGH only when there are at least two independent strong fraud indicators, OR one exceptionally strong indicator such as a request for OTP/PIN/password/CVV/seed phrase/private key.
6. Use CAUTION when there are some suspicious signs but evidence is incomplete.
7. Use LOW when no meaningful fraud indicators are present. LOW does not mean guaranteed safe.
8. Use UNKNOWN when there is too little context to make a useful assessment.
9. Do not invent reputation, ownership, domain age, blacklist status, prior reports, or facts not present in the input or supplied web evidence.
10. Explain exactly which supplied details caused the score.
11. Live web evidence is supporting evidence, not absolute proof. A malicious verdict is meaningful evidence. No malicious verdict or no historical record is NOT proof that a site is safe.
12. If web evidence is unavailable, do not pretend that a web check succeeded.

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
- payment requests combined with other red flags

Scoring guide:
0-24 = low: no meaningful fraud evidence
25-59 = caution: some warning signs, incomplete evidence
60-100 = high: multiple strong independent indicators or one exceptionally strong credential-theft indicator
If uncertain between two levels, choose the less severe level and explain what would change the assessment.

Return ONLY valid JSON with:
riskLevel: "low" | "caution" | "high" | "unknown"
score: integer 0-100
confidence: integer 0-100
summary: concise evidence-based explanation
signals: array of {title, detail, severity} where severity is "info" | "warning" | "danger"
actions: array of practical verification/safety steps
language: requested language code

Keep every signal tied to concrete evidence from the input or supplied web evidence.`;

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
  const cleaned = text.trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Model did not return valid JSON");
  }
}

function domainsFromText(text: string): string[] {
  const found = new Set<string>();

  const urlMatches = text.match(/https?:\/\/[^\s<>"')\]}]+/gi) ?? [];
  for (const raw of urlMatches) {
    try {
      const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
      if (isPublicLookingDomain(host)) found.add(host);
    } catch {}
  }

  const domainMatches = text.match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi) ?? [];
  for (const raw of domainMatches) {
    const host = raw.toLowerCase().replace(/^www\./, "");
    if (isPublicLookingDomain(host)) found.add(host);
  }

  return [...found].slice(0, 2);
}

function isPublicLookingDomain(host: string) {
  if (!host || host.length > 253) return false;
  if (host === "localhost" || host.endsWith(".local")) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  return /^[a-z0-9.-]+\.[a-z]{2,24}$/i.test(host);
}

async function searchUrlScanner(accountId: string, apiToken: string, domain: string): Promise<WebEvidence> {
  try {
    const q = `page.domain:"${domain}"`;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/search?q=${encodeURIComponent(q)}&size=5`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return {
        provider: "Cloudflare URL Scanner",
        domain,
        status: "unavailable",
        scansFound: 0,
        maliciousMatches: 0,
        summary: "Live URL Scanner evidence was unavailable for this check.",
      };
    }

    const body = await response.json();
    const results = Array.isArray(body?.result?.results)
      ? body.result.results
      : Array.isArray(body?.results)
      ? body.results
      : [];

    if (!results.length) {
      return {
        provider: "Cloudflare URL Scanner",
        domain,
        status: "no-records",
        scansFound: 0,
        maliciousMatches: 0,
        summary: "No recent public URL Scanner record was found. This is not proof that the site is safe.",
      };
    }

    const maliciousMatches = results.filter((item: any) => item?.verdicts?.malicious === true).length;
    const latestScanAt = results
      .map((item: any) => item?.task?.time)
      .filter(Boolean)
      .sort()
      .reverse()[0];

    return {
      provider: "Cloudflare URL Scanner",
      domain,
      status: "checked",
      scansFound: results.length,
      maliciousMatches,
      latestScanAt,
      summary: maliciousMatches > 0
        ? `Cloudflare URL Scanner returned ${maliciousMatches} malicious verdict(s) among ${results.length} recent scan record(s).`
        : `Cloudflare URL Scanner returned ${results.length} recent scan record(s) with no malicious verdict in this sample. This is not a safety guarantee.`,
    };
  } catch {
    return {
      provider: "Cloudflare URL Scanner",
      domain,
      status: "unavailable",
      scansFound: 0,
      maliciousMatches: 0,
      summary: "Live URL Scanner evidence was unavailable for this check.",
    };
  }
}

function normalize(data: any, language: string, webEvidence: WebEvidence[]) {
  const allowedRisk = new Set(["low", "caution", "high", "unknown"]);
  const riskLevel = allowedRisk.has(data?.riskLevel) ? data.riskLevel : "unknown";
  const rawScore = Number(data?.score ?? 50);
  const rawConfidence = Number(data?.confidence ?? 20);

  return {
    model: "PheleCheck Sentinel-1",
    version: "1.2-web-evidence",
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
      webEvidence: "Cloudflare URL Scanner",
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!accountId || !apiToken) return json({ error: "Sentinel gateway is not configured" }, 503);

  try {
    const body = await req.json();
    const text = String(body?.text ?? "").trim().slice(0, 12000);
    const language = String(body?.language ?? "en").trim().slice(0, 12) || "en";
    if (!text) return json({ error: "text is required" }, 400);

    const domains = domainsFromText(text);
    const webEvidence = await Promise.all(domains.map((domain) => searchUrlScanner(accountId, apiToken, domain)));

    const evidenceText = webEvidence.length
      ? webEvidence.map((item) => JSON.stringify(item)).join("\n")
      : "No URL/domain was found in the supplied content, so no URL Scanner lookup was performed.";

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
              content: `Requested language: ${language}

Content to assess:
${text}

LIVE WEB THREAT EVIDENCE:
${evidenceText}

Important: Treat "no records", "no malicious verdict", and "unavailable" as non-conclusive. Never turn absence of a bad record into a claim that a site is safe.

Return strict JSON only.`,
            },
          ],
          max_completion_tokens: 900,
          temperature: 0.05,
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
    return json(normalize(parsed, language, webEvidence));
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message.slice(0, 500) : "Unknown Sentinel error" },
      500,
    );
  }
});
