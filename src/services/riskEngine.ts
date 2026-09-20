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
};

const dangerous = [
  "guaranteed return", "double your money", "send money", "pay now", "urgent payment",
  "investment return", "crypto profit", "gift card", "otp", "pin code", "advance fee",
  "job fee", "processing fee", "wire transfer", "10k", "20k", "profit",
  "paise bhejo", "paisa bhejo", "jaldi pay", "return milega", "munafa", "investment",
  "पैसे भेजो", "गारंटी", "मुनाफा", "فوری ادائیگی", "پیسے بھیجو", "منافع"
];

const caution = [
  "limited time", "act now", "verify account", "click link", "winner", "prize",
  "account blocked", "suspended", "refund", "delivery fee", "customs fee",
  "aaj hi", "abhi", "verify karo", "لنک", "اکاؤنٹ بند", "انعام"
];

function hasAny(text: string, list: string[]) {
  const lower = text.toLowerCase();
  return list.filter((term) => lower.includes(term));
}

export function analyzeLocally(input: string, language = "en"): RiskAnalysis {
  const dangerHits = hasAny(input, dangerous);
  const cautionHits = hasAny(input, caution);
  const money = /(\$|€|£|₹|rs\.?|pkr|usd|eur|\b\d{3,}\b)/i.test(input);
  const url = /(https?:\/\/|www\.|bit\.ly|tinyurl|t\.me\/)/i.test(input);

  let score = 18 + dangerHits.length * 18 + cautionHits.length * 8 + (money ? 10 : 0) + (url ? 8 : 0);
  score = Math.max(8, Math.min(96, score));

  const riskLevel: RiskLevel = score >= 70 ? "high" : score >= 40 ? "caution" : "low";
  const signals: RiskSignal[] = [];

  if (dangerHits.length) signals.push({
    title: "High-risk language detected",
    detail: "The content contains language commonly associated with payment, investment or credential scams.",
    severity: "danger"
  });
  if (money) signals.push({
    title: "Money or payment context",
    detail: "A financial amount or payment-related pattern appears in the content.",
    severity: riskLevel === "high" ? "danger" : "warning"
  });
  if (cautionHits.length || url) signals.push({
    title: "Verification recommended",
    detail: "Urgency, link-clicking or account-verification language should be checked independently.",
    severity: "warning"
  });
  if (!signals.length) signals.push({
    title: "No strong local signal found",
    detail: "The local fallback did not find a known pattern. This is not proof that the content is safe.",
    severity: "info"
  });

  return {
    model: "PheleCheck Sentinel-1",
    version: "0.1-local",
    riskLevel,
    score,
    confidence: Math.min(92, 52 + dangerHits.length * 8 + cautionHits.length * 3),
    summary: riskLevel === "high"
      ? "Multiple fraud-risk signals were detected. Do not send money until the request is independently verified."
      : riskLevel === "caution"
      ? "Some risk signals need independent verification before you trust, click or pay."
      : "No strong known risk pattern was detected locally, but independent verification is still recommended.",
    signals,
    actions: [
      "Do not send money until the identity and request are independently verified.",
      "Contact the person or company through an official channel you find yourself.",
      "Never share OTPs, PINs, passwords or full card details.",
      "Check the website, payment account or phone number separately when possible."
    ],
    language,
    source: "local-fallback"
  };
}
