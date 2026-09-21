export type RiskLevel = "low" | "caution" | "high" | "unknown";

export type RiskSignal = {
  title: string;
  detail: string;
  severity: "info" | "warning" | "danger";
};

export type RiskAnalysis = {
  model: string;
  version: string;
  riskLevel: RiskLevel;
  score: number;
  confidence: number;
  summary: string;
  signals: RiskSignal[];
  actions: string[];
  language: string;
  source: "sentinel" | "local-fallback";
  webEvidence?: Array<{
    provider: string;
    domain: string;
    status: "checked" | "no-records" | "unavailable";
    scansFound: number;
    maliciousMatches: number;
    latestScanAt?: string;
    summary: string;
  }>;
};

const strongSignals = [
  "send money", "pay now", "urgent payment", "advance fee", "processing fee",
  "verification fee", "job fee", "wire transfer", "gift card", "crypto profit",
  "guaranteed return", "double your money", "share otp", "send otp", "send pin",
  "seed phrase", "private key", "paise bhejo", "paisa bhejo", "jaldi pay",
  "فوری ادائیگی", "پیسے بھیجو", "منافع", "पैसे भेजो"
];

const mediumSignals = [
  "limited time", "act now", "verify account", "account blocked", "account suspended",
  "click link", "claim prize", "winner", "prize", "refund fee", "delivery fee",
  "customs fee", "do not tell anyone", "keep this secret", "aaj hi", "abhi",
  "verify karo", "اکاؤنٹ بند", "انعام"
];

const credentialTerms = ["otp", "pin", "password", "cvv", "seed phrase", "private key"];
const paymentTerms = ["pay", "payment", "fee", "bank", "wallet", "transfer", "money", "crypto", "gift card"];
const urgencyTerms = ["urgent", "immediately", "today", "now", "within 24 hours", "limited time", "act now"];

function hits(text: string, list: string[]) {
  const lower = text.toLowerCase();
  return list.filter((term) => lower.includes(term));
}

function containsUrl(text: string) {
  return /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|pk|uk|ae|in)\b)/i.test(text);
}

function containsMoney(text: string) {
  return /(\$|€|£|₹|rs\.?|pkr|usd|eur|aed|\b\d{3,}(?:[.,]\d+)?\b)/i.test(text);
}

export function analyzeLocally(input: string, language = "en"): RiskAnalysis {
  const text = input.trim();
  if (!text) {
    return {
      model: "PheleCheck Sentinel-1",
      version: "0.2-local",
      riskLevel: "unknown",
      score: 0,
      confidence: 0,
      summary: "Not enough information was provided to assess risk.",
      signals: [{ title: "Not enough evidence", detail: "Add the message, link or request you want checked.", severity: "info" }],
      actions: ["Add more context before relying on a risk result."],
      language,
      source: "local-fallback"
    };
  }

  const strong = hits(text, strongSignals);
  const medium = hits(text, mediumSignals);
  const credentials = hits(text, credentialTerms);
  const payments = hits(text, paymentTerms);
  const urgency = hits(text, urgencyTerms);
  const hasUrl = containsUrl(text);
  const hasMoney = containsMoney(text);

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

  // A URL, money amount, or ordinary payment language alone is not evidence of a scam.
  if (independentStrongFactors < 2) score = Math.min(score, 54);
  if (!strong.length && !medium.length && !credentials.length && !(payments.length && urgency.length)) {
    score = hasUrl || hasMoney ? 18 : 12;
  }

  score = Math.max(5, Math.min(96, score));

  let riskLevel: RiskLevel;
  if (independentStrongFactors >= 2 && score >= 68) riskLevel = "high";
  else if (score >= 34) riskLevel = "caution";
  else riskLevel = "low";

  const signals: RiskSignal[] = [];

  if (strong.length) {
    signals.push({
      title: "Direct scam-style request",
      detail: "The content contains a direct payment, fee, credential, or guaranteed-return pattern that needs verification.",
      severity: independentStrongFactors >= 2 ? "danger" : "warning"
    });
  }

  if (urgency.length && payments.length) {
    signals.push({
      title: "Pressure around payment",
      detail: "Urgency combined with a payment request is a meaningful fraud-risk signal.",
      severity: "warning"
    });
  }

  if (credentials.length) {
    signals.push({
      title: "Sensitive credential request",
      detail: "Requests involving OTPs, PINs, passwords, CVV codes, or wallet secrets are high-risk.",
      severity: "danger"
    });
  }

  if (medium.length) {
    signals.push({
      title: "Verification needed",
      detail: "The wording includes urgency, account warnings, prizes, or secrecy that should be independently checked.",
      severity: "warning"
    });
  }

  if (hasUrl && signals.length === 0) {
    signals.push({
      title: "Link present",
      detail: "A link by itself is not a scam signal. Check the exact domain and destination before entering credentials or paying.",
      severity: "info"
    });
  }

  if (signals.length === 0) {
    signals.push({
      title: "No strong known pattern found",
      detail: "The local fallback did not find a strong scam pattern in the text provided.",
      severity: "info"
    });
  }

  const confidence = riskLevel === "high"
    ? Math.min(92, 66 + independentStrongFactors * 8)
    : riskLevel === "caution"
    ? Math.min(78, 48 + medium.length * 5 + strong.length * 6)
    : 58;

  return {
    model: "PheleCheck Sentinel-1",
    version: "0.2-local",
    riskLevel,
    score,
    confidence,
    summary: riskLevel === "high"
      ? "Multiple independent fraud-risk signals are present. Do not pay or share sensitive information until the request is independently verified."
      : riskLevel === "caution"
      ? "Some details deserve verification, but the available evidence is not enough to label the content as a scam."
      : "No strong fraud pattern was detected in the text provided. This does not prove the source is legitimate.",
    signals,
    actions: riskLevel === "low"
      ? [
          "Verify the sender or website through an official channel if money or account access is involved.",
          "Do not share OTPs, PINs, passwords, CVV codes, or wallet recovery phrases."
        ]
      : [
          "Pause before paying, clicking, or sharing sensitive information.",
          "Verify the person or company using contact details you find independently.",
          "Do not share OTPs, PINs, passwords, CVV codes, or wallet recovery phrases.",
          "Check the exact website domain, payment account, or phone number separately."
        ],
    language,
    source: "local-fallback"
  };
}
