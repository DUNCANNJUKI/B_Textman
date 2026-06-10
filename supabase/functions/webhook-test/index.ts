// Test endpoint: dispatches a custom event payload to a specific webhook
// and returns the signature, request body, response, and the persisted delivery row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, errorRes, adminClient } from "../_shared/utils.ts";

async function hmacSha256Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return errorRes("Unauthorized", 401);
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } });
  const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
  if (!claims?.claims?.sub) return errorRes("Unauthorized", 401);

  const { webhook_id, event_type = "test.ping", payload } = await req.json().catch(() => ({}));
  if (!webhook_id) return errorRes("webhook_id required", 400);

  const sb = adminClient();
  const { data: hook } = await sb.from("webhooks").select("*").eq("id", webhook_id).maybeSingle();
  if (!hook) return errorRes("Webhook not found", 404);

  // Verify ownership via RLS (caller must own it OR be admin)
  const { data: ownedCheck } = await userClient.from("webhooks").select("id").eq("id", webhook_id).maybeSingle();
  if (!ownedCheck) return errorRes("Forbidden", 403);

  const eventPayload = payload ?? { message: "Hello from B-TEXTMAN", at: new Date().toISOString() };
  const body = JSON.stringify({ event: event_type, data: eventPayload, timestamp: new Date().toISOString() });
  const signature = await hmacSha256Hex(hook.secret, body);

  const { data: lastAttempt } = await sb.from("webhook_deliveries")
    .select("attempt")
    .eq("webhook_id", hook.id)
    .eq("event_type", event_type)
    .is("message_id", null)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();
  const attempt = Number(lastAttempt?.attempt ?? 0) + 1;

  let status = 0, respText = "", ok = false, errMsg = "";
  const start = Date.now();
  try {
    const r = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BTextman-Signature": signature,
        "X-BTextman-Event": event_type,
      },
      body,
    });
    status = r.status;
    respText = (await r.text()).slice(0, 4000);
    ok = r.ok;
  } catch (e) {
    errMsg = String((e as Error).message ?? e);
  }
  const duration_ms = Date.now() - start;

  const { data: delivery } = await sb.from("webhook_deliveries").insert({
    webhook_id: hook.id, event_type, payload: eventPayload,
    response_status: status, response_body: respText || errMsg, attempt, succeeded: ok,
    delivered_at: new Date().toISOString(),
  }).select().single();

  await sb.from("webhooks").update({
    last_status: status,
    failure_count: ok ? 0 : (hook.failure_count ?? 0) + 1,
  }).eq("id", hook.id);

  return json({
    ok,
    duration_ms,
    request: {
      url: hook.url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BTextman-Signature": signature,
        "X-BTextman-Event": event_type,
      },
      body,
    },
    response: { status, body: respText, error: errMsg || null },
    signature,
    delivery,
  });
});
