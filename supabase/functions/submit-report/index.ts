import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const ua = (req.headers.get("user-agent") || "unknown").slice(0, 120);
  const subject = await sha256(`report|${ip}|${ua}`);

  const { data: quota, error: quotaError } = await admin.rpc("consume_sentinel_quota", {
    p_subject_hash: subject,
    p_limit: 5
  });

  if (!quotaError) {
    const row = Array.isArray(quota) ? quota[0] : quota;
    if (row?.allowed === false) return respond({ error: "Too many reports. Please try again later." }, 429);
  }

  const body = await req.json();
  const reportText = String(body?.reportText ?? "").trim().slice(0, 4000);
  const reportType = String(body?.reportType ?? "general").trim().slice(0, 40) || "general";
  if (reportText.length < 4) return respond({ error: "Report details are required." }, 400);

  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    userId = user?.id ?? null;
  }

  const { error } = await admin.from("scam_reports").insert({
    user_id: userId,
    report_type: reportType,
    report_text: reportText,
    status: "pending"
  });

  if (error) return respond({ error: "Could not submit report." }, 500);
  return respond({ ok: true });
});
