// Internal HTTP wrapper around dispatchEvent (helper lives in _shared/utils.ts).
import { corsHeaders, json, errorRes, dispatchEvent } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);
  const internalKey = req.headers.get("x-internal-key");
  if (internalKey !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return errorRes("Forbidden", 403);
  const body = await req.json().catch(() => ({}));
  const { client_id, event_type, payload, message_id } = body;
  if (!client_id || !event_type || !payload) return errorRes("client_id, event_type, payload required");
  await dispatchEvent(client_id, event_type, payload, message_id);
  return json({ ok: true });
});
