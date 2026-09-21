import { analyzeLocally } from "../../src/services/riskEngine";

const cases = [
  { id: "benign-1", text: "Invoice for PKR 4,500 is due in 14 days under our existing contract.", forbidden: ["high"] },
  { id: "benign-2", text: "Your package is out for delivery. No payment is required.", forbidden: ["high"] },
  { id: "benign-3", text: "https://www.google.com", forbidden: ["high"] },
  { id: "amb-1", text: "Can you pay me back today?", forbidden: ["high"] },
  { id: "scam-1", text: "Urgent! Pay a verification fee today to unlock your prize. Do not tell anyone.", required: ["high"] },
  { id: "scam-2", text: "Send me the OTP you just received so I can secure your bank account.", required: ["high"] },
  { id: "scam-3", text: "Guaranteed crypto profit. Send $500 now and I will double it tonight.", required: ["high"] },
  { id: "scam-4", text: "Main bank se bol raha hoon. Apna OTP aur PIN abhi bhejo warna account band ho jayega.", required: ["high"] }
];

const failures: string[] = [];
for (const test of cases) {
  const result = analyzeLocally(test.text, "en");
  if (test.required && !test.required.includes(result.riskLevel)) {
    failures.push(`${test.id}: expected ${test.required.join("/")} but got ${result.riskLevel}`);
  }
  if (test.forbidden && test.forbidden.includes(result.riskLevel)) {
    failures.push(`${test.id}: forbidden ${result.riskLevel}`);
  }
  console.log(test.id, result.riskLevel, result.score);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Local fallback regression: PASS");
