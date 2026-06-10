// Shared helpers for B TEXTMAN edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const errorRes = (msg: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ error: msg, ...extra }, status);

export const adminClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

const safeJson = (value: unknown) => {
  try {
    return JSON.parse(JSON.stringify(value ?? {}));
  } catch {
    return {};
  }
};

const headerSnapshot = (headers: Headers) => {
  const keep = ["content-type", "user-agent", "x-forwarded-for", "cf-connecting-ip", "x-real-ip"];
  return Object.fromEntries(keep.map((key) => [key, headers.get(key)]).filter(([, value]) => Boolean(value)) as [string, string][]);
};

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Validate Bearer API key. Returns { client_id, api_key_id } or null. */
export async function authApiKey(req: Request) {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const raw = m[1].trim();
  const hash = await sha256Hex(raw);
  const sb = adminClient();
  const { data } = await sb.from("api_keys").select("id,client_id,status,usage_count").eq("key_hash", hash).maybeSingle();
  if (!data || data.status !== "active") return null;
  const url = new URL(req.url);
  const forwardedFor = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? null;
  // fire-and-forget usage tracking
  sb.from("api_keys").update({
    last_used_at: new Date().toISOString(),
    usage_count: (data.usage_count ?? 0) + 1,
  }).eq("id", data.id).then(() => {});
  const { data: requestLog } = await sb.from("api_key_request_logs").insert({
    api_key_id: data.id,
    client_id: data.client_id,
    endpoint_path: url.pathname.replace(/^\/functions\/v1/, "") || url.pathname,
    request_method: req.method,
    ip_address: forwardedFor,
    user_agent: req.headers.get("user-agent"),
  }).select("id").maybeSingle();
  return { client_id: data.client_id as string, api_key_id: data.id as string, request_log_id: requestLog?.id as string | undefined };
}

export async function finalizeApiKeyRequestLog(request_log_id?: string, details?: {
  status_code?: number;
  device_id?: string | null;
  device_name?: string | null;
}) {
  if (!request_log_id) return;
  await adminClient().from("api_key_request_logs").update({
    status_code: details?.status_code ?? null,
    device_id: details?.device_id ?? null,
    device_name: details?.device_name ?? null,
  }).eq("id", request_log_id);
}

/** Validate device token. Returns device row or null. */
export async function authDevice(req: Request) {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1].trim();
  const sb = adminClient();
  const { data } = await sb.from("devices").select("*").eq("device_token", token).maybeSingle();
  return data;
}

export function detectEncoding(text: string) {
  const isU = /[^\u0000-\u007F]/.test(text);
  return {
    encoding: isU ? "UCS2" : "GSM7",
    parts: Math.max(1, Math.ceil(text.length / (isU ? 70 : 160))),
  };
}

// ===== Webhook dispatch (shared so functions can fire events directly) =====
async function hmacSha256Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function dispatchEvent(client_id: string, event_type: string, payload: Record<string, unknown>, message_id?: string) {
  const sb = adminClient();
  const { data: hooks } = await sb.from("webhooks").select("*").eq("client_id", client_id).eq("active", true);
  if (!hooks?.length) return;
  const requestBody = { event: event_type, data: payload, timestamp: new Date().toISOString() };
  const body = JSON.stringify(requestBody);
  await Promise.all(hooks.filter((h: any) => (h.events ?? []).includes(event_type)).map(async (h: any) => {
    const { data: lastAttempt } = await sb.from("webhook_deliveries")
      .select("attempt")
      .eq("webhook_id", h.id)
      .eq("event_type", event_type)
      .eq("message_id", message_id ?? null)
      .order("attempt", { ascending: false })
      .limit(1)
      .maybeSingle();
    const attempt = Number(lastAttempt?.attempt ?? 0) + 1;
    let status = 0; let respText = ""; let ok = false; let responseHeaders: Record<string, string> = {}; let durationMs = 0; let signature: string | null = null;
    const requestHeaders = { "Content-Type": "application/json", "X-BTextman-Event": event_type };
    try {
      signature = await hmacSha256Hex(h.secret, body);
      const startedAt = Date.now();
      const r = await fetch(h.url, {
        method: "POST",
        headers: { ...requestHeaders, "X-BTextman-Signature": signature },
        body,
      });
      durationMs = Date.now() - startedAt;
      status = r.status; respText = (await r.text()).slice(0, 2000); ok = r.ok;
      responseHeaders = Object.fromEntries(r.headers.entries());
      await sb.from("webhook_deliveries").insert({
        webhook_id: h.id, message_id: message_id ?? null, event_type, payload,
        target_url: h.url, request_body: safeJson(requestBody), request_headers: safeJson({ ...requestHeaders, "X-BTextman-Signature": signature }),
        response_headers: safeJson(responseHeaders), request_signature: signature, duration_ms: durationMs,
        response_status: status, response_body: respText, attempt, succeeded: ok, delivered_at: new Date().toISOString(),
      });
      await sb.from("webhooks").update({
        last_status: status,
        failure_count: ok ? 0 : (h.failure_count ?? 0) + 1,
        active: ok ? true : ((h.failure_count ?? 0) + 1 < 10),
      }).eq("id", h.id);
      return;
    } catch (e) { respText = String((e as Error).message ?? e).slice(0, 2000); }
    await sb.from("webhook_deliveries").insert({
      webhook_id: h.id, message_id: message_id ?? null, event_type, payload,
      target_url: h.url, request_body: safeJson(requestBody), request_headers: safeJson(headerSnapshot(new Headers(requestHeaders))),
      response_headers: safeJson(responseHeaders), request_signature: signature, duration_ms: durationMs,
      response_status: status, response_body: respText, attempt, succeeded: ok, delivered_at: new Date().toISOString(),
    });
    await sb.from("webhooks").update({
      last_status: status,
      failure_count: ok ? 0 : (h.failure_count ?? 0) + 1,
      active: ok ? true : ((h.failure_count ?? 0) + 1 < 10),
    }).eq("id", h.id);
  }));
}
