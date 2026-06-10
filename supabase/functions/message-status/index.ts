import { corsHeaders, json, errorRes, authApiKey, adminClient, finalizeApiKeyRequestLog } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return errorRes("Method not allowed", 405);

  const auth = await authApiKey(req);
  if (!auth) return errorRes("Invalid or missing API key", 401);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return errorRes("id query parameter required");

  const sb = adminClient();
  const { data, error } = await sb.from("messages").select("*").eq("id", id).eq("client_id", auth.client_id).maybeSingle();
  if (error) return errorRes(error.message, 500);
  if (!data) return errorRes("not found", 404);
  await finalizeApiKeyRequestLog(auth.request_log_id, { status_code: 200, device_id: data.device_id ?? null });
  return json(data);
});
