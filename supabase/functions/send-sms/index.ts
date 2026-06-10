import { corsHeaders, json, errorRes, authApiKey, adminClient, detectEncoding, finalizeApiKeyRequestLog } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  const auth = await authApiKey(req);
  if (!auth) return errorRes("Invalid or missing API key", 401);

  let body: any;
  try { body = await req.json(); } catch { return errorRes("Invalid JSON body"); }

  const recipient = String(body.recipient ?? "").trim();
  const message = String(body.message ?? "");
  if (!recipient || !message) return errorRes("recipient and message are required");
  if (message.length > 1000) return errorRes("message too long (max 1000 chars)");
  if (!/^\+?\d{6,16}$/.test(recipient)) return errorRes("invalid recipient format");

  const { encoding, parts } = detectEncoding(message);
  const sb = adminClient();
  const { data, error } = await sb.from("messages").insert({
    client_id: auth.client_id,
    recipient, message, encoding, parts_count: parts,
    priority: Number.isFinite(body.priority) ? body.priority : 5,
    external_reference: body.external_reference ?? null,
    status: "queued",
  }).select().single();

  if (error) return errorRes(error.message, 500);
  await finalizeApiKeyRequestLog(auth.request_log_id, { status_code: 200, device_id: data.device_id ?? null });
  return json({ id: data.id, status: data.status, parts, encoding });
});
