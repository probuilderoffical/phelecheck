import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" }
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const page = (message = "") => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Delete PheleCheck account</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:680px;margin:0 auto;padding:32px 20px;color:#111;background:#f7f7f5}
.card{background:#fff;border:1px solid #e5e5e1;border-radius:20px;padding:24px}
h1{font-size:30px;margin:0 0 10px}p{line-height:1.6;color:#555}
label{display:block;font-weight:700;margin:20px 0 8px}
input{width:100%;box-sizing:border-box;padding:14px;border:1px solid #d9d9d3;border-radius:12px;font-size:16px}
button{margin-top:18px;width:100%;padding:14px;border:0;border-radius:999px;background:#111;color:#fff;font-weight:800;font-size:15px}
.note{font-size:13px}.msg{padding:12px;border-radius:12px;background:#f0f1ee;margin-bottom:14px}
</style>
</head>
<body><div class="card">
<h1>Delete your PheleCheck account</h1>
<p>If you can sign in to the app, the fastest option is <strong>Settings → Account → Delete account permanently</strong>. That deletes your account and user-linked data.</p>
<p>If you cannot access the app, submit a deletion request below. PheleCheck may need to verify account ownership before completing the request.</p>
${message ? `<div class="msg">${message}</div>` : ""}
<form method="post">
<label for="email">Account email</label>
<input id="email" name="email" type="email" required autocomplete="email" maxlength="320">
<button type="submit">Request account deletion</button>
</form>
<p class="note">Do not enter passwords, OTPs, PINs, payment-card details, or other secrets.</p>
</div></body></html>`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return html(page());
  if (req.method !== "POST") return html(page("Method not allowed."), 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const subject = await sha256(`delete-request|${ip}`);

  const { data: quota, error: quotaError } = await admin.rpc("consume_sentinel_quota", {
    p_subject_hash: subject,
    p_limit: 3
  });
  if (quotaError) return html(page("Request protection is temporarily unavailable. Please try again later."), 503);
  const row = Array.isArray(quota) ? quota[0] : quota;
  if (row?.allowed === false) return html(page("Too many requests from this connection. Please try again later."), 429);

  let email = "";
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } else {
    const form = await req.formData();
    email = String(form.get("email") ?? "").trim().toLowerCase();
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return html(page("Enter a valid account email address."), 400);
  }

  const { error } = await admin.from("account_deletion_requests").insert({ email });
  if (error) return html(page("Could not submit the request. Please try again."), 500);

  return html(page("Your deletion request was received. Account ownership may be verified before deletion is completed."));
});
