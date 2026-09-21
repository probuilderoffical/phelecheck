const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PheleCheck Privacy Policy</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#111;background:#f7f7f5}
main{background:#fff;border:1px solid #e5e5e1;border-radius:20px;padding:28px}
h1{font-size:32px;margin:0 0 6px}h2{font-size:19px;margin-top:28px}p,li{line-height:1.65;color:#555}
.small{font-size:13px}.box{padding:14px;border-radius:12px;background:#f0f1ee}
a{color:#111}
</style>
</head>
<body><main>
<h1>PheleCheck Privacy Policy</h1>
<p class="small">Last updated: September 21, 2026</p>
<p>PheleCheck helps users assess fraud and scam risk. This policy describes the data processed by the current release.</p>

<h2>Information you choose to submit</h2>
<p>PheleCheck processes messages, links, phone/payment context, screenshots, or QR images that you choose to check. Do not submit passwords, OTPs, PINs, CVV codes, full card numbers, private keys, seed phrases, or content you are not permitted to share.</p>
<p>Screenshots and QR images are processed for the current analysis and are not stored by PheleCheck as uploaded image files. Check history may store a short label or preview and the analysis result.</p>

<h2>Accounts, history, and preferences</h2>
<p>If you create an account, PheleCheck may store your email address, app preferences, check results, and optional memory/history data. Local history and memory can be turned off and cleared in Settings.</p>

<h2>AI and web-evidence processing</h2>
<p>PheleCheck currently uses Cloudflare-hosted AI for fraud-risk analysis. Link checks may use Cloudflare URL Scanner evidence. These services receive content necessary to perform the requested check. A lack of malicious web records does not prove a website is safe.</p>

<h2>Improve PheleCheck</h2>
<p>This option is off by default for new users. If enabled, reviewed and de-identified check metadata may be considered for future model improvement. New training candidates do not retain a direct user ID or link to the source check. PheleCheck does not automatically retrain on every submission.</p>

<h2>Reports</h2>
<p>Scam reports submitted through the app are stored for review. Reports do not automatically change reputation or train the model.</p>

<h2>Account deletion</h2>
<p>Signed-in users can permanently delete their account from Settings → Account → Delete account permanently. User-linked account data is deleted with the account, subject to any limited retention required for security, fraud prevention, or legal obligations.</p>
<p>If you cannot access the app, use the external deletion-request page:</p>
<p><a href="https://duqmwlgstztbjjzvejpk.supabase.co/functions/v1/account-deletion-request">Request account deletion</a></p>

<h2>Security and abuse prevention</h2>
<p>PheleCheck uses row-level database controls and server-side rate limiting. No online service can guarantee absolute security.</p>

<h2>Automated-risk limitations</h2>
<div class="box"><p>A Low Risk result does not prove legitimacy, and a High Risk result is not a declaration that a person or company is criminal. Important payments and identities should be verified independently through official channels.</p></div>

<h2>Changes</h2>
<p>This policy may be updated as PheleCheck adds features, providers, or legal/compliance requirements. Material changes should be reflected before they take effect.</p>
</main></body></html>`;

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  return new Response(page, { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
});
