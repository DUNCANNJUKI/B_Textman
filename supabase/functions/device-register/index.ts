import { corsHeaders, json, errorRes, authApiKey, adminClient, finalizeApiKeyRequestLog } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  const auth = await authApiKey(req);
  if (!auth) return errorRes("Invalid or missing API key", 401);

  let body: any;
  try { body = await req.json(); } catch { return errorRes("Invalid JSON body"); }
  const device_name = String(body.device_name ?? "").trim();
  if (!device_name) return errorRes("device_name required");

  const requestedToken = String(body.device_token ?? "").trim();
  const token = requestedToken || ("dev_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""));

  const sb = adminClient();
  const base = {
    client_id: auth.client_id,
    device_name,
    device_token: token,
    phone_number: body.phone_number ?? null,
    sim_operator: body.sim_operator ?? null,
    sim_slot: body.sim_slot ?? 1,
    android_version: body.android_version ?? null,
    app_version: body.app_version ?? null,
    status: "offline",
  };

  const existingId = String(body.device_id ?? "").trim();
  let data: any = null;
  let error: any = null;

  if (existingId) {
    const result = await sb.from("devices")
      .update(base)
      .eq("id", existingId)
      .eq("client_id", auth.client_id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    const result = await sb.from("devices").insert(base).select().single();
    data = result.data;
    error = result.error;
  }

  if (error) return errorRes(error.message, 500);
  await finalizeApiKeyRequestLog(auth.request_log_id, { status_code: 200, device_id: data.id, device_name: data.device_name });
  return json({ id: data.id, device_id: data.id, device_token: token, client_id: auth.client_id });
});
