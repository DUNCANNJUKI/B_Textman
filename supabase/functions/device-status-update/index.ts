import { corsHeaders, json, errorRes, authDevice, adminClient, dispatchEvent } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  const device = await authDevice(req);
  if (!device) return errorRes("Invalid device token", 401);

  let body: any;
  try { body = await req.json(); } catch { return errorRes("Invalid JSON body"); }
  const message_id = String(body.message_id ?? "");
  const status = String(body.status ?? "");
  if (!message_id || !status) return errorRes("message_id and status required");
  const valid = ["processing", "sent", "delivered", "failed"];
  if (!valid.includes(status)) return errorRes("invalid status");

  const sb = adminClient();
  const update: any = { status, device_id: device.id };
  const now = new Date().toISOString();
  if (status === "processing") update.processing_at = now;
  if (status === "sent") update.sent_at = now;
  if (status === "delivered") update.delivered_at = now;
  if (status === "failed") { update.failed_at = now; update.error_message = body.error_message ?? "device reported failure"; }

  const { error } = await sb.from("messages").update(update).eq("id", message_id).eq("client_id", device.client_id);
  if (error) return errorRes(error.message, 500);

  await sb.from("message_events").insert({ message_id, event_type: status, payload: body });

  // increment device totals
  if (status === "sent" || status === "delivered") {
    await sb.from("devices").update({ total_sms_sent: (device.total_sms_sent ?? 0) + 1, last_seen: now }).eq("id", device.id);
  } else if (status === "failed") {
    await sb.from("devices").update({ total_sms_failed: (device.total_sms_failed ?? 0) + 1, last_seen: now }).eq("id", device.id);
  }

  // Fire webhook (best-effort, async)
  const evt = `message.${status}`;
  dispatchEvent(device.client_id, evt, {
    message_id, status, recipient: body.recipient, device_id: device.id,
    error_message: update.error_message, timestamp: now,
  }, message_id).catch(() => {});

  return json({ ok: true });
});
