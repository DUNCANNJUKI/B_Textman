import { corsHeaders, json, errorRes, authApiKey, adminClient, detectEncoding, finalizeApiKeyRequestLog } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  const auth = await authApiKey(req);
  if (!auth) return errorRes("Invalid or missing API key", 401);

  let body: any;
  try { body = await req.json(); } catch { return errorRes("Invalid JSON body"); }
  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) return errorRes("messages array is required");
  if (messages.length > 5000) return errorRes("max 5000 messages per request");

  const rows: any[] = [];
  for (const m of messages) {
    const recipient = String(m.recipient ?? "").trim();
    const text = String(m.message ?? "");
    if (!recipient || !text) continue;
    const { encoding, parts } = detectEncoding(text);
    rows.push({
      client_id: auth.client_id, recipient, message: text, encoding,
      parts_count: parts, status: "queued", priority: m.priority ?? 5,
      external_reference: m.external_reference ?? null,
    });
  }
  if (rows.length === 0) return errorRes("no valid messages");

  const sb = adminClient();
  const { data, error } = await sb.from("messages").insert(rows).select("id");
  if (error) return errorRes(error.message, 500);
  await finalizeApiKeyRequestLog(auth.request_log_id, { status_code: 200 });
  return json({ queued: data?.length ?? 0, ids: data?.map((d: any) => d.id) ?? [] });
});
