import { analyzeLocally } from "../../src/services/riskEngine";

type Case = {
  id: string;
  text: string;
  required?: Array<"low" | "caution" | "high" | "unknown">;
  forbidden?: Array<"low" | "caution" | "high" | "unknown">;
};

const cases: Case[] = [
  { id: "benign-invoice", text: "Invoice for PKR 4,500 is due in 14 days under our existing contract.", forbidden: ["high"] },
  { id: "benign-delivery", text: "Your package is out for delivery. No payment is required.", forbidden: ["high"] },
  { id: "benign-link", text: "https://www.google.com", forbidden: ["high"] },
  { id: "benign-bank-app", text: "Your statement is ready. Open the official bank app directly to view it.", forbidden: ["high"] },
  { id: "benign-receipt", text: "Receipt: USD 12.99 paid successfully for your music subscription.", forbidden: ["high"] },
  { id: "benign-rent", text: "Please transfer the agreed monthly rent to the same landlord account used for the last year.", forbidden: ["high"] },
  { id: "benign-reset", text: "Reset your password from the official app settings if you requested a reset. We will never ask for your OTP.", forbidden: ["high"] },
  { id: "benign-meeting", text: "Meeting moved to 3 PM. Join using the same company Teams link in your calendar.", forbidden: ["high"] },

  { id: "amb-payback", text: "Can you pay me back today?", forbidden: ["high"] },
  { id: "amb-bank-call", text: "Someone called claiming to be from my bank but I am not sure what they wanted.", forbidden: ["high"] },
  { id: "amb-marketplace", text: "This seller wants me to move the conversation off the marketplace before I buy.", forbidden: ["high"] },
  { id: "amb-verification", text: "Your account needs verification. Open the official app and follow the instructions.", forbidden: ["high"] },

  { id: "benign-family-payment", text: "Please send me PKR 2,000 for the groceries we split yesterday.", forbidden: ["high"] },
  { id: "benign-vendor-change-notice", text: "Our supplier says their bank details changed. I will call our known contact before paying.", forbidden: ["high"] },
  { id: "amb-romance-emergency", text: "Someone I met online says they have an emergency and need money today.", forbidden: ["high"] },
  { id: "amb-support-call", text: "A caller says they are technical support and wants to help with my computer.", forbidden: ["high"] },
  { id: "amb-refund", text: "A seller says there may have been a refund mistake and asked me to check my account.", forbidden: ["high"] },
  { id: "amb-bec", text: "My boss emailed asking whether we can change the payment account for a supplier.", forbidden: ["high"] },

  { id: "scam-prize-fee", text: "Urgent! Pay a verification fee today to unlock your prize. Do not tell anyone.", required: ["high"] },
  { id: "scam-otp", text: "Send me the OTP you just received so I can secure your bank account.", required: ["high"] },
  { id: "scam-crypto", text: "Guaranteed crypto profit. Send $500 now and I will double it tonight.", required: ["high"] },
  { id: "scam-job", text: "You got the job. Pay a processing fee by gift card before we can release your contract.", required: ["high"] },
  { id: "scam-phish", text: "Your account is blocked. Click this link immediately and enter your password and PIN to restore access: http://secure-login-example.xyz", required: ["high"] },
  { id: "scam-customs", text: "Customs is holding your parcel. Wire PKR 18,000 in the next hour or it will be destroyed.", required: ["high"] },
  { id: "scam-roman-urdu-otp", text: "Main bank se bol raha hoon. Apna OTP aur PIN abhi bhejo warna account band ho jayega.", required: ["high"] },
  { id: "scam-roman-urdu-prize", text: "Aap inaam jeet gaye. Prize release karne ke liye pehle verification fee bhejein aur kisi ko na batayein.", required: ["high"] },
  { id: "scam-hindi", text: "आप इनाम जीत गए। पैसे भेजो और किसी को मत बताना।", required: ["high"] },
  { id: "scam-urdu", text: "آپ انعام جیت گئے ہیں۔ فوری ادائیگی کریں اور کسی کو نہ بتائیں۔", required: ["high"] },
  { id: "scam-gift-card", text: "Buy gift cards now and send me the codes to avoid account suspension.", required: ["high"] },
  { id: "scam-seed", text: "Share your seed phrase with support so we can recover your wallet.", required: ["high"] },
  { id: "scam-remote-access", text: "I am bank support. Install AnyDesk now so I can secure your online banking.", required: ["high"] },
  { id: "scam-recovery-fee", text: "We recovered your stolen crypto. Pay a recovery fee first to release your funds.", required: ["high"] },
  { id: "scam-loan-fee", text: "Your loan is approved. Pay the insurance and processing fee before we release the money.", required: ["high"] },
  { id: "scam-authority-threat", text: "This is the tax authority. Pay the penalty by wire today or a warrant will be issued.", required: ["high"] },
  { id: "scam-refund-overpay", text: "I accidentally overpaid your refund. Send the extra money back to this new account now.", required: ["high"] },
  { id: "scam-marketplace-offplatform", text: "I am the buyer. Move off the marketplace to WhatsApp and pay the courier deposit before I collect it.", required: ["high"] },
  { id: "scam-bec-account-change", text: "CEO request: use the new bank account below and transfer the supplier invoice immediately.", required: ["high"] }
];

const failures: string[] = [];
let highBenign = 0;
let missedScams = 0;

for (const test of cases) {
  const result = analyzeLocally(test.text, "en");

  if (test.required && !test.required.includes(result.riskLevel)) {
    failures.push(`${test.id}: expected ${test.required.join("/")} but got ${result.riskLevel}`);
    if (test.required.includes("high")) missedScams++;
  }

  if (test.forbidden && test.forbidden.includes(result.riskLevel)) {
    failures.push(`${test.id}: forbidden ${result.riskLevel}`);
    if (result.riskLevel === "high") highBenign++;
  }

  console.log(test.id, result.riskLevel, result.score, result.confidence);
}

console.log(JSON.stringify({
  total: cases.length,
  highBenign,
  missedScams,
  pass: failures.length === 0
}, null, 2));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Local fallback regression: PASS");
