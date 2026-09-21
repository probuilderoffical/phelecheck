const TEXT_MODEL_ID = "@cf/zai-org/glm-4.7-flash";
const TEXT_FALLBACK_MODEL_ID = "@cf/qwen/qwen3-30b-a3b-fp8";
const VISION_MODEL_ID = "@cf/qwen/qwen3.8-27b";

type WebEvidence = {
  provider: string;
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
12. Do not answer with a generic "safe" verdict. Explain what was checked, what was suspicious or reassuring, and what is still unknown.
13. Distinguish normal personal payment requests from fraud patterns. "Pay me back" alone is not fraud.
14. Treat off-platform marketplace moves, remote-access/support requests, loan/recovery upfront fees, romance/emergency money requests, refund-overpayment requests, and impersonation pressure as context-dependent warning signals.
15. If live page/search evidence is present, use it as evidence but never let a clean result override strong scam language.

Strong patterns include credential theft, advance fees, guaranteed profits, prize/job bait plus payment, impersonation plus pressure, secrecy, threats, moving off-platform combined with payment pressure, gift cards/crypto/wire demands, remote-access requests, and urgent payment combined with another red flag.

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
  const subject = await sha256(`sentinel|${ip}`);

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


function firstPublicUrl(text: string): string | null {
  const direct = text.match(/https?:\/\/[^\s<>"')\]}]+/i)?.[0];
  if (direct) {
    try {
      const parsed = new URL(direct);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (isPublicLookingDomain(host)) return parsed.toString();
    } catch {}
  }
  const domain = domainsFromText(text)[0];
  return domain ? `https://${domain}/` : null;
}

async function fetchLivePageContext(url: string | null) {
  if (!url) return { excerpt: "", evidence: null as WebEvidence | null };
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!isPublicLookingDomain(host)) return { excerpt: "", evidence: null as WebEvidence | null };

    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "text/plain",
        "User-Agent": "PheleCheck/1.0 fraud-risk verification"
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`reader HTTP ${response.status}`);
    const raw = (await response.text()).replace(/\u0000/g, "").trim();
    const excerpt = raw.slice(0, 6000);
    if (!excerpt) throw new Error("empty page");

    return {
      excerpt,
      evidence: {
        provider: "Jina Reader live page",
        domain: host,
        status: "checked" as const,
        scansFound: 1,
        maliciousMatches: 0,
        summary: "Live page content was fetched for analysis. Page content is context evidence, not a safety or reputation verdict.",
      }
    };
  } catch {
    try {
      const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
      return {
        excerpt: "",
        evidence: {
          provider: "Jina Reader live page",
          domain: host,
          status: "unavailable" as const,
          scansFound: 0,
          maliciousMatches: 0,
          summary: "Live page content could not be fetched for this check.",
        }
      };
    } catch {
      return { excerpt: "", evidence: null as WebEvidence | null };
    }
  }
}

async function searchUrlScanner(accountId: string, apiToken: string, domain: string): Promise<WebEvidence> {
  try {
    const q = `page.domain:"${domain}"`;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/search?q=${encodeURIComponent(q)}&size=5`,
      {
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000),
      },
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

function deterministicGuard(text: string) {
  const credentialRequest =
    /\b(send|share|enter|provide|tell|bhejo|batao|do)\b.{0,40}\b(otp|pin|password|cvv|seed phrase|private key)\b/i.test(text) ||
    /\b(otp|pin|password|cvv|seed phrase|private key)\b.{0,40}\b(send|share|enter|provide|tell|bhejo|batao|do)\b/i.test(text) ||
    /(otp|pin|password|cvv).{0,40}(بھیجو|بتاؤ|شیئر)/i.test(text);

  const payment = /(pay|payment|fee|wire|transfer|gift card|crypto|send money|paisa|paise|bhejo|ادائیگی|پیسے|पैसे भेजो)/i.test(text);
  const pressure = /(urgent|immediately|today|now|within an hour|within the next hour|in the next hour|next hour|limited time|act now|abhi|jaldi|فوری|ابھی)/i.test(text);
  const bait = /(prize|winner|job|processing fee|verification fee|guaranteed|double your money|profit|inaam|انعام|मुनाफा|इनाम|منافع|نوکری)/i.test(text);
  const secrecy = /(do not tell|don't tell|keep.*secret|kisi ko na|کسی کو نہ|किसी को मत बताना|किसी को मत बताओ)/i.test(text);
  const blockedThreat = /(account.*blocked|account.*band|account.*suspension|suspended|destroyed|closed|اکاؤنٹ.*بند)/i.test(text);
  const giftCardCodeRequest =
    /(gift card|gift cards).{0,50}(send|share|give|provide).{0,30}(code|codes)/i.test(text) ||
    /(send|share|give|provide).{0,30}(gift card|gift cards).{0,30}(code|codes)/i.test(text);

  const contextCount = [pressure, bait, secrecy, blockedThreat].filter(Boolean).length;

  if (credentialRequest) {
    return { high: true, score: 92, reason: "The content explicitly requests a sensitive authentication or wallet credential." };
  }
  if (giftCardCodeRequest) {
    return { high: true, score: 90, reason: "The content asks for gift card codes, a common irreversible-payment scam pattern." };
  }
  if (payment && (bait || contextCount >= 2)) {
    return { high: true, score: bait && contextCount >= 2 ? 90 : 84, reason: "The content combines a payment request with strong fraud-pressure signals." };
  }
  return { high: false, score: 0, reason: "" };
}

function safeFallback(text: string, language: string, webEvidence: WebEvidence[], reason: string) {
  const guard = deterministicGuard(text);
  const lower = text.toLowerCase();

  const strongTerms = [
    "send money", "pay now", "urgent payment", "advance fee", "processing fee",
    "verification fee", "job fee", "wire transfer", "gift card", "crypto profit",
    "guaranteed return", "double your money", "share otp", "send otp", "send pin",
    "seed phrase", "private key", "paise bhejo", "paisa bhejo", "jaldi pay",
    "فوری ادائیگی", "پیسے بھیجو", "منافع", "पैसे भेजो"
  ];
  const mediumTerms = [
    "limited time", "act now", "verify account", "account blocked", "account suspended",
    "click link", "claim prize", "winner", "prize", "refund fee", "delivery fee",
    "customs fee", "do not tell anyone", "keep this secret", "aaj hi", "abhi",
    "verify karo", "اکاؤنٹ بند", "انعام"
  ];
  const credentialTerms = ["otp", "pin", "password", "cvv", "seed phrase", "private key"];
  const paymentTerms = ["pay", "payment", "fee", "bank", "wallet", "transfer", "money", "crypto", "gift card"];
  const urgencyTerms = ["urgent", "immediately", "today", "now", "within 24 hours", "within an hour", "next hour", "limited time", "act now"];

  const strong = strongTerms.filter((term) => lower.includes(term));
  const medium = mediumTerms.filter((term) => lower.includes(term));
  const credentials = credentialTerms.filter((term) => lower.includes(term));
  const payments = paymentTerms.filter((term) => lower.includes(term));
  const urgency = urgencyTerms.filter((term) => lower.includes(term));
  const hasUrl = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|pk|uk|ae|in)\b)/i.test(text);
  const hasMoney = /(\$|€|£|₹|rs\.?|pkr|usd|eur|aed|\b\d{3,}(?:[.,]\d+)?\b)/i.test(text);
  const scannerBad = webEvidence.some((item) => item.provider === "Cloudflare URL Scanner" && item.maliciousMatches > 0);

  if (guard.high || scannerBad) {
    const detail = scannerBad
      ? "Live URL Scanner evidence includes a malicious verdict for a detected domain."
      : guard.reason;
    return {
      model: "PheleCheck Sentinel-1",
      version: "1.6-resilient-fusion",
      riskLevel: "high",
      score: scannerBad ? Math.max(88, guard.score) : guard.score,
      confidence: 86,
      summary: detail,
      signals: [{
        title: scannerBad ? "Live threat-intelligence match" : "Strong deterministic fraud signal",
        detail,
        severity: "danger"
      }, {
        title: "Cloud AI degraded",
        detail: reason,
        severity: "info"
      }],
      actions: [
        "Do not send money or share sensitive credentials.",
        "Verify the sender, website, or organization through an official channel you find independently."
      ],
      language,
      source: "local-fallback",
      webEvidence
    };
  }

  const independentStrongFactors = [
    strong.length > 0,
    credentials.length > 0,
    payments.length > 0 && urgency.length > 0,
    payments.length > 0 && medium.length > 0,
    credentials.length > 0 && hasUrl
  ].filter(Boolean).length;

  let score = 12;
  score += Math.min(strong.length, 3) * 18;
  score += Math.min(medium.length, 3) * 7;
  score += credentials.length ? 16 : 0;
  score += payments.length && urgency.length ? 12 : 0;
  score += hasMoney && payments.length ? 6 : 0;

  if (independentStrongFactors < 2) score = Math.min(score, 54);
  if (!strong.length && !medium.length && !credentials.length && !(payments.length && urgency.length)) {
    score = hasUrl || hasMoney ? 18 : 12;
  }
  score = Math.max(5, Math.min(96, score));

  const riskLevel = independentStrongFactors >= 2 && score >= 68
    ? "high"
    : score >= 34
    ? "caution"
    : "low";

  const signals: Array<{title:string;detail:string;severity:"info"|"warning"|"danger"}> = [];
  if (strong.length) signals.push({
    title: "Direct scam-style request",
    detail: "The content contains a direct payment, fee, credential, or guaranteed-return pattern that needs verification.",
    severity: independentStrongFactors >= 2 ? "danger" : "warning"
  });
  if (urgency.length && payments.length) signals.push({
    title: "Pressure around payment",
    detail: "Urgency combined with a payment request is a meaningful fraud-risk signal.",
    severity: "warning"
  });
  if (credentials.length) signals.push({
    title: "Sensitive credential language",
    detail: "The message involves OTPs, PINs, passwords, CVV codes, or wallet secrets.",
    severity: "danger"
  });
  if (medium.length) signals.push({
    title: "Verification needed",
    detail: "The wording includes urgency, account warnings, prizes, or secrecy that should be independently checked.",
    severity: "warning"
  });
  if (!signals.length) signals.push({
    title: hasUrl ? "Link present" : "No strong known pattern found",
    detail: hasUrl
      ? "A link by itself is not a scam signal. Check the exact domain before entering credentials or paying."
      : "The fallback did not find a strong known scam pattern in the supplied text.",
    severity: "info"
  });
  signals.push({ title: "Cloud AI degraded", detail: reason, severity: "info" });

  return {
    model: "PheleCheck Sentinel-1",
    version: "1.6-resilient-fusion",
    riskLevel,
    score,
    confidence: riskLevel === "high" ? 82 : riskLevel === "caution" ? 64 : 56,
    summary: riskLevel === "high"
      ? "Multiple independent fraud-risk signals are present. Do not pay or share sensitive information until independently verified."
      : riskLevel === "caution"
      ? "Some details deserve verification, but the available evidence is not enough for a high-risk conclusion."
      : "No strong fraud pattern was detected in the supplied text. This does not prove the source is legitimate.",
    signals,
    actions: riskLevel === "low"
      ? [
          "Verify the sender or website through an official channel if money or account access is involved.",
          "Do not share OTPs, PINs, passwords, CVV codes, or wallet recovery phrases."
        ]
      : [
          "Pause before paying, clicking, or sharing sensitive information.",
          "Verify the person, company, website, or payment destination independently.",
          "Do not share OTPs, PINs, passwords, CVV codes, or wallet recovery phrases."
        ],
    language,
    source: "local-fallback",
    webEvidence
  };
}

function normalize(data: any, language: string, webEvidence: WebEvidence[], text = "") {
  const allowedRisk = new Set(["low", "caution", "high", "unknown"]);
  let riskLevel = allowedRisk.has(data?.riskLevel) ? data.riskLevel : "unknown";
  let score = Number(data?.score);
  let confidence = Number(data?.confidence);
  const guard = deterministicGuard(text);
  if (guard.high) {
    riskLevel = "high";
    score = Math.max(Number.isFinite(score) ? score : 0, guard.score);
    confidence = Math.max(Number.isFinite(confidence) ? confidence : 0, 84);
  }
  return {
    model: "PheleCheck Sentinel-1",
    version: "1.6-resilient-fusion",
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
  const scannerToken = Deno.env.get("CLOUDFLARE_URL_SCANNER_TOKEN") || apiToken;

  if (req.method === "GET") {
    return json({
      ok: Boolean(accountId && apiToken),
      service: "PheleCheck Sentinel-1 Gateway",
      model: { text: TEXT_MODEL_ID, textFallback: TEXT_FALLBACK_MODEL_ID, vision: VISION_MODEL_ID },
      configured: Boolean(accountId && apiToken),
      vision: true,
      webEvidence: ["Cloudflare URL Scanner", "Jina Reader live page", "Workers AI built-in web search for detected domains when available"],
      scannerTokenConfigured: Boolean(Deno.env.get("CLOUDFLARE_URL_SCANNER_TOKEN")),
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
    const [scannerEvidence, pageContext] = await Promise.all([
      Promise.all(domains.map((domain) => searchUrlScanner(accountId, scannerToken!, domain))),
      fetchLivePageContext(firstPublicUrl(text)),
    ]);
    const webEvidence: WebEvidence[] = [
      ...scannerEvidence,
      ...(pageContext.evidence ? [pageContext.evidence] : []),
    ];
    const evidenceText = webEvidence.length
      ? webEvidence.map((item) => JSON.stringify(item)).join("\n")
      : "No URL/domain was found in the supplied text.";
    const pageText = pageContext.excerpt
      ? `\n\nLIVE PAGE CONTENT (truncated):\n${pageContext.excerpt}\n\nDo not treat page availability as proof of legitimacy.`
      : "";

    const userInstruction = `Requested language: ${language}
Input type: ${inputType}

Content/context:
${text || "(image only)"}

LIVE WEB / THREAT EVIDENCE:
${evidenceText}${pageText}

Treat no-record/no-malicious results as non-conclusive. Analyze the user's actual content, not just keywords. Return strict JSON only.`;

    const userContent: any = imageBase64
      ? [
          { type: "text", text: userInstruction },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ]
      : userInstruction;

    const selectedModel = imageBase64 ? VISION_MODEL_ID : TEXT_MODEL_ID;
    const webSearchRequested = domains.length > 0 && !imageBase64;
    const aiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;

    const callChat = async (model: string, allowWebSearch: boolean) => {
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        max_completion_tokens: imageBase64 ? 650 : 420,
        temperature: 0.05,
      };
      if (allowWebSearch) {
        requestBody.web_search_options = { search_context_size: "low" };
      }
      const response = await fetch(aiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(imageBase64 ? 26000 : 18000),
        body: JSON.stringify(requestBody),
      });
      const body = await response.json().catch(() => ({}));
      return { response, body };
    };

    let attempt = await callChat(selectedModel, webSearchRequested);
    let cfResponse = attempt.response;
    let cloudflare = attempt.body;

    // Text gets a second independent hosted model attempt before local fallback.
    if (!imageBase64 && (!cfResponse.ok || cloudflare?.success === false)) {
      attempt = await callChat(TEXT_FALLBACK_MODEL_ID, false);
      cfResponse = attempt.response;
      cloudflare = attempt.body;
    }

    if (!cfResponse.ok || cloudflare?.success === false) {
      const message = String(
        cloudflare?.errors?.[0]?.message ??
        cloudflare?.error?.message ??
        cloudflare?.error ??
        `Cloudflare returned HTTP ${cfResponse.status}`
      ).slice(0, 500);

      const fallback = safeFallback(
        text,
        language,
        webEvidence,
        imageBase64
          ? "Cloud image analysis is temporarily unavailable, so PheleCheck did not guess from the image."
          : `Hosted AI was unavailable (${message}). PheleCheck used its conservative fallback analysis instead.`
      );

      if (imageBase64 && !deterministicGuard(text).high) {
        fallback.riskLevel = "unknown";
        fallback.score = 0;
        fallback.confidence = 0;
        fallback.summary = "Cloud image analysis is temporarily unavailable, so no image-risk conclusion was made.";
      }

      return json(fallback, 200, {
        "X-RateLimit-Remaining": String(quota.remaining),
        "X-PheleCheck-Degraded": "1"
      });
    }

    const citationCandidates = [
      ...(Array.isArray(cloudflare?.citations) ? cloudflare.citations : []),
      ...(Array.isArray(cloudflare?.choices?.[0]?.message?.citations) ? cloudflare.choices[0].message.citations : []),
      ...(Array.isArray(cloudflare?.choices?.[0]?.message?.annotations) ? cloudflare.choices[0].message.annotations : []),
    ];
    const citationUrls = [...new Set(citationCandidates.map((item: any) =>
      typeof item === "string"
        ? item
        : item?.url ?? item?.url_citation?.url ?? item?.citation?.url
    ).filter((item: unknown): item is string => typeof item === "string" && /^https?:\/\//i.test(item)))].slice(0, 5);

    const searchEvidence: WebEvidence[] = citationUrls.length && domains.length
      ? [{
          provider: "Cloudflare Workers AI Web Search",
          domain: domains[0],
          status: "checked",
          scansFound: citationUrls.length,
          maliciousMatches: 0,
          summary: `Live web search returned ${citationUrls.length} source citation(s) for additional context. Search results are supporting evidence, not proof of safety.`,
        }]
      : [];
    const combinedWebEvidence = [...webEvidence, ...searchEvidence];

    const rawModel = extractText(cloudflare);
    try {
      const parsed = parseModelJson(rawModel);
      return json(normalize(parsed, language, combinedWebEvidence, text), 200, { "X-RateLimit-Remaining": String(quota.remaining) });
    } catch {
      return json(
        safeFallback(text, language, combinedWebEvidence, "The AI response could not be validated as structured JSON."),
        200,
        { "X-RateLimit-Remaining": String(quota.remaining) }
      );
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message.slice(0, 500) : "Unknown Sentinel error" }, 500);
  }
});
