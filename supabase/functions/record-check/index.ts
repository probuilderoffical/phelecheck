import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await req.json();
  const inputType = String(body?.inputType ?? "message").slice(0, 40);
  const inputPreview = String(body?.inputPreview ?? "").slice(0, 220);
  const analysis = body?.analysis ?? {};
  const saveHistory = body?.saveHistory === true;

  const riskLevel = ["low", "caution", "high", "unknown"].includes(analysis?.riskLevel)
    ? analysis.riskLevel
    : "unknown";
  const score = Number.isFinite(analysis?.score)
    ? Math.max(0, Math.min(100, analysis.score))
    : null;
  const confidence = Number.isFinite(analysis?.confidence)
    ? Math.max(0, Math.min(100, analysis.confidence))
    : null;

  const { data: profile } = await admin
    .from("profiles")
    .select("improve_phelecheck")
    .eq("id", user.id)
    .maybeSingle();

  let checkId: string | null = null;

  if (saveHistory) {
    const { data: check, error: insertError } = await admin
      .from("checks")
      .insert({
        user_id: user.id,
        input_type: inputType,
        input_preview: inputPreview,
        risk_level: riskLevel,
        risk_score: score,
        confidence,
        model_name: String(analysis?.model ?? "PheleCheck Sentinel-1").slice(0, 120),
        model_version: String(analysis?.version ?? "").slice(0, 60),
        result: analysis
      })
      .select("id")
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    checkId = check.id;
  }

  if (profile?.improve_phelecheck === true) {
    const deidentified = {
      input_type: inputType,
      risk_level: riskLevel,
      risk_score: score,
      confidence,
      model_name: analysis?.model ?? "PheleCheck Sentinel-1",
      model_version: analysis?.version ?? null,
      signals: Array.isArray(analysis?.signals)
        ? analysis.signals.map((s: any) => ({
            title: String(s?.title ?? "").slice(0, 160),
            severity: String(s?.severity ?? "info").slice(0, 20)
          }))
        : [],
      language: String(analysis?.language ?? "en").slice(0, 12)
    };

    await admin.from("training_candidates").insert({
      user_id: null,
      source_check_id: null,
      deidentified_payload: deidentified,
      review_status: "pending"
    });
  }

  return new Response(JSON.stringify({ ok: true, check_id: checkId }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
