const endpoint = process.env.SENTINEL_URL || "https://duqmwlgstztbjjzvejpk.supabase.co/functions/v1/sentinel-analyze";

const cases = [
  { id:"legit-1", group:"benign", text:"Your order #4821 has shipped and is expected Tuesday. Track it in the official store app.", forbidden:["high"] },
  { id:"legit-2", group:"benign", text:"Invoice 2026-104 for PKR 4,500 is attached. Payment is due in 14 days under our existing contract.", forbidden:["high"] },
  { id:"legit-3", group:"benign", text:"Your bank statement for August is ready. Open the bank app directly to view it.", forbidden:["high"] },
  { id:"legit-4", group:"benign", text:"Meeting moved to 3 PM. Join using the same company Teams link in your calendar.", forbidden:["high"] },
  { id:"legit-5", group:"benign", text:"https://www.google.com", forbidden:["high"] },
  { id:"legit-6", group:"benign", text:"Please transfer the agreed PKR 2,000 monthly rent to the same landlord account used for the last year.", forbidden:["high"] },
  { id:"legit-7", group:"benign", text:"Your package is out for delivery. No payment is required.", forbidden:["high"] },
  { id:"legit-8", group:"benign", text:"Reset your password from the official app settings if you requested a reset. We will never ask for your OTP.", forbidden:["high"] },
  { id:"legit-9", group:"benign", text:"Receipt: USD 12.99 paid successfully for your music subscription.", forbidden:["high"] },
  { id:"legit-10", group:"benign", text:"Company payroll will arrive Friday. Contact HR through the internal directory for questions.", forbidden:["high"] },

  { id:"scam-1", group:"scam", text:"Urgent! Pay a verification fee today to unlock your prize. Do not tell anyone.", required:["high"] },
  { id:"scam-2", group:"scam", text:"Send me the OTP you just received so I can secure your bank account.", required:["high"] },
  { id:"scam-3", group:"scam", text:"Guaranteed crypto profit. Send $500 now and I will double it tonight.", required:["high"] },
  { id:"scam-4", group:"scam", text:"You got the job. Pay a processing fee by gift card before we can release your contract.", required:["high"] },
  { id:"scam-5", group:"scam", text:"Your account is blocked. Click this link immediately and enter your password and PIN to restore access: http://secure-login-example.xyz", required:["high"] },
  { id:"scam-6", group:"scam", text:"Customs is holding your parcel. Wire PKR 18,000 in the next hour or it will be destroyed.", required:["high"] },
  { id:"scam-7", group:"scam", text:"Main bank se bol raha hoon. Apna OTP aur PIN abhi bhejo warna account band ho jayega.", required:["high"] },
  { id:"scam-8", group:"scam", text:"Aap inaam jeet gaye. Prize release karne ke liye pehle verification fee bhejein aur kisi ko na batayein.", required:["high"] },

  { id:"amb-1", group:"ambiguous", text:"Can you pay me back today?", forbidden:["high"] },
  { id:"amb-2", group:"ambiguous", text:"Your account needs verification. Open the official app and follow the instructions.", forbidden:["high"] },
  { id:"amb-3", group:"ambiguous", text:"Someone called claiming to be from my bank but I am not sure what they wanted.", forbidden:["high"] },
  { id:"amb-4", group:"ambiguous", text:"This seller wants me to move the conversation off the marketplace before I buy.", forbidden:["high"] }
];

async function analyze(test) {
  const res = await fetch(endpoint, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:test.text, language:"en", inputType:"message"}),
    signal: AbortSignal.timeout(60_000)
  });
  const body = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(`${test.id}: HTTP ${res.status} ${JSON.stringify(body)}`);
  return body;
}

let failures = [];
let results = [];

for (let i = 0; i < cases.length; i += 4) {
  const batch = cases.slice(i, i + 4);
  const batchResults = await Promise.all(batch.map(async (test) => {
    try {
      const result = await analyze(test);
      return { test, result };
    } catch (error) {
      return { test, error };
    }
  }));

  for (const item of batchResults) {
    const { test } = item;
    if (item.error) {
      failures.push(`${test.id}: request failed: ${item.error instanceof Error ? item.error.message : String(item.error)}`);
      continue;
    }
    const result = item.result;
    results.push({id:test.id,group:test.group,riskLevel:result.riskLevel,score:result.score,confidence:result.confidence});
    if (test.required && !test.required.includes(result.riskLevel)) {
      failures.push(`${test.id}: expected ${test.required.join("/")} but got ${result.riskLevel}`);
    }
    if (test.forbidden && test.forbidden.includes(result.riskLevel)) {
      failures.push(`${test.id}: forbidden ${result.riskLevel}`);
    }
  }
}

const benignHigh = results.filter(r=>r.group==="benign" && r.riskLevel==="high").length;
const scamNotHigh = results.filter(r=>r.group==="scam" && r.riskLevel!=="high").length;
console.table(results);
console.log(JSON.stringify({
  total:results.length,
  benignHigh,
  scamNotHigh,
  pass:failures.length===0,
  failures
}, null, 2));

if (failures.length) process.exit(1);

// Regression suite version 1.1: bounded concurrency + request timeout
