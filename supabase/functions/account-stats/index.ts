import { corsHeaders, json, errorRes, authApiKey, adminClient, finalizeApiKeyRequestLog } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return errorRes("Method not allowed", 405);

  const auth = await authApiKey(req);
  if (!auth) return errorRes("Invalid or missing API key", 401);

  const sb = adminClient();
  const [{ data: msgs }, { data: devs }] = await Promise.all([
    sb.from("messages").select("status").eq("client_id", auth.client_id),
    sb.from("devices").select("status").eq("client_id", auth.client_id),
  ]);

  const counts = { queued: 0, processing: 0, sent: 0, delivered: 0, failed: 0, cancelled: 0 };
  (msgs ?? []).forEach((m: any) => { counts[m.status as keyof typeof counts] = (counts[m.status as keyof typeof counts] ?? 0) + 1; });
  const devicesOnline = (devs ?? []).filter((d: any) => d.status === "online" || d.status === "sending").length;

  await finalizeApiKeyRequestLog(auth.request_log_id, { status_code: 200 });
  return json({
    messages: counts,
    devices: { total: devs?.length ?? 0, online: devicesOnline },
    success_rate: (() => {
      const ok = counts.sent + counts.delivered;
      const total = ok + counts.failed;
      return total ? Math.round((ok / total) * 100) : 0;
    })(),
  });
});
