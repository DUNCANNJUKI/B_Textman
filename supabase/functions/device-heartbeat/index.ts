import { corsHeaders, json, errorRes, authDevice, adminClient } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  const device = await authDevice(req);
  if (!device) return errorRes("Invalid device token", 401);
  if (device.status === "disabled") return errorRes("Device disabled", 403);

  let body: any = {};
  try { body = await req.json(); } catch {}

  const sb = adminClient();
  const update: any = {
    last_seen: new Date().toISOString(),
    status: device.status === "disabled" ? "disabled" : "online",
  };
  if (body.battery_level !== undefined) update.battery_level = Number(body.battery_level);
  if (body.signal_strength !== undefined) update.signal_strength = Number(body.signal_strength);
  if (body.internet_type) update.internet_type = String(body.internet_type);
  if (body.ip_address) update.ip_address = String(body.ip_address);
  if (body.app_version) update.app_version = String(body.app_version);

  await sb.from("devices").update(update).eq("id", device.id);
  await sb.from("device_logs").insert({ device_id: device.id, event_type: "heartbeat", payload: body });

  // ===== Recover stale "processing" messages =====
  // Any message stuck in "processing" for >90s (no status update from device) is
  // re-queued so it gets re-delivered. We bump retry_count and mark as failed
  // once max_retries is exceeded so the queue can't cycle forever.
  const staleCutoff = new Date(Date.now() - 90_000).toISOString();
  const { data: stale } = await sb.from("messages")
    .select("id, retry_count, max_retries, device_id")
    .eq("client_id", device.client_id)
    .eq("status", "processing")
    .lt("processing_at", staleCutoff);

  for (const m of stale ?? []) {
    const next = (m.retry_count ?? 0) + 1;
    if (next > (m.max_retries ?? 3)) {
      await sb.from("messages").update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_message: "device never acknowledged delivery (max retries exceeded)",
      }).eq("id", m.id);
      await sb.from("message_events").insert({
        message_id: m.id,
        event_type: "requeue.failed",
        payload: { source: "heartbeat", previous_device_id: m.device_id, retry_count: next },
      });
    } else {
      await sb.from("messages").update({
        status: "queued", device_id: null, processing_at: null, retry_count: next,
      }).eq("id", m.id);
      await sb.from("message_events").insert({
        message_id: m.id,
        event_type: "requeue.heartbeat",
        payload: { previous_device_id: m.device_id, retry_count: next },
      });
    }
  }

  // Acknowledge messages the device reports as already handled (id list)
  const acks: string[] = Array.isArray(body.delivered_ids) ? body.delivered_ids.map((x: any) => String(x)) : [];
  if (acks.length) {
    await sb.from("messages")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .in("id", acks)
      .eq("client_id", device.client_id)
      .in("status", ["processing", "queued"]);
    await sb.from("message_events").insert(
      acks.map((id) => ({
        message_id: id,
        event_type: "sent",
        payload: { device_id: device.id, device_token: device.device_token },
      })),
    );
  }

  // Pull queued messages for this client
  const { data: pending } = await sb.from("messages")
    .select("id, recipient, message, parts_count, encoding")
    .eq("client_id", device.client_id)
    .eq("status", "queued")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(20);

  const pendingIds = (pending ?? []).map((item: any) => item.id);
  if (pendingIds.length) {
    await sb.from("messages")
      .update({ status: "processing", device_id: device.id, processing_at: new Date().toISOString() })
      .in("id", pendingIds)
      .eq("client_id", device.client_id)
      .eq("status", "queued");
    await sb.from("message_events").insert(
      pendingIds.map((id: string) => ({
        message_id: id,
        event_type: "picked_up",
        payload: { device_id: device.id, device_name: device.device_name, client_id: device.client_id },
      })),
    );
  }

  // Best-effort realtime broadcast so app variants that listen on a channel still wake up.
  try {
    if (pendingIds.length) {
      const channel = sb.channel(`device:${device.device_token}`);
      await channel.send({
        type: "broadcast",
        event: "messages.pending",
        payload: { messages: pending },
      });
      await sb.removeChannel(channel);
    }
  } catch (_) { /* non-fatal */ }

  return json({
    ok: true,
    pending: pending ?? [],
    pending_sms: (pending ?? []).map((item: any) => ({
      id: item.id,
      phone_number: item.recipient,
      content: item.message,
      device_token: device.device_token,
      sim_slot: device.sim_slot ?? 1,
    })),
    assigned_count: pendingIds.length,
  });
});
